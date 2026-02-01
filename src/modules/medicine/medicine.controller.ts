import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { medicineService } from "./medicine.service";
import { createMedicineSchema, updateMedicineSchema } from "./medicine.validation";
import ApiError from "../../utils/apiError";
import httpStatus from "http-status";
import { upload } from "../../config/multer.config"; 
import { publicPathFromFile } from "../../utils/publicPathFromFile";



const createMedicine = catchAsync(async (req: any, res: Response) => {
  const userId = req.user?.userId ?? req.user?.id;
  const role = req.user?.role;

  const files = (req.files as Express.Multer.File[]) || [];
  const images = files.map(publicPathFromFile);

  const parsed = req.body; // already validated by validateRequest

  const result = await medicineService.createMedicine(userId, role, { ...parsed, images });

  sendResponse(res, {
    statusCode: 201,
    message: "Medicine created successfully",
    data: result,
  });
});


const getAllMedicines = catchAsync(async (req: Request, res: Response) => {
  const result = await medicineService.getAllMedicines((req as any).query);

  sendResponse(res, {
    message: "Medicines fetched successfully",
    meta: (result as any).meta,
    data: (result as any).data ?? result,
  });
});

const getOneMedicine = catchAsync(async (req: Request, res: Response) => {
  const result = await medicineService.getSingleMedicine(req.params.id as string);

  sendResponse(res, {
    message: "Medicine fetched successfully",
    data: result,
  });
});

const updateMedicine = catchAsync(async (req: any, res: Response) => {
  const userId = req.user?.userId ?? req.user?.id;
  const role = req.user?.role;

  // ✅ if you use route-level validateRequest, you can skip parse here
  const parsed = updateMedicineSchema.parse(req.body);

  // ✅ build safe payload (exactOptionalPropertyTypes safe)
  const payload: any = {};
  for (const [k, v] of Object.entries(parsed)) {
    if (v !== undefined) payload[k] = v;
  }

  // ✅ NEW: handle incoming images (form-data)
  const files = (req.files as Express.Multer.File[]) || [];
  if (files.length) {
    const newImages = files.map(publicPathFromFile);

    // option A: REPLACE all images with newly uploaded images
    payload.images = newImages;

    // option B (if you want APPEND instead):
    // payload.images = [...(medicine.images ?? []), ...newImages]  // needs medicine fetch
  }

  const result = await medicineService.updateMedicine(
    req.params.id,
    userId,
    role,
    payload
  );

  sendResponse(res, {
    message: "Medicine updated successfully",
    data: result,
  });
});

const removeMedicine = catchAsync(async (req: any, res: Response) => {
  const userId = req.user?.userId ?? req.user?.id;
  const role = req.user?.role;

  const result = await medicineService.deleteMedicine(req.params.id, userId, role);

  sendResponse(res, {
    message: "Medicine deleted successfully",
    data: result,
  });
});

export const medicineController = {
  createMedicine,
  getAllMedicines,
  getOneMedicine,
  updateMedicine,
  removeMedicine,
};
