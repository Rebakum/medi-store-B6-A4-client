import { prisma } from "../../lib/prisma";
import ApiError from "../../utils/apiError";
import httpStatus from "http-status";
import { buildMeta, getPagination } from "../../utils/query/pagination";
import { buildMedicineWhere } from "../../utils/query/filter";
import { buildSort } from "../../utils/query/sort";
import { safeUnlink, splitCoverGallery } from "../../utils/file.util";
import { Role } from "@prisma/client";
import path from "path";

// type Role = "CUSTOMER" | "SELLER" | "ADMIN";



const createMedicine = async (
  userId: string,
  role: Role,
  payload: {
    name: string;
    brand: string;
    form: any;
    price: number;
    stock: number;
    description: string;
    manufacturer: string;
    categoryId: string;
    status?: any;
    images?: string[];
  }
) => {
  if (!userId) throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized: userId missing");

  if (role !== "SELLER" && role !== "ADMIN") {
    throw new ApiError(httpStatus.FORBIDDEN, "Only seller/admin can add medicine");
  }

  const category = await prisma.category.findUnique({
    where: { id: payload.categoryId },
  });
  if (!category) throw new ApiError(httpStatus.BAD_REQUEST, "Invalid categoryId");

  // images validation
  const images = payload.images ?? [];
  if (!images.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, "At least 1 medicine image is required");
  }

  const status = payload.status ?? (payload.stock === 0 ? "OUT_OF_STOCK" : "ACTIVE");

  const created = await prisma.medicine.create({
    data: {
      name: payload.name.trim(),
      brand: payload.brand.trim(),
      form: payload.form,
      price: payload.price,
      stock: payload.stock,
      description: payload.description,
      manufacturer: payload.manufacturer.trim(),
      status,
      categoryId: payload.categoryId,
      sellerId: userId,
      images, 
    },
    include: {
      category: true,
      seller: { select: { id: true, name: true, email: true } },
    },
  });

  return { ...created, ...splitCoverGallery(created.images) };
};
// Gey All Medicine

const getAllMedicines = async (query: any) => {
  const { page, limit, skip } = getPagination(query);
  const where = buildMedicineWhere(query);

  const hasSearch = !!query.search?.toString().trim();

  const { orderBy } = buildSort(
    {
      ...query,
      // 🔥 search থাকলে default A–Z
      sortBy: query.sortBy ?? (hasSearch ? "name" : undefined),
      sortOrder: query.sortOrder ?? (hasSearch ? "asc" : undefined),
    },
    ["createdAt", "price", "stock", "name"] as const,
    "createdAt"
  );

  const [items, total] = await Promise.all([
    prisma.medicine.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        category: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true } },
      },
    }),
    prisma.medicine.count({ where }),
  ]);

  return {
    meta: buildMeta(page, limit, total),
    data: items,
  };
};

// Get Single Medicine

const getSingleMedicine = async (id: string) => {
  const medicine = await prisma.medicine.findUnique({
    where: { id },
    include: {
      category: true,
      seller: { select: { id: true, name: true, email: true } },
      reviews: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!medicine) throw new ApiError(httpStatus.NOT_FOUND, "Medicine not found");

  return { ...medicine, ...splitCoverGallery(medicine.images) };
};

// Update Medicine
const updateMedicine = async (
  id: string,
  userId: string,
  role: Role,
  payload: Partial<{
    name: string;
    brand: string;
    form: any;
    price: number;
    stock: number;
    description: string;
    manufacturer: string;
    categoryId: string;
    status: any;
    images: string[];
  }>
) => {
  const medicine = await prisma.medicine.findUnique({ where: { id } });
  if (!medicine) throw new ApiError(httpStatus.NOT_FOUND, "Medicine not found");

  const isOwner = medicine.sellerId === userId;
  if (role !== "ADMIN" && !isOwner) {
    throw new ApiError(httpStatus.FORBIDDEN, "You can update only your medicines");
  }

  if (payload.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: payload.categoryId } });
    if (!category) throw new ApiError(httpStatus.BAD_REQUEST, "Invalid categoryId");
  }

  let nextStatus = payload.status;
  if (typeof payload.stock === "number") {
    if (payload.stock === 0) nextStatus = "OUT_OF_STOCK";
    else if (!nextStatus && medicine.status === "OUT_OF_STOCK") nextStatus = "ACTIVE";
  }

  const updated = await prisma.medicine.update({
    where: { id },
    data: {
      ...(payload.name ? { name: payload.name.trim() } : {}),
      ...(payload.brand ? { brand: payload.brand.trim() } : {}),
      ...(payload.form ? { form: payload.form } : {}),
      ...(payload.price != null ? { price: payload.price } : {}),
      ...(payload.stock != null ? { stock: payload.stock } : {}),
      ...(payload.description ? { description: payload.description } : {}),
      ...(payload.manufacturer ? { manufacturer: payload.manufacturer.trim() } : {}),
      ...(payload.categoryId ? { categoryId: payload.categoryId } : {}),
      ...(nextStatus ? { status: nextStatus } : {}),
      ...(payload.images ? { images: payload.images } : {}),
    },
    include: {
      category: true,
      seller: { select: { id: true, name: true } },
    },
  });

  return { ...updated, ...splitCoverGallery(updated.images) };
};
// Delete Medicine
const deleteMedicine = async (id: string, userId: string, role: Role) => {
  const medicine = await prisma.medicine.findUnique({ where: { id } });

  if (!medicine) throw new ApiError(httpStatus.NOT_FOUND, "Medicine not found");

  const isOwner = medicine.sellerId === userId;
  if (role !== "ADMIN" && !isOwner) {
    throw new ApiError(httpStatus.FORBIDDEN, "You can delete only your medicines");
  }

  //  delete image files (recommended)
  (medicine.images ?? []).forEach(p => safeUnlink(p));

  return prisma.medicine.delete({ where: { id } });
};




export const medicineService = {
  createMedicine,
  getAllMedicines,
  getSingleMedicine,
  updateMedicine,
  deleteMedicine,
  
};
