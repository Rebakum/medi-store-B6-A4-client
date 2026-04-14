// src/modules/seller/seller.routes.ts
import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { authorize } from "../../middleware/authorize";
import { sellerController } from "./seller.controller";

const sellerRouter = Router();

sellerRouter.get("/stats", authenticate, authorize("SELLER"), sellerController.getStats);
sellerRouter.get("/featured", sellerController.getFeatured); 


export default sellerRouter;
