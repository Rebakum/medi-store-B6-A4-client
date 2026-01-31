import { Router } from "express";
import { orderController } from "./order.controller";
import { authenticate } from "../../middleware/auth";
import { authorize } from "../../middleware/authorize";

const orderRouter = Router();

orderRouter.post("/checkout",
     authenticate, authorize("CUSTOMER", "ADMIN"),
 orderController.checkout);
orderRouter.get("/my", authenticate, authorize("CUSTOMER", "ADMIN"), orderController.myOrders);
orderRouter.get("/:id", authenticate, authorize("CUSTOMER", "ADMIN"), orderController.getOne);
orderRouter.patch("/:id/cancel", authenticate, authorize("CUSTOMER", "ADMIN"), orderController.cancel);
//  admin only
orderRouter.patch("/:id/status", authenticate, authorize("ADMIN"), orderController.updateStatus);

export default orderRouter;
