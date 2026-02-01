import { prisma } from "../../lib/prisma";
import ApiError from "../../utils/apiError";
import httpStatus from "http-status";
import { safeUnlink } from "../../utils/file.util";



const createCategory = async (payload: { name: string; image?: string }) => {
  const name = payload.name.trim().toLowerCase();

  const exists = await prisma.category.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });
  if (exists) throw new ApiError(httpStatus.CONFLICT, "Category already exists");

  return prisma.category.create({
    data: {
      name,
      image: payload.image  ?? null, 
    },
  });
};


const getAllCategories = async () => {
  return prisma.category.findMany({
    orderBy: { createdAt: "desc" },
    include: { medicines: { select: { id: true } } },
  });
};

const getSingleCategory = async (id: string) => {
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      medicines: { select: { id: true, name: true, price: true, stock: true, status: true } },
    },
  });

  if (!category) throw new ApiError(httpStatus.NOT_FOUND, "Category not found");
  return category;
};

const updateCategory = async (
  id: string,
  payload: { name?: string; image?: string }
) => {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw new ApiError(httpStatus.NOT_FOUND, "Category not found");

  // name duplicate check
  if (payload.name) {
    const exists = await prisma.category.findFirst({
      where: {
        name: payload.name.trim(),
        NOT: { id },
      },
    });
    if (exists) throw new ApiError(httpStatus.CONFLICT, "Category name already taken");
  }

  // delete old image if replaced
  if (payload.image && category.image && category.image !== payload.image) {
    safeUnlink(category.image);
  }

  return prisma.category.update({
    where: { id },
    data: {
      ...(payload.name ? { name: payload.name.trim() } : {}),
      ...(payload.image ? { image: payload.image } : {}),
    },
  });
};

const deleteCategory = async (id: string) => {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw new ApiError(httpStatus.NOT_FOUND, "Category not found");

  const medicineCount = await prisma.medicine.count({ where: { categoryId: id } });
  if (medicineCount > 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Cannot delete category because medicines exist under this category"
    );
  }

  //  optional: delete category image file
  if (category.image) safeUnlink(category.image);

  return prisma.category.delete({ where: { id } });
};

export const categoryService = {
  createCategory,
  getAllCategories,
  getSingleCategory,
  updateCategory,
    deleteCategory,
};
