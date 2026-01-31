import { Request, RequestHandler, Response } from "express";
import { categoryService } from "./category.service";
import { createCategorySchema, updateCategorySchema } from "./category.validation";



  const createCategory = (async (req:Request, res:Response) => {
    const parsed = createCategorySchema.parse(req.body);
    const result = await categoryService.createCategory(parsed);

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: result,
    });
  })

  const getAllCategories = (async (_req:Request, res:Response) => {
    const result = await categoryService.getAllCategories();
    const formatted = result.map(c => ({
      id: c.id,
      name: c.name,
      createdAt: c.createdAt,
      medicineCount: c.medicines.length,
    }));

    res.json({
      success: true,
      message: "Categories fetched successfully",
      data: formatted,
    });
  }) 

  const getOneCategory = (async (req:Request, res:Response) => {
    const result = await categoryService.getSingleCategory(req.params.id as string);

    res.json({
      success: true,
      message: "Category fetched successfully",
      data: result,
    });
  })

const updateCategory = (async (req: Request, res: Response) => {
  const parsed = updateCategorySchema.parse(req.body);

  const payload: { name?: string } = {};
  if (typeof parsed.name === "string") payload.name = parsed.name;

  const result = await categoryService.updateCategory(req.params.id as string, payload);

  res.json({
    success: true,
    message: "Category updated successfully",
    data: result,
  });
});



  const removeCategory= (async (req:Request, res:Response) => {
    const result = await categoryService.deleteCategory(req.params.id as string);

    res.json({
      success: true,
      message: "Category deleted successfully",
      data: result,
    });
  }) 


export const categoryController = {
  createCategory,
  getAllCategories,
  getOneCategory,
  updateCategory,
  removeCategory

}
