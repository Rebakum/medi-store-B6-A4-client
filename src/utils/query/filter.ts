import { Prisma } from "@prisma/client";
import { buildSearchOR } from "../../utils/query/search";

export const buildMedicineWhere = (query: any): Prisma.MedicineWhereInput => {
  const where: Prisma.MedicineWhereInput = {};

  const s = query.search ? String(query.search).trim() : "";
  const OR = buildSearchOR(s, ["name", "brand", "manufacturer", "description"]);

  if (OR) {
    where.OR = [
      ...(OR as any),
      { category: { name: { contains: s, mode: "insensitive" } } },
    ];
  }

  if (query.categoryId) where.categoryId = String(query.categoryId);
  if (query.sellerId) where.sellerId = String(query.sellerId);
  if (query.brand) where.brand = { contains: String(query.brand), mode: "insensitive" };

  if (query.form) where.form = query.form;
  if (query.status) where.status = query.status;

  const minPrice = query.minPrice !== undefined ? Number(query.minPrice) : undefined;
  const maxPrice = query.maxPrice !== undefined ? Number(query.maxPrice) : undefined;

  if (
    (minPrice !== undefined && !Number.isNaN(minPrice)) ||
    (maxPrice !== undefined && !Number.isNaN(maxPrice))
  ) {
    where.price = {};
    if (minPrice !== undefined && !Number.isNaN(minPrice)) where.price.gte = minPrice;
    if (maxPrice !== undefined && !Number.isNaN(maxPrice)) where.price.lte = maxPrice;
  }

  return where;
};
