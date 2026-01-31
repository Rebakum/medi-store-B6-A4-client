import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { medicineService } from "./medicine.service";
import { createMedicineSchema, updateMedicineSchema } from "./medicine.validation";

const createMedicine = catchAsync(async (req: any, res: Response) => {
  const userId = req.user?.userId ?? req.user?.id;
  const role = req.user?.role;

  const parsed = createMedicineSchema.parse(req.body);
  const result = await medicineService.createMedicine(userId, role, parsed);

  sendResponse(res, {
    statusCode: 201,
    message: "Medicine created successfully",
    data: result,
  });
});

const getAllMedicines = catchAsync(async (req: Request, res: Response) => {
  const result = await medicineService.getAllMedicines((req as any).query);

  // result = { meta, data } বা { meta, data, ... } যাই হোক spread না করে safe way
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

  const parsed = updateMedicineSchema.parse(req.body);

  //  exactOptionalPropertyTypes safe payload
  const payload: any = {};
  for (const [k, v] of Object.entries(parsed)) {
    if (v !== undefined) payload[k] = v;
  }

  const result = await medicineService.updateMedicine(req.params.id, userId, role, payload);

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
