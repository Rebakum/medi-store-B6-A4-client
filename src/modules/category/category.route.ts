import { Router } from "express";
import { categoryController } from "./category.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { createCategorySchema, updateCategorySchema } from "./category.validation";
import { authenticate } from "../../middleware/auth";
import { authorize } from "../../middleware/authorize";
import { upload } from "../../config/multer.config";

const categoryRouter = Router();

//  public
categoryRouter.get("/", categoryController.getAllCategories);
categoryRouter.get("/:id", categoryController.getOneCategory);

//  admin only


categoryRouter.post(
  "/",
   authenticate,
  authorize("ADMIN"),
  upload.single("image"),
  categoryController.createCategory
);

categoryRouter.patch(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  upload.single("image"),               // ✅ FIRST
  validateRequest(updateCategorySchema), // ✅ AFTER
  categoryController.updateCategory
);

categoryRouter.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  categoryController.removeCategory
);



export default categoryRouter;
