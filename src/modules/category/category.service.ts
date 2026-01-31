import { prisma } from "../../lib/prisma";
import ApiError from "../../utils/apiError";
import httpStatus from "http-status";


 const createCategory = async (payload: { name: string }) => {
  const name = payload.name.trim().toLowerCase();

  const exists = await prisma.category.findFirst({
    where: {
      name: {
        equals: name,
        mode: "insensitive",
      },
    },
  });

  if (exists) {
    throw new ApiError(httpStatus.CONFLICT, "Category already exists");
  }

  const created = await prisma.category.create({
    data: { name },
  });

  return created;
};

 const getAllCategories = async () => {
    return prisma.category.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        medicines: { select: { id: true } }, // count purpose
      },
    });
  }

  const getSingleCategory= async (id: string) => {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        medicines: {
          select: { id: true, name: true, price: true, stock: true, status: true },
        },
      },
    });

    if (!category) {
      throw new ApiError(httpStatus.NOT_FOUND, "Category not found");
    }

    return category;
  }

const updateCategory = async (
  id: string,
  payload: Partial<{ name: string }>
) => {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, "Category not found");
  }

  if (payload.name) {
    const name = payload.name.trim();
    const exists = await prisma.category.findUnique({ where: { name } });

    if (exists && exists.id !== id) {
      throw new ApiError(httpStatus.CONFLICT, "Category name already taken");
    }
  }

  return prisma.category.update({
    where: { id },
    data: {
      ...(payload.name ? { name: payload.name.trim() } : {}),
    },
  });
};


const deleteCategory= async (id: string) => {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new ApiError(httpStatus.NOT_FOUND, "Category not found");
    }

    // optional: prevent delete if medicines exist
    const medicineCount = await prisma.medicine.count({ where: { categoryId: id } });
    if (medicineCount > 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Cannot delete category because medicines exist under this category"
      );
    }

    return prisma.category.delete({ where: { id } });
  }
  export const categoryService = {
    createCategory,
    getAllCategories,
    getSingleCategory,
    updateCategory,
    deleteCategory
  };