import { Router } from "express";
import userRouter from "../modules/auth/auth.route";
import authRouter from "../modules/auth/auth.route";
import categoryRouter from "../modules/category/category.route";
import medicineRouter from "../modules/medicine/medicine.route";
import orderRouter from "../modules/order/order.route";
import reviewRouter from "../modules/review/review.route";

// import authRouter from "../modules/auth/auth.route";



const router = Router();

router.use("/auth", authRouter);
router.use("/categories", categoryRouter)
router.use("/medicines", medicineRouter)
router.use("/orders", orderRouter)
router.use("/reviews", reviewRouter)
// router.use("/users", userRouter);


export default router;
