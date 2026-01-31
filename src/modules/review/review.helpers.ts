import { prisma } from "../../lib/prisma";
import ApiError from "../../utils/apiError";
import httpStatus from "http-status";

export const ensureMedicineExists = async (medicineId: string) => {
  const medicine = await prisma.medicine.findUnique({ where: { id: medicineId } });
  if (!medicine) throw new ApiError(httpStatus.NOT_FOUND, "Medicine not found");
  return medicine;
};

export const ensureDeliveredPurchase = async (userId: string, medicineId: string) => {
  const purchased = await prisma.orderItem.findFirst({
    where: {
      medicineId,
      order: { customerId: userId, status: "DELIVERED" },
    },
    select: { id: true },
  });

  if (!purchased) {
    throw new ApiError(httpStatus.FORBIDDEN, "You can review only after delivery");
  }
};

export const ensureReviewExists = async (reviewId: string) => {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw new ApiError(httpStatus.NOT_FOUND, "Review not found");
  return review;
};

export const ensureOwnerOrAdmin = (ownerId: string, userId: string, role: string, msg: string) => {
  const isOwner = ownerId === userId;
  if (role !== "ADMIN" && !isOwner) {
    throw new ApiError(httpStatus.FORBIDDEN, msg);
  }
};

export const buildReviewCreateData = (userId: string, payload: { medicineId: string; rating: number; comment?: string | undefined }) => {
  return {
    userId,
    medicineId: payload.medicineId,
    rating: payload.rating,
    comment: payload.comment ?? null,
  };
};

export const buildReviewUpdateData = (payload: { rating?: number | undefined; comment?: string | undefined }) => {
  const data: any = {};
  if (payload.rating !== undefined) data.rating = payload.rating;
  if (payload.comment !== undefined) data.comment = payload.comment;
  return data;
};

export const computeReviewMeta = (ratings: number[]) => {
  const totalReviews = ratings.length;
  const averageRating =
    totalReviews === 0 ? 0 : Number((ratings.reduce((a, b) => a + b, 0) / totalReviews).toFixed(2));

  return { totalReviews, averageRating };
};
