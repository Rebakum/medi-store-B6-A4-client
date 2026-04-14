import { Router } from "express";
import { orderController } from "./order.controller";
import { authenticate } from "../../middleware/auth";
import { authorize } from "../../middleware/authorize";

const orderRouter = Router();

/** -------------------------
 *  CUSTOMER / ADMIN
 *  ------------------------- */

// checkout
orderRouter.post(
  "/checkout",
  authenticate,
  authorize("CUSTOMER", "ADMIN"),
  orderController.checkout
);

// my orders
orderRouter.get("/me", authenticate, orderController.myOrders);

// update my order items (only PLACED)
orderRouter.put(
  "/:id/items",
  authenticate,
  authorize("CUSTOMER", "ADMIN"),
  orderController.updateMyOrderItems
);

// cancel my order
orderRouter.patch(
  "/:id/cancel",
  authenticate,
  authorize("CUSTOMER", "ADMIN"),
  orderController.cancel
);

/** -------------------------
 *  SELLER / ADMIN
 *  ⚠️ MUST be BEFORE "/:id"
 *  ------------------------- */

orderRouter.get(
  "/seller/me",
  authenticate,
  authorize("SELLER", "ADMIN"),
  orderController.sellerOrders
);

orderRouter.patch(
  "/seller/:id/status",
  authenticate,
  authorize("SELLER", "ADMIN"),
  orderController.sellerUpdateStatus
);

/** -------------------------
 *  ADMIN ONLY
 *  ------------------------- */

orderRouter.get("/", authenticate, authorize("ADMIN"), orderController.allOrders);

orderRouter.patch(
  "/:id/status",
  authenticate,
  authorize("ADMIN"),
  orderController.updateStatus
);

/** -------------------------
 *  SINGLE ORDER (LAST)
 *  ------------------------- */

orderRouter.get("/:id", authenticate, orderController.getOne);

export default orderRouter;
