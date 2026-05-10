import { prisma } from "../../lib/prisma";

const startOfDay = (d = new Date()) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const startOfMonth = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), 1);

export const sellerService = {
  getStats: async (sellerId: string) => {
    const now = new Date();
    const dayStart = startOfDay(now);
    const monthStart = startOfMonth(now);
    const LOW_STOCK_THRESHOLD = 5;

    const [activeMedicines, lowStock, sellerOrderIdsRows, recentReviews, lowStockMedicines] =
      await Promise.all([
        prisma.medicine.count({ where: { sellerId, status: "ACTIVE" } }),
        prisma.medicine.count({ where: { sellerId, stock: { lte: LOW_STOCK_THRESHOLD } } }),
        prisma.orderItem.findMany({
          where: { sellerId },
          select: { orderId: true },
          distinct: ["orderId"],
        }),
        prisma.review.findMany({
          where: { medicine: { sellerId } },
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            medicine: { select: { id: true, name: true, images: true } },
            user: { select: { id: true, name: true, email: true, avatar: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),
        prisma.medicine.findMany({
          where: { sellerId, stock: { lte: LOW_STOCK_THRESHOLD } },
          select: { id: true, name: true, stock: true, status: true, price: true, createdAt: true },
          orderBy: { stock: "asc" },
          take: 5,
        }),
      ]);

    const sellerOrderIds = sellerOrderIdsRows.map((r) => r.orderId);

    if (sellerOrderIds.length === 0) {
      return {
        medicines: { active: activeMedicines, lowStock, lowStockThreshold: LOW_STOCK_THRESHOLD },
        orders: { today: 0, pending: 0, processing: 0 },
        recentOrders: [],
        recentReviews,
        lowStockMedicines,
        revenue: { today: 0, month: 0 },
      };
    }

    const [todayOrders, pendingCount, processingCount, recentOrders, itemsToday, itemsMonth] =
      await Promise.all([
        prisma.order.count({
          where: { id: { in: sellerOrderIds }, createdAt: { gte: dayStart } },
        }),
        prisma.order.count({ where: { id: { in: sellerOrderIds }, status: "PLACED" } }),
        prisma.order.count({ where: { id: { in: sellerOrderIds }, status: "PROCESSING" } }),
        prisma.order.findMany({
          where: { id: { in: sellerOrderIds } },
          select: {
            id: true,
            status: true,
            total: true,
            createdAt: true,
            customer: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
        prisma.orderItem.findMany({
          where: { sellerId, order: { createdAt: { gte: dayStart } } },
          select: { price: true, quantity: true },
        }),
        prisma.orderItem.findMany({
          where: { sellerId, order: { createdAt: { gte: monthStart } } },
          select: { price: true, quantity: true },
        }),
      ]);

    const revenueToday = itemsToday.reduce((sum, it) => sum + it.price * it.quantity, 0);
    const revenueMonth = itemsMonth.reduce((sum, it) => sum + it.price * it.quantity, 0);

    return {
      medicines: { active: activeMedicines, lowStock, lowStockThreshold: LOW_STOCK_THRESHOLD },
      orders: { today: todayOrders, pending: pendingCount, processing: processingCount },
      revenue: { today: revenueToday, month: revenueMonth },
      recentOrders,
      recentReviews,
      lowStockMedicines,
    };
  },

  getFeatured: async () => {
    return prisma.user.findMany({
      where: {
        role: "SELLER",
        isActive: true,
        sellerLogo: { not: null },
      },
      select: { id: true, name: true, sellerLogo: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 12,
    });
  },
};
