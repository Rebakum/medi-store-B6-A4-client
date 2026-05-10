import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { sellerService } from "./seller.service";
import { getUserId } from "../../utils/getUserId";

export const sellerController = {
  getStats: catchAsync(async (req: any, res: Response) => {
    const sellerId = getUserId(req);
    const data = await sellerService.getStats(sellerId!);
    sendResponse(res, { message: "Seller stats fetched successfully", data });
  }),

  getFeatured: catchAsync(async (_req: Request, res: Response) => {
    const data = await sellerService.getFeatured();
    sendResponse(res, { message: "Featured sellers fetched successfully", data });
  }),
};
