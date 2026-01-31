import { Router } from "express";
import { reviewController } from "./review.controller";
import { authenticate } from "../../middleware/auth";
import { authorize } from "../../middleware/authorize";

const reviewRouter = Router();

//  public
reviewRouter.get("/", reviewController.getAllReviews);
reviewRouter.get("/medicine/:medicineId", reviewController.byMedicine);

//  auth required
reviewRouter.get("/me", authenticate, reviewController.myReviews);

//  customer/admin: create/update/delete
reviewRouter.post("/", authenticate, authorize("CUSTOMER", "ADMIN"), reviewController.createReview);
reviewRouter.patch("/:id", authenticate, authorize("CUSTOMER", "ADMIN"), reviewController.updateReview);
reviewRouter.delete("/:id", authenticate, authorize("CUSTOMER", "ADMIN"), reviewController.removeReview);

export default reviewRouter;
