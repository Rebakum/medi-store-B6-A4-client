import { Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { createReviewSchema, updateReviewSchema } from "./review.validation";
import { reviewService } from "./review.service";

const createReview = catchAsync(async (req: any, res: Response) => {
  const userId = req.user?.id ?? req.user?.userId;
  const role = req.user?.role;

  const parsed = createReviewSchema.parse(req.body);

  const payload: any = {
    medicineId: parsed.medicineId,
    rating: parsed.rating,
  };
  if (parsed.comment !== undefined) payload.comment = parsed.comment;

  const result = await reviewService.createReview(userId, role, payload);

  sendResponse(res, {
    statusCode: 201,
    message: "Review created successfully",
    data: result,
  });
});

const getAllReviews = catchAsync(async (req: any, res: Response) => {
  const result = await reviewService.getAllReviews(req.query);

  sendResponse(res, {
    message: "All reviews fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const myReviews = catchAsync(async (req: any, res: Response) => {
  const userId = req.user?.id ?? req.user?.userId;

  const result = await reviewService.getMyReviews(userId, req.query);

  sendResponse(res, {
    message: "My reviews fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const byMedicine = catchAsync(async (req: any, res: Response) => {
  const result = await reviewService.getReviewsByMedicine(req.params.medicineId);

  sendResponse(res, {
    message: "Reviews fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const updateReview = catchAsync(async (req: any, res: Response) => {
  const userId = req.user?.id ?? req.user?.userId;
  const role = req.user?.role;

  const parsed = updateReviewSchema.parse(req.body);

  const payload: any = {};
  if (parsed.rating !== undefined) payload.rating = parsed.rating;
  if (parsed.comment !== undefined) payload.comment = parsed.comment;

  const result = await reviewService.updateReview(req.params.id, userId, role, payload);

  sendResponse(res, {
    message: "Review updated successfully",
    data: result,
  });
});

const removeReview = catchAsync(async (req: any, res: Response) => {
  const userId = req.user?.id ?? req.user?.userId;
  const role = req.user?.role;

  const result = await reviewService.deleteReview(req.params.id, userId, role);

  sendResponse(res, {
    message: "Review deleted successfully",
    data: result,
  });
});

export const reviewController = {
  createReview,
  getAllReviews,
  myReviews,
  byMedicine,
  updateReview,
  removeReview,
};
