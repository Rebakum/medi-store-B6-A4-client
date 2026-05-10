import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { adminService } from "./admin.service";

export const adminController = {
  getStats: catchAsync(async (_req: Request, res: Response) => {
    const data = await adminService.getStats();
    sendResponse(res, { message: "Stats fetched successfully", data });
  }),

  getDashboard: catchAsync(async (_req: Request, res: Response) => {
    const data = await adminService.getDashboard();
    sendResponse(res, { message: "Dashboard fetched successfully", data });
  }),

  uploadBrandLogo: catchAsync(async (req: any, res: Response) => {
    const data = await adminService.uploadBrandLogo(req.file);
    sendResponse(res, { message: "Logo uploaded successfully", data });
  }),
};
