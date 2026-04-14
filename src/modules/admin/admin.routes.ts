// modules/admin/admin.routes.ts
import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { authorize } from "../../middleware/authorize";
import { adminController } from "./admin.controller";
import { upload } from "../../config/multer.config";

const adminRouter = Router();


adminRouter.get(
  "/stats",
  authenticate,
  authorize("ADMIN"),
  adminController.getStats
);


adminRouter.get(
  "/dashboard",
  authenticate,
  authorize("ADMIN"),
  adminController.getDashboard
);


adminRouter.post(
  "/logo",
  authenticate,
  authorize("ADMIN"),
  (req: any, _res, next) => {
   
    req.uploadMeta = { area: "brand", entityId: "logo", filename: "logo" };
    next();
  },
  upload.single("logo"),
  adminController.uploadBrandLogo
);

export default adminRouter;
