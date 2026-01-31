import { prisma } from "../../lib/prisma";
import ApiError from "../../utils/apiError";
import httpStatus from "http-status";
import { buildMeta, getPagination } from "../../utils/query/pagination";
import { buildSort } from "../../utils/query/sort";

export type Role = "CUSTOMER" | "SELLER" | "ADMIN";
export type OrderStatus = "PLACED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

const ALLOWED_STATUS: OrderStatus[] = ["PLACED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
const ORDER_SORT_FIELDS = ["createdAt", "total", "status"] as const;

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

const ensureValidStatusFilter = (status: any) => {
  if (status && !ALLOWED_STATUS.includes(String(status) as any)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid status filter");
  }
};

const checkout = async (
  userId: string,
  role: Role,
  payload: { address: string; items: { medicineId: string; quantity: number }[] }
) => {
  ensureCustomerOrAdmin(userId, role);

  const address = String(payload.address ?? "").trim();
  if (!address) throw new ApiError(httpStatus.BAD_REQUEST, "Address is required");

  const items = normalizeItems(payload.items ?? []);
  if (items.length === 0) throw new ApiError(httpStatus.BAD_REQUEST, "No items provided");

  const medicineIds = items.map(i => i.medicineId);

  const medicines = await prisma.medicine.findMany({
    where: { id: { in: medicineIds } },
    select: { id: true, price: true, stock: true, status: true, name: true, sellerId: true },
  });

  if (medicines.length !== medicineIds.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid medicineId found");
  }

  const medMap = new Map(medicines.map(m => [m.id, m]));

  // validate + compute total
  let total = 0;
  for (const item of items) {
    const med = medMap.get(item.medicineId)!;

    if (med.status !== "ACTIVE") {
      throw new ApiError(httpStatus.BAD_REQUEST, `Medicine not available: ${med.name}`);
    }
    if (med.stock < item.quantity) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Insufficient stock: ${med.name}`);
    }

    total += med.price * item.quantity;
  }

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        customerId: userId,
        address,
        total,
        status: "PLACED",
      },
      select: { id: true },
    });

    // create order items (sellerId snapshot)
    await tx.orderItem.createMany({
      data: items.map((i) => {
        const med = medMap.get(i.medicineId)!;
        return {
          orderId: order.id,
          medicineId: i.medicineId,
          sellerId: med.sellerId, // ✅ required
          quantity: i.quantity,
          price: med.price,
        };
      }),
    });

    // atomic stock decrement
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

    // mark out of stock
    await tx.medicine.updateMany({
      where: { id: { in: medicineIds }, stock: 0 },
      data: { status: "OUT_OF_STOCK" },
    });

    // return full order
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

const getMyOrders = async (userId: string, query: any) => {
  ensureValidStatusFilter(query.status);
  ensureAuth(userId);

  const { page, limit, skip } = getPagination(query);
  const { orderBy } = buildSort(query, ORDER_SORT_FIELDS, "createdAt");

  const where: any = { customerId: userId };
  if (query.status) where.status = String(query.status);

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: { items: { include: { medicine: true } } },
    }),
    prisma.order.count({ where }),
  ]);

  return { meta: buildMeta(page, limit, total), data: items };
};

const getAllOrders = async (role: Role, query: any) => {
  ensureValidStatusFilter(query.status);
  ensureAdmin(role);

  const { page, limit, skip } = getPagination(query);
  const { orderBy } = buildSort(query, ORDER_SORT_FIELDS, "createdAt");

  const where: any = {};
  if (query.status) where.status = String(query.status);
  if (query.customerId) where.customerId = String(query.customerId);

  // optional total range
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

const getSingleOrder = async (orderId: string, userId: string, role: Role) => {
  ensureAuth(userId);

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { medicine: true } }, customer: true },
  });

  if (!order) throw new ApiError(httpStatus.NOT_FOUND, "Order not found");

  if (role !== "ADMIN" && order.customerId !== userId) {
    throw new ApiError(httpStatus.FORBIDDEN, "Forbidden");
  }

  return order;
};

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
        data: { stock: { increment: item.quantity }, status: "ACTIVE" },
      });
    }

    return tx.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { medicine: true } } },
    });
  });
};

const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
  if (!ALLOWED_STATUS.includes(status)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid status");
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new ApiError(httpStatus.NOT_FOUND, "Order not found");

  return prisma.order.update({
    where: { id: orderId },
    data: { status },
    include: {
      items: { include: { medicine: true } },
      customer: { select: { id: true, name: true, email: true } },
    },
  });
};
//SELLER ORDER SERVICES
// Seller allowed status update list (optional rule)
const SELLER_CAN_SET: OrderStatus[] = ["PROCESSING", "SHIPPED", "DELIVERED"];

// Seller Orders (OrderItem based)
const getSellerOrders = async (sellerId: string, role: Role, query: any) => {
  ensureAuth(sellerId);
  if (role !== "SELLER" && role !== "ADMIN") {
    throw new ApiError(httpStatus.FORBIDDEN, "Only seller can view seller orders");
  }

  // optional status filter validation (OrderStatus is on Order)
  if (query.status && !ALLOWED_STATUS.includes(String(query.status) as any)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid status filter");
  }

  const { page, limit, skip } = getPagination(query);

  // sort fields for seller list (order createdAt / status / total)
  const SELLER_SORT_FIELDS = ["createdAt", "status", "total"] as const;
  const { orderBy } = buildSort(query, SELLER_SORT_FIELDS, "createdAt");
  // NOTE: orderBy will apply to OrderItem model, not Order model.
  // So we will sort via order relation instead (below) to keep correct.

  const whereOrderItem: any = { sellerId };

  // filter: order status
  const orderWhere: any = {};
  if (query.status) orderWhere.status = String(query.status);

  // fetch seller's order items (each item belongs to an order)
  const [items, total] = await Promise.all([
    prisma.orderItem.findMany({
      where: {
        ...whereOrderItem,
        order: orderWhere,
      },
      skip,
      take: limit,
      //  sort by order.createdAt (stable)
      orderBy: { order: { createdAt: "desc" } },
      include: {
        medicine: true,
        order: {
          include: {
            customer: { select: { id: true, name: true, email: true } },
          },
        },
      },
    }),
    prisma.orderItem.count({
      where: {
        ...whereOrderItem,
        order: orderWhere,
      },
    }),
  ]);

  return { meta: buildMeta(page, limit, total), data: items };
};

//  Seller updates status (only if the order has at least one item of this seller)
// Recommended: Seller can update only PROCESSING/SHIPPED/DELIVERED
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

  if (!ALLOWED_STATUS.includes(status)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid status");
  }

  // if seller, restrict status transitions
  if (role === "SELLER" && !SELLER_CAN_SET.includes(status)) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      `Seller cannot set status to ${status}`
    );
  }

  // ensure order exists
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true },
  });
  if (!order) throw new ApiError(httpStatus.NOT_FOUND, "Order not found");

  // ensure this seller has at least one item in this order
  const hasItem = await prisma.orderItem.findFirst({
    where: { orderId, sellerId },
    select: { id: true },
  });

  if (!hasItem && role !== "ADMIN") {
    throw new ApiError(httpStatus.FORBIDDEN, "You cannot update this order");
  }

  // optional: prevent changes after delivered/cancelled
  if (order.status === "DELIVERED" || order.status === "CANCELLED") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Cannot update delivered/cancelled order");
  }

  // update order status
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
  cancelOrder,
  updateOrderStatus,
  getSellerOrders,
  updateOrderStatusBySeller,
};
