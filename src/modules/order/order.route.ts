import { Router } from "express";
import { orderController } from "./order.controller";
import { authenticate } from "../../middleware/auth";
import { authorize } from "../../middleware/authorize";

const orderRouter = Router();

// customer/admin
orderRouter.post("/checkout", authenticate, authorize("CUSTOMER", "ADMIN"), orderController.checkout);
orderRouter.get("/me", authenticate, orderController.myOrders);
orderRouter.get("/:id", authenticate, orderController.getOne);
orderRouter.patch("/:id/cancel", authenticate, authorize("CUSTOMER", "ADMIN"), orderController.cancel);

// admin
orderRouter.get("/", authenticate, authorize("ADMIN"), orderController.allOrders);
orderRouter.patch("/:id/status", authenticate, authorize("ADMIN"), orderController.updateStatus);
// seller (must be before "/:id")
orderRouter.get("/seller/me", authenticate, authorize("SELLER", "ADMIN"), orderController.sellerOrders);
orderRouter.patch("/seller/:id/status", authenticate, authorize("SELLER", "ADMIN"), orderController.sellerUpdateStatus);


export default orderRouter;