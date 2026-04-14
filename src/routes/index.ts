import { Router } from "express";

import authRouter from "../modules/auth/auth.route";
import categoryRouter from "../modules/category/category.route";
import medicineRouter from "../modules/medicine/medicine.route";
import orderRouter from "../modules/order/order.route";
import reviewRouter from "../modules/review/review.route";
import adminRouter from "../modules/admin/admin.routes";
import sellerRouter from "../modules/seller/seller.routes";
import aiRouter from "../modules/ai/ai.route";

const router = Router();

router.use("/auth", authRouter);
router.use("/categories", categoryRouter);
router.use("/medicines", medicineRouter);
router.use("/orders", orderRouter);
router.use("/reviews", reviewRouter);
router.use("/admin", adminRouter);
router.use("/seller", sellerRouter);
router.use("/ai", aiRouter);

export default router;