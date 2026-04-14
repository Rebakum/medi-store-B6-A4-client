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

// ✅ special routes FIRST
medicineRouter.get("/featured", medicineController.getFeaturedMedicines);
medicineRouter.get("/suggestions", medicineController.getSearchSuggestions);

medicineRouter.get(
  "/my",
  authenticate,
  authorize("SELLER", "ADMIN"),
  medicineController.getMyMedicines
);

// ✅ dynamic route ALWAYS LAST
medicineRouter.get("/:id", medicineController.getOneMedicine);

// seller/admin create
medicineRouter.post(
  "/",
  authenticate,
  authorize("ADMIN", "SELLER"),
  (req: any, _res, next) => {
    req.uploadMeta = { area: "medicines", entityId: req.user?.userId ?? req.user?.id ?? "common" };
    next();
  },
  upload.fields([
  { name: "images", maxCount: 6 },
  { name: "brandLogo", maxCount: 1 },
]),

  validateRequest(createMedicineSchema),
  medicineController.createMedicine
);

// seller/admin update
medicineRouter.patch(
  "/:id",
  authenticate,
  authorize("ADMIN", "SELLER"),
  (req: any, _res, next) => {
    req.uploadMeta = { area: "medicines", entityId: req.user?.userId ?? req.user?.id ?? "common" };
    next();
  },
  upload.array("images", 5),
  validateRequest(updateMedicineSchema),
  medicineController.updateMedicine
);

// seller/admin delete
medicineRouter.delete(
  "/:id",
  authenticate,
  authorize("ADMIN", "SELLER"),
  medicineController.removeMedicine
);


export default medicineRouter;

