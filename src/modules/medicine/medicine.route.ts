import { Router } from "express";
import { medicineController } from "./medicine.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { createMedicineSchema, updateMedicineSchema } from "./medicine.validation";
import { authorize } from "../../middleware/authorize";
import { authenticate } from "../../middleware/auth";
import { upload } from "../../config/multer.config";



const medicineRouter = Router();

// public
medicineRouter.get("/", medicineController.getAllMedicines);
medicineRouter.get("/:id", medicineController.getOneMedicine);
// seller/admin

medicineRouter.post(
  "/",
  authenticate,
  authorize("ADMIN", "SELLER"),
  (req: any, _res, next) => {
    req.uploadMeta = { area: "medicines", entityId: req.user?.userId ?? req.user?.id ?? "common" };
    next();
  },
  upload.array("images", 6),
  validateRequest(createMedicineSchema),
  medicineController.createMedicine
);

medicineRouter.patch(
  "/:id",
  authenticate,
  authorize("ADMIN", "SELLER"),
  (req: any, _res, next) => {
    req.uploadMeta = {
      area: "medicines",
      entityId: req.user?.userId ?? req.user?.id ?? "common",
    };
    next();
  },
  upload.array("images", 5),
  validateRequest(updateMedicineSchema),
  medicineController.updateMedicine
);



medicineRouter.delete(
  "/:id",
  authenticate, authorize("ADMIN", "SELLER"),
  
  
  medicineController.removeMedicine
);
// medicineRouter.patch(
//   "/:id/cover",
//   authenticate,
//   authorize("ADMIN", "SELLER"),
//   medicineController.updateCover
// );

// medicineRouter.patch(
//   "/:id/images",
//   authenticate,
//   authorize("ADMIN", "SELLER"),
//   medicineController.addImages
// );

// medicineRouter.delete(
//   "/:id/images",
//   authenticate,
//   authorize("ADMIN", "SELLER"),
//   medicineController.removeImage
// );

export default medicineRouter;
