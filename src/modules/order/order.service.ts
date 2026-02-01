import { prisma } from "../../lib/prisma";
import ApiError from "../../utils/apiError";
import httpStatus from "http-status";
import { buildMeta, getPagination } from "../../utils/query/pagination";
import { buildSort } from "../../utils/query/sort";
import { buildOrderSearchWhere, buildSellerSearchWhere } from "../../utils/query/SearchbuildersByOrder";

export type Role = "CUSTOMER" | "SELLER" | "ADMIN";
export type OrderStatus = "PLACED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

const ALLOWED_STATUS: OrderStatus[] = ["PLACED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
const ORDER_SORT_FIELDS = ["createdAt", "total", "status"] as const;

const SELLER_CAN_SET: OrderStatus[] = ["PROCESSING", "SHIPPED", "DELIVERED"];

const ensureAuth = (userId: string) => {
  if (!userId) throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized");
};

const ensureCustomerOrAdmin = (userId: string, role: Role) => {
  ensureAuth(userId);
  if (role !== "CUSTOMER" && role !== "ADMIN") {
    throw new ApiError(httpStatus.FORBIDDEN, "Only customer can place order");
  }
};

const ensureAdmin = (role: Role) => {
  if (role !== "ADMIN") throw new ApiError(httpStatus.FORBIDDEN, "Admin only");
};

const ensureValidStatusFilter = (status: any) => {
  if (status && !ALLOWED_STATUS.includes(String(status) as any)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid status filter");
  }
};

// merge duplicate medicineId => sum quantities
const normalizeItems = (items: { medicineId: string; quantity: number }[]) => {
  const map = new Map<string, number>();

  for (const it of items) {
    const id = String(it.medicineId ?? "").trim();
    const qty = Number(it.quantity);

    if (!id) throw new ApiError(httpStatus.BAD_REQUEST, "medicineId is required");
    if (!Number.isInteger(qty) || qty <= 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, "quantity must be a positive integer");
    }

    map.set(id, (map.get(id) ?? 0) + qty);
  }

  return Array.from(map.entries()).map(([medicineId, quantity]) => ({ medicineId, quantity }));
};




  // Checkout


