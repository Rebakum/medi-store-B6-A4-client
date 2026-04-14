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

    //  medicines counts
    const [activeMedicines, lowStock] = await Promise.all([
      prisma.medicine.count({ where: { sellerId, status: "ACTIVE" } }),
      prisma.medicine.count({ where: { sellerId, stock: { lte: LOW_STOCK_THRESHOLD } } }),
    ]);

    //  order IDs that contain seller's medicines
    // তোমার OrderItem এ sellerId আছে, তাই relation medicine না লাগিয়েও হবে
    const sellerOrderIdsRows = await prisma.orderItem.findMany({
      where: { sellerId },
      select: { orderId: true },
      distinct: ["orderId"],
    });
    const sellerOrderIds = sellerOrderIdsRows.map((r) => r.orderId);

    // recent reviews on seller medicines (works even if no orders)
    const recentReviews = await prisma.review.findMany({
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
    });

    //  low stock list
    const lowStockMedicines = await prisma.medicine.findMany({
      where: { sellerId, stock: { lte: LOW_STOCK_THRESHOLD } },
      select: { id: true, name: true, stock: true, status: true, price: true, createdAt: true },
      orderBy: { stock: "asc" },
      take: 5,
    });

    // if no orders
    if (sellerOrderIds.length === 0) {
      return {
        medicines: { active: activeMedicines, lowStock, lowStockThreshold: LOW_STOCK_THRESHOLD },
        orders: { today: 0, pending: 0, processing: 0 },
        recentOrders: [],
        recentReviews,
        lowStockMedicines,
        //  revenue (optional): no orders => 0
        revenue: { today: 0, month: 0 },
      };
    }

    //  order counts
    const [todayOrders, pendingCount, processingCount] = await Promise.all([
      prisma.order.count({ where: { id: { in: sellerOrderIds }, createdAt: { gte: dayStart } } }),
      prisma.order.count({ where: { id: { in: sellerOrderIds }, status: "PLACED" } }),
      prisma.order.count({ where: { id: { in: sellerOrderIds }, status: "PROCESSING" } }),
    ]);

    //  recent orders
    const recentOrders = await prisma.order.findMany({
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
    });

    //  revenue from OrderItem (seller only)
    const [revToday, revMonth] = await Promise.all([
      prisma.orderItem.aggregate({
        where: { sellerId, order: { createdAt: { gte: dayStart } } },
        _sum: { price: true, quantity: true } as any,
      }),
      prisma.orderItem.aggregate({
        where: { sellerId, order: { createdAt: { gte: monthStart } } },
        _sum: { price: true, quantity: true } as any,
      }),
    ]);

    // since prisma can't multiply in aggregate, do it safely by fetching totals:
    // better approach: compute via findMany reduce (fast enough for dashboard)
    const [itemsToday, itemsMonth] = await Promise.all([
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

