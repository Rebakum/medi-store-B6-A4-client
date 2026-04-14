import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { medicineService } from "./medicine.service";
import { updateMedicineSchema } from "./medicine.validation";
import { publicPathFromFile } from "../../utils/publicPathFromFile";


const createMedicine = catchAsync(async (req: any, res: Response) => {
  const userId = req.user?.userId ?? req.user?.id;
  const role = req.user?.role;

  // ✅ fields upload হলে req.files object হবে
  const filesObj = (req.files ?? {}) as Record<string, Express.Multer.File[]>;
  const imageFiles = filesObj["images"] ?? [];
  const images = imageFiles.map(publicPathFromFile);

  // ✅ NEW: brandLogo from file OR body
  const brandLogoFile = (filesObj["brandLogo"] ?? [])[0];
  const brandLogoPathFromFile = brandLogoFile ? publicPathFromFile(brandLogoFile) : undefined;

  const parsed = req.body;

  const result = await medicineService.createMedicine(userId, role, {
    ...parsed,
    images,
    // file priority
    brandLogo: brandLogoPathFromFile ?? parsed.brandLogo,
  });

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

const getMyMedicines = catchAsync(async (req: any, res: Response) => {
  const userId = req.user?.userId ?? req.user?.id;
  const role = req.user?.role;

  const result = await medicineService.getMyMedicines(userId, role, req.query);

  sendResponse(res, {
    message: "My medicines fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});


const updateMedicine = catchAsync(async (req: any, res: Response) => {
  const userId = req.user?.userId ?? req.user?.id;
  const role = req.user?.role;

  const parsed = updateMedicineSchema.parse(req.body);

  const payload: any = {};
  for (const [k, v] of Object.entries(parsed)) {
    if (v !== undefined) payload[k] = v;
  }

  const filesObj = (req.files ?? {}) as Record<string, Express.Multer.File[]>;
  const imageFiles = filesObj["images"] ?? [];
  if (imageFiles.length) {
    payload.images = imageFiles.map(publicPathFromFile); // controller sends only NEW images
  }

  // ✅ NEW: brandLogo update (file)
  const brandLogoFile = (filesObj["brandLogo"] ?? [])[0];
  if (brandLogoFile) {
    payload.brandLogo = publicPathFromFile(brandLogoFile);
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
const getSearchSuggestions = catchAsync(async (req: Request, res: Response) => {
  const { search } = req.query;

  const result = await medicineService.searchMedicineSuggestions(
    search as string
  );

  sendResponse(res, {
    message: "Suggestions fetched successfully",
    data: result,
  });
});

const getFeaturedMedicines = catchAsync(async (_req: Request, res: Response) => {
  const result = await medicineService.getFeaturedMedicines();

  sendResponse(res, {
    statusCode: 200,
    message: "Featured medicines fetched successfully",
    data: result,
  });
});
export const medicineController = {
  createMedicine,
  getAllMedicines,
  getOneMedicine,
  getMyMedicines,
  updateMedicine,
  removeMedicine,
  getSearchSuggestions,
  getFeaturedMedicines,
};