const checkout = async (
  userId: string,
  role: Role,
  payload: { address: string; phone: string; items: { medicineId: string; quantity: number }[] }
) => {
  ensureCustomerOrAdmin(userId, role);

  const address = String(payload.address ?? "").trim();
  const phone = String(payload.phone ?? "").trim();

  if (!address) throw new ApiError(httpStatus.BAD_REQUEST, "Address is required");
  if (!phone) throw new ApiError(httpStatus.BAD_REQUEST, "Phone is required");

  const items = normalizeItems(payload.items ?? []);
  if (items.length === 0) throw new ApiError(httpStatus.BAD_REQUEST, "No items provided");

  const medicineIds = items.map((i) => i.medicineId);

  const medicines = await prisma.medicine.findMany({
    where: { id: { in: medicineIds } },
    select: { id: true, price: true, stock: true, status: true, name: true, sellerId: true },
  });

  if (medicines.length !== medicineIds.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid medicineId found");
  }

  const medMap = new Map(medicines.map((m) => [m.id, m]));

  let total = 0;
  for (const item of items) {
    const med = medMap.get(item.medicineId)!;

    if (med.status !== "ACTIVE") {
      throw new ApiError(httpStatus.BAD_REQUEST, `Medicine not available: ${med.name}`);
    }
    if (med.stock < item.quantity) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Insufficient stock: ${med.name}`);
    }

    total += Number(med.price) * item.quantity;
  }

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        customerId: userId,
        address,
        phone,
        total,
        status: "PLACED",
      },
      select: { id: true },
    });

    await tx.orderItem.createMany({
      data: items.map((i) => {
        const med = medMap.get(i.medicineId)!;
        return {
          orderId: order.id,
          medicineId: i.medicineId,
          sellerId: med.sellerId,
          quantity: i.quantity,
          price: Number(med.price),
        };
      }),
    });

    for (const i of items) {
      const updated = await tx.medicine.updateMany({
        where: { id: i.medicineId, status: "ACTIVE", stock: { gte: i.quantity } },
        data: { stock: { decrement: i.quantity } },
      });

      if (updated.count === 0) {
        const med = medMap.get(i.medicineId)!;
        throw new ApiError(httpStatus.BAD_REQUEST, `Insufficient stock: ${med.name}`);
      }
    }

    //  Only do this if Medicine.status supports OUT_OF_STOCK
    // If your enum doesn't have it, comment out this block.
    await tx.medicine.updateMany({
      where: { id: { in: medicineIds }, stock: 0 },
      data: { status: "OUT_OF_STOCK" as any },
    });

    return tx.order.findUnique({
      where: { id: order.id },
      include: {
        items: { include: { medicine: true } },
        customer: { select: { id: true, name: true, email: true } }, 
      },
    });
  });

  return result;
};

/** -----------------------------------------
 *  Customer: My Orders (pagination + filter + search + sort)
 *  ----------------------------------------- */

const getMyOrders = async (userId: string, query: any) => {
  ensureAuth(userId);
  ensureValidStatusFilter(query.status);

  const { page, limit, skip } = getPagination(query);
  const { orderBy } = buildSort(query, ORDER_SORT_FIELDS, "createdAt");

  const where: any = { customerId: userId };

  if (query.status) where.status = String(query.status);

  const searchWhere = buildOrderSearchWhere(query.search);
  if (searchWhere?.OR) where.OR = searchWhere.OR;

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        items: { include: { medicine: true } },
        customer: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return { meta: buildMeta(page, limit, total), data: items };
};

/** -----------------------------------------
 *  Admin: All Orders (pagination + filters + search + sort)
 *  ----------------------------------------- */

const getAllOrders = async (role: Role, query: any) => {
  ensureAdmin(role);
  ensureValidStatusFilter(query.status);

  const { page, limit, skip } = getPagination(query);
  const { orderBy } = buildSort(query, ORDER_SORT_FIELDS, "createdAt");

  const where: any = {};

  if (query.status) where.status = String(query.status);
  if (query.customerId) where.customerId = String(query.customerId);

  const minTotal = query.minTotal !== undefined ? Number(query.minTotal) : undefined;
  const maxTotal = query.maxTotal !== undefined ? Number(query.maxTotal) : undefined;

  if (
    (minTotal !== undefined && !Number.isNaN(minTotal)) ||
    (maxTotal !== undefined && !Number.isNaN(maxTotal))
  ) {
    where.total = {};
    if (minTotal !== undefined && !Number.isNaN(minTotal)) where.total.gte = minTotal;
    if (maxTotal !== undefined && !Number.isNaN(maxTotal)) where.total.lte = maxTotal;
  }

  const searchWhere = buildOrderSearchWhere(query.search);
  if (searchWhere?.OR) where.OR = searchWhere.OR;

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        customer: { select: { id: true, name: true, email: true } },
        items: { include: { medicine: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return { meta: buildMeta(page, limit, total), data: items };
};

/** -----------------------------------------
 *  Single order
 *  ----------------------------------------- */

const getSingleOrder = async (orderId: string, userId: string, role: Role) => {
  ensureAuth(userId);

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { medicine: true } },
      customer: { select: { id: true, name: true, email: true } },
    },
  });

  if (!order) throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
  if (role !== "ADMIN" && order.customerId !== userId) {
    throw new ApiError(httpStatus.FORBIDDEN, "Forbidden");
  }

  return order;
};
// UpdateOrderItems
const updateOrderItems = async (
  orderId: string,
  userId: string,
  role: Role,
  newItemsInput: { medicineId: string; quantity: number }[]
) => {
  ensureAuth(userId);

  // normalize (merge duplicate medicineId)
  const newItems = normalizeItems(newItemsInput);

  return prisma.$transaction(async (tx) => {
    // 1) order fetch + ownership check
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) throw new ApiError(httpStatus.NOT_FOUND, "Order not found");

    if (role !== "ADMIN" && order.customerId !== userId) {
      throw new ApiError(httpStatus.FORBIDDEN, "Forbidden");
    }

    // 2) status rule
    if (order.status !== "PLACED") {
      throw new ApiError(httpStatus.BAD_REQUEST, "Only PLACED order can be edited");
    }

    // 3) build maps (old vs new)
    const oldMap = new Map(order.items.map(i => [i.medicineId, i.quantity]));
    const newMap = new Map(newItems.map(i => [i.medicineId, i.quantity]));

    const allMedicineIds = Array.from(new Set([
      ...Array.from(oldMap.keys()),
      ...Array.from(newMap.keys()),
    ]));

    // 4) fetch medicines (validate exist + active)
    const meds = await tx.medicine.findMany({
      where: { id: { in: allMedicineIds } },
      select: { id: true, price: true, stock: true, status: true, name: true, sellerId: true },
    });

    if (meds.length !== allMedicineIds.length) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid medicineId found");
    }

    const medMap = new Map(meds.map(m => [m.id, m]));

    // 5) compute diffs (delta = newQty - oldQty)
    // delta > 0 => need more stock (decrement)
    // delta < 0 => return stock (increment)
    const deltas = allMedicineIds.map((id) => {
      const oldQty = oldMap.get(id) ?? 0;
      const newQty = newMap.get(id) ?? 0;
      return { medicineId: id, oldQty, newQty, delta: newQty - oldQty };
    });

    // 6) validate availability for increased quantities
    for (const d of deltas) {
      if (d.newQty > 0) {
        const med = medMap.get(d.medicineId)!;
        if (med.status !== "ACTIVE") {
          throw new ApiError(httpStatus.BAD_REQUEST, `Medicine not available: ${med.name}`);
        }
      }
      if (d.delta > 0) {
        const med = medMap.get(d.medicineId)!;
        if (med.stock < d.delta) {
          throw new ApiError(httpStatus.BAD_REQUEST, `Insufficient stock: ${med.name}`);
        }
      }
    }

    // 7) apply stock updates (atomic)
    // 7a) decrement for delta>0
    for (const d of deltas) {
      if (d.delta > 0) {
        const updated = await tx.medicine.updateMany({
          where: { id: d.medicineId, status: "ACTIVE", stock: { gte: d.delta } },
          data: { stock: { decrement: d.delta } },
        });
        if (updated.count === 0) {
          const med = medMap.get(d.medicineId)!;
          throw new ApiError(httpStatus.BAD_REQUEST, `Insufficient stock: ${med.name}`);
        }
      }
    }

    // 7b) increment for delta<0
    for (const d of deltas) {
      if (d.delta < 0) {
        await tx.medicine.update({
          where: { id: d.medicineId },
          data: { stock: { increment: Math.abs(d.delta) } },
        });
      }
    }

    // 8) update order items table
    // simplest: delete all old items then re-create fresh snapshot
    await tx.orderItem.deleteMany({ where: { orderId } });

    await tx.orderItem.createMany({
      data: newItems.map((it) => {
        const med = medMap.get(it.medicineId)!;
        return {
          orderId,
          medicineId: it.medicineId,
          sellerId: med.sellerId,
          quantity: it.quantity,
          price: Number(med.price),
        };
      }),
    });

    // 9) recompute total from new items
    let total = 0;
    for (const it of newItems) {
      const med = medMap.get(it.medicineId)!;
      total += Number(med.price) * it.quantity;
    }

    await tx.order.update({
      where: { id: orderId },
      data: { total },
    });

    // 10) return updated order
    return tx.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { medicine: true } },
        customer: { select: { id: true, name: true, email: true } },
      },
    });
  });
};


//  Cancel order (customer/admin)


const cancelOrder = async (orderId: string, userId: string, role: Role) => {
  ensureAuth(userId);

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
  if (role !== "ADMIN" && order.customerId !== userId) {
    throw new ApiError(httpStatus.FORBIDDEN, "Forbidden");
  }
  if (order.status === "SHIPPED" || order.status === "DELIVERED") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Cannot cancel shipped/delivered order");
  }

  return prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" },
    });

    for (const item of order.items) {
      await tx.medicine.update({
        where: { id: item.medicineId },
        data: { stock: { increment: item.quantity }, status: "ACTIVE" as any },
      });
    }

    return tx.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { medicine: true } } },
    });
  });
};

/** -----------------------------------------
 *  Admin status update
 *  ----------------------------------------- */

const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
  if (!ALLOWED_STATUS.includes(status)) throw new ApiError(httpStatus.BAD_REQUEST, "Invalid status");

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new ApiError(httpStatus.NOT_FOUND, "Order not found");

  return prisma.order.update({
    where: { id: orderId },
    data: { status },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      items: { include: { medicine: true } },
    },
  });
};

/** -----------------------------------------
 *  Seller orders (pagination + filter + search + sort)
 *  ----------------------------------------- */

const getSellerOrders = async (sellerId: string, role: Role, query: any) => {
  ensureAuth(sellerId);

  if (role !== "SELLER" && role !== "ADMIN") {
    throw new ApiError(httpStatus.FORBIDDEN, "Only seller can view seller orders");
  }
  ensureValidStatusFilter(query.status);

  const { page, limit, skip } = getPagination(query);

  //  seller sort works (sort by ORDER fields via relation)
  const sortBy = ["createdAt", "status", "total"].includes(String(query.sortBy))
    ? String(query.sortBy)
    : "createdAt";
  const sortOrder = String(query.sortOrder) === "asc" ? "asc" : "desc";

  const where: any = { sellerId };

  // order status filter
  if (query.status) where.order = { status: String(query.status) };

  // search (order/customer/medicine)
  const searchWhere = buildSellerSearchWhere(query.search);
  if (searchWhere?.OR) {
    where.OR = searchWhere.OR;
    // keep status filter + OR together
    if (query.status) where.order = { status: String(query.status) };
  }

  const [items, total] = await Promise.all([
    prisma.orderItem.findMany({
      where,
      skip,
      take: limit,
      orderBy: { order: { [sortBy]: sortOrder } },
      include: {
        medicine: true,
        order: {
          include: {
            customer: { select: { id: true, name: true, email: true } },
          },
        },
      },
    }),
    prisma.orderItem.count({ where }),
  ]);

  return { meta: buildMeta(page, limit, total), data: items };
};

/** -----------------------------------------
 *  Seller update order status
 *  ----------------------------------------- */

const updateOrderStatusBySeller = async (
  sellerId: string,
  role: Role,
  orderId: string,
  status: OrderStatus
) => {
  ensureAuth(sellerId);

  if (role !== "SELLER" && role !== "ADMIN") {
    throw new ApiError(httpStatus.FORBIDDEN, "Only seller can update order status");
  }
  if (!ALLOWED_STATUS.includes(status)) throw new ApiError(httpStatus.BAD_REQUEST, "Invalid status");

  if (role === "SELLER" && !SELLER_CAN_SET.includes(status)) {
    throw new ApiError(httpStatus.FORBIDDEN, `Seller cannot set status to ${status}`);
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true },
  });
  if (!order) throw new ApiError(httpStatus.NOT_FOUND, "Order not found");

  const hasItem = await prisma.orderItem.findFirst({
    where: { orderId, sellerId },
    select: { id: true },
  });

  if (!hasItem && role !== "ADMIN") {
    throw new ApiError(httpStatus.FORBIDDEN, "You cannot update this order");
  }

  if (order.status === "DELIVERED" || order.status === "CANCELLED") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Cannot update delivered/cancelled order");
  }

  return prisma.order.update({
    where: { id: orderId },
    data: { status },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      items: { include: { medicine: true } },
    },
  });
};

export const orderService = {
  checkout,
  getMyOrders,
  getAllOrders,
  getSingleOrder,
  updateOrderItems,
  cancelOrder,
  updateOrderStatus,
  getSellerOrders,
  updateOrderStatusBySeller,
};
