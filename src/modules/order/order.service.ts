import { prisma } from "../../lib/prisma";
import ApiError from "../../utils/apiError";
import httpStatus from "http-status";
import { buildMeta, getPagination } from "../../utils/query/pagination";
import { buildSort } from "../../utils/query/sort";

type Role = "CUSTOMER" | "SELLER" | "ADMIN";
type OrderStatus = "PLACED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

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

const ALLOWED_STATUS: OrderStatus[] = ["PLACED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

// ✅ merge duplicate medicineId => sum quantities
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

const ORDER_SORT_FIELDS = ["createdAt", "total", "status"] as const;

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
    select: { id: true, price: true, stock: true, status: true, name: true },
  });

  if (medicines.length !== medicineIds.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid medicineId found");
  }

  const medMap = new Map(medicines.map(m => [m.id, m]));

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

    await tx.orderItem.createMany({
      data: items.map(i => {
        const med = medMap.get(i.medicineId)!;
        return {
          orderId: order.id,
          medicineId: i.medicineId,
          quantity: i.quantity,
          price: med.price,
        };
      }),
    });

    // ✅ atomic stock decrement (prevents negative stock)
    for (const i of items) {
      const med = medMap.get(i.medicineId)!;

      const updated = await tx.medicine.updateMany({
        where: { id: i.medicineId, status: "ACTIVE", stock: { gte: i.quantity } },
        data: { stock: { decrement: i.quantity } },
      });

      if (updated.count === 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Insufficient stock: ${med.name}`);
      }
    }

    await tx.medicine.updateMany({
      where: { id: { in: medicineIds }, stock: 0 },
      data: { status: "OUT_OF_STOCK" },
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

const getMyOrders = async (userId: string, query: any) => {
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
      include: {
        items: { include: { medicine: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return { meta: buildMeta(page, limit, total), data: items };
};

const getAllOrders = async (role: Role, query: any) => {
  ensureAdmin(role);

  const { page, limit, skip } = getPagination(query);
  const { orderBy } = buildSort(query, ORDER_SORT_FIELDS, "createdAt");

  const where: any = {};

  // optional filters
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

    // restore stock
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

export const orderService = {
  checkout,
  getMyOrders,
  getAllOrders,
  getSingleOrder,
  cancelOrder,
  updateOrderStatus,
};
