// modules/admin/admin.service.ts
import { prisma } from "../../lib/prisma";

// ---------- date helpers ----------
const startOfDay = (d = new Date()) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const startOfMonth = (d = new Date()) => {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
};

const toLabel = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

// ---------- chart trend ----------
const makeDailyTrend = async (days: number) => {
  const now = new Date();
  const from = startOfDay(new Date(now.getTime() - (days - 1) * 86400000));

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: from } },
    select: { createdAt: true, total: true },
  });

  const map = new Map<
    string,
    { date: string; orders: number; revenue: number }
  >();

  // prefill
  for (let i = 0; i < days; i++) {
    const d = new Date(from.getTime() + i * 86400000);
    const key = d.toISOString().slice(0, 10);
    map.set(key, { date: toLabel(d), orders: 0, revenue: 0 });
  }

  // fill
  for (const o of orders) {
    const key = new Date(o.createdAt).toISOString().slice(0, 10);
    const item = map.get(key);
    if (item) {
      item.orders += 1;
      item.revenue += Number(o.total ?? 0);
    }
  }

  return Array.from(map.values());
};

// ---------- logo helper ----------
const buildPublicLogoUrl = (file: Express.Multer.File) => {
  // windows path fix
  const normalized = file.path.replace(/\\/g, "/");
  const idx = normalized.indexOf("uploads/");
  const rel = idx >= 0 ? normalized.slice(idx) : normalized;
  return `/${rel}`; // => /uploads/brand/logo/logo.png
};



export const adminService = {
 
  getStats: async () => {
    const now = new Date();

    const dayStart = startOfDay(now);
    const monthStart = startOfMonth(now);

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    const lastMonthStart = startOfMonth(
      new Date(now.getFullYear(), now.getMonth() - 1, 1)
    );
    const thisMonthStart = monthStart;

    const [totalUsers, newUsers7d] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    ]);

    const [todayOrders, pendingCount, processingCount] = await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: dayStart } } }),
      prisma.order.count({ where: { status: "PLACED" } }),
      prisma.order.count({ where: { status: "PROCESSING" } }),
    ]);

    const LOW_STOCK_THRESHOLD = 5;

    const [totalActiveMedicines, lowStockCount] = await Promise.all([
      prisma.medicine.count({ where: { status: "ACTIVE" } as any }),
      prisma.medicine.count({
        where: { stock: { lte: LOW_STOCK_THRESHOLD } },
      }),
    ]);

    const [
      todayRevenueAgg,
      thisMonthRevenueAgg,
      lastMonthRevenueAgg,
    ] = await Promise.all([
      prisma.order.aggregate({
        _sum: { total: true },
        where: { createdAt: { gte: dayStart } },
      }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { createdAt: { gte: thisMonthStart } },
      }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { createdAt: { gte: lastMonthStart, lt: thisMonthStart } },
      }),
    ]);

    const todayRevenue = Number(todayRevenueAgg._sum.total ?? 0);
    const thisMonthRevenue = Number(thisMonthRevenueAgg._sum.total ?? 0);
    const lastMonthRevenue = Number(lastMonthRevenueAgg._sum.total ?? 0);

    const pctChange =
      lastMonthRevenue === 0
        ? thisMonthRevenue > 0
          ? 100
          : 0
        : ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;

    return {
      users: { total: totalUsers, new7d: newUsers7d },
      orders: {
        today: todayOrders,
        pending: pendingCount,
        processing: processingCount,
      },
      medicines: {
        active: totalActiveMedicines,
        lowStock: lowStockCount,
        lowStockThreshold: LOW_STOCK_THRESHOLD,
      },
      revenue: {
        today: todayRevenue,
        thisMonth: thisMonthRevenue,
        changePct: Number(pctChange.toFixed(1)),
      },
    };
  },


  getDashboard: async () => {
    const stats = await adminService.getStats();

    const [last7d, last30d, last3m] = await Promise.all([
      makeDailyTrend(7),
      makeDailyTrend(30),
      makeDailyTrend(90),
    ]);

    return {
      stats,
      charts: {
        last7d,
        last30d,
        last3m,
      },
    };
  },

  
  uploadBrandLogo: async (file?: Express.Multer.File | null) => {
    if (!file) {
      return { logo: null };
    }

    const logoUrl = buildPublicLogoUrl(file);

    // 🔥 Optional: DB save (future use)
    // await prisma.appSetting.upsert({
    //   where: { key: "brandLogo" },
    //   update: { value: logoUrl },
    //   create: { key: "brandLogo", value: logoUrl },
    // });

    return { logo: logoUrl };
  },
};
