import { Router } from "express";
import { medicineController } from "./medicine.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { createMedicineSchema, updateMedicineSchema } from "./medicine.validation";
import { authorize } from "../../middleware/authorize";
import { authenticate } from "../../middleware/auth";


const medicineRouter = Router();

// public
medicineRouter.get("/", medicineController.getAllMedicines);
medicineRouter.get("/:id", medicineController.getOneMedicine);
// seller/admin
medicineRouter.post(
  "/",
  authenticate, authorize("ADMIN", "SELLER"),
  validateRequest(createMedicineSchema),

  medicineController.createMedicine
);

medicineRouter.patch("/:id",
    authenticate, authorize("ADMIN", "SELLER"),
  validateRequest(updateMedicineSchema),
  medicineController.updateMedicine
);

medicineRouter.delete(
  "/:id",
  authenticate, authorize("ADMIN", "SELLER"),
  
  
  medicineController.removeMedicine
);

export default medicineRouter;
