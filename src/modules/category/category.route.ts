import { Router } from "express";
import { categoryController } from "./category.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { createCategorySchema, updateCategorySchema } from "./category.validation";
import { authenticate } from "../../middleware/auth";
import { authorize } from "../../middleware/authorize";

const categoryRouter = Router();

//  public
categoryRouter.get("/", categoryController.getAllCategories);
categoryRouter.get("/:id", categoryController.getOneCategory);

//  admin only
categoryRouter.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  validateRequest(createCategorySchema),
  categoryController.createCategory
);

categoryRouter.patch(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validateRequest(updateCategorySchema),
  categoryController.updateCategory
);

categoryRouter.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  categoryController.removeCategory
);

export default categoryRouter;
