// src/modules/seller/seller.controller.ts
import { Request, Response } from "express";
import { sellerService } from "./seller.service";

export const sellerController = {
  getStats: async (req: any, res: Response) => {
    const sellerId = req.user?.userId ?? req.user?.id;
    const data = await sellerService.getStats(sellerId);
    res.json({ success: true, data });
  },
  getFeatured: async (_req: Request, res: Response) => {
  const data = await sellerService.getFeatured();
  res.json({ success: true, data });
},
};


