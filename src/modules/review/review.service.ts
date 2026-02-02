import { prisma } from "../../lib/prisma";
import ApiError from "../../utils/apiError";
import httpStatus from "http-status";
import { CreateReviewPayload, UpdateReviewPayload, Role } from "./review.types";
import {
  ensureMedicineExists,
  ensureDeliveredPurchase,
  ensureReviewExists,
  ensureOwnerOrAdmin,
  buildReviewCreateData,
  buildReviewUpdateData,
  computeReviewMeta,
} from "./review.helpers";
import { buildMeta, getPagination } from "../../utils/query/pagination";
import { buildSort } from "../../utils/query/sort";

const ensureAuth = (userId: string) => {
  if (!userId) throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized");
};

const ensureReviewerRole = (role: Role) => {
  if (role !== "CUSTOMER" && role !== "ADMIN") {
    throw new ApiError(httpStatus.FORBIDDEN, "Only customer can review");
  }
};

const REVIEW_INCLUDE = {
  user: { select: { id: true, name: true } },
  medicine: { select: { id: true, name: true, brand: true } },
} as const;

const isUniqueViolation = (err: any) => err?.code === "P2002";

//  sort fields allowed
const REVIEW_SORT_FIELDS = ["createdAt", "rating"] as const;

const createReview = async (userId: string, role: Role, payload: CreateReviewPayload) => {
  ensureAuth(userId);
  ensureReviewerRole(role);

  await ensureMedicineExists(payload.medicineId);
  await ensureDeliveredPurchase(userId, payload.medicineId);

  try {
    return await prisma.review.create({
      data: buildReviewCreateData(userId, payload),
      include: REVIEW_INCLUDE,
    });
  } catch (err: any) {
    if (isUniqueViolation(err)) {
      throw new ApiError(httpStatus.CONFLICT, "You already reviewed this medicine");
    }
    throw new ApiError(httpStatus.BAD_REQUEST, err?.message || "Review create failed");
  }
};

const getAllReviews = async (query: any) => {
  const { page, limit, skip } = getPagination(query);
  const { orderBy } = buildSort(query, REVIEW_SORT_FIELDS, "createdAt");

  const where: any = {};

  // optional filters
  if (query.medicineId) {
    const medicineId = String(query.medicineId);
    await ensureMedicineExists(medicineId);
    where.medicineId = medicineId;
  }
  if (query.userId) where.userId = String(query.userId);

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: REVIEW_INCLUDE,
    }),
    prisma.review.count({ where }),
  ]);

  const ratingMeta = computeReviewMeta(reviews.map((r) => r.rating));

  return {
    meta: { ...buildMeta(page, limit, total), ratingMeta },
    data: reviews,
  };
};

const getMyReviews = async (userId: string, query: any) => {
  ensureAuth(userId);

  const { page, limit, skip } = getPagination(query);
  const { orderBy } = buildSort(query, REVIEW_SORT_FIELDS, "createdAt");

  const where: any = { userId };

  // optional filter
  if (query.medicineId) {
    const medicineId = String(query.medicineId);
    await ensureMedicineExists(medicineId);
    where.medicineId = medicineId;
  }

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: REVIEW_INCLUDE,
    }),
    prisma.review.count({ where }),
  ]);

  const ratingMeta = computeReviewMeta(reviews.map((r) => r.rating));

  return {
    meta: { ...buildMeta(page, limit, total), ratingMeta },
    data: reviews,
  };
};

const getReviewsByMedicine = async (medicineId: string) => {
  await ensureMedicineExists(medicineId);

  const reviews = await prisma.review.findMany({
    where: { medicineId },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true } } },
  });

  const meta = computeReviewMeta(reviews.map((r) => r.rating));
  return { meta, data: reviews };
};

const updateReview = async (
  reviewId: string,
  userId: string,
  role: Role,
  payload: UpdateReviewPayload
) => {
  ensureAuth(userId);

  const review = await ensureReviewExists(reviewId);
  ensureOwnerOrAdmin(review.userId, userId, role, "You can update only your review");

  const data = buildReviewUpdateData(payload);
  if (Object.keys(data).length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Nothing to update");
  }

  return prisma.review.update({
    where: { id: reviewId },
    data,
    include: { user: { select: { id: true, name: true } } },
  });
};

const deleteReview = async (reviewId: string, userId: string, role: Role) => {
  ensureAuth(userId);

  const review = await ensureReviewExists(reviewId);
  ensureOwnerOrAdmin(review.userId, userId, role, "You can delete only your review");

  return prisma.review.delete({ where: { id: reviewId } });
};

export const reviewService = {
  createReview,
  getAllReviews,
  getMyReviews,
  getReviewsByMedicine,
  updateReview,
  deleteReview,
};
