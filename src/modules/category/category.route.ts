import { Router } from "express";
import { categoryController } from "./category.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { createCategorySchema, updateCategorySchema } from "./category.validation";


const categoryRouter = Router();

// public
categoryRouter.get("/", categoryController.getAllCategories);
categoryRouter.get("/:id", categoryController.getOneCategory);
// admin only (or admin+seller )
categoryRouter.post(  "/", validateRequest(createCategorySchema), categoryController.createCategory);

categoryRouter.patch(  "/:id", validateRequest(updateCategorySchema), categoryController.updateCategory);
  
  


// categoryRouter.delete(
//   "/:id",
//   categoryController.removeCategory
// );

export default categoryRouter;