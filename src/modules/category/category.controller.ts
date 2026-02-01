import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { categoryService } from "./category.service";
import { createCategorySchema, updateCategorySchema } from "./category.validation";
import ApiError from "../../utils/apiError";
import httpStatus from "http-status";
import { upload } from "../../config/multer.config";
import { publicPathFromFile } from "../../utils/publicPathFromFile";



const createCategory = catchAsync(async (req: any, res: Response) => {
  const parsed = createCategorySchema.parse(req.body);

  const payload: { name: string; image?: string } = {
    name: parsed.name,
  };

  if (req.file) {
    payload.image = publicPathFromFile(req.file); 
  }

  const result = await categoryService.createCategory(payload);

  sendResponse(res, {
    statusCode: 201,
    message: "Category created successfully",
    data: result,
  });
});


const getAllCategories = catchAsync(async (_req: Request, res: Response) => {
  const result = await categoryService.getAllCategories();

  const formatted = result.map(c => ({
    id: c.id,
    name: c.name,
    image: c.image ?? null,
    createdAt: c.createdAt,
    medicineCount: c.medicines.length,
  }));

  sendResponse(res, {
    message: "Categories fetched successfully",
    data: formatted,
  });
});

const getOneCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await categoryService.getSingleCategory(req.params.id as string);

  sendResponse(res, {
    message: "Category fetched successfully",
    data: result,
  });
});

const updateCategory = catchAsync(async (req: any, res) => {
  const payload: any = {};

  if (req.body.name) payload.name = req.body.name;
  if (req.file) payload.image = publicPathFromFile(req.file);
console.log("CT:", req.headers["content-type"]);
console.log("BODY:", req.body);
console.log("FILE:", req.file);
  const result = await categoryService.updateCategory(req.params.id, payload);

  sendResponse(res, {
    message: "Category updated successfully",
    data: result,
  });
});


const removeCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await categoryService.deleteCategory(req.params.id as string);

  sendResponse(res, {
    message: "Category deleted successfully",
    data: result,
  });
});

export const categoryController = {
  createCategory,
  getAllCategories,
  getOneCategory,
  updateCategory,
   removeCategory,
};
