// modules/admin/admin.controller.ts
import { Request, Response } from "express";
import { adminService } from "./admin.service";

export const adminController = {
  getStats: async (_req: Request, res: Response) => {
    const data = await adminService.getStats();
    res.json({ success: true, data });
  },

  getDashboard: async (_req: Request, res: Response) => {
    const data = await adminService.getDashboard();
    res.json({ success: true, data });
  },

  //  NEW: logo upload controller
  uploadBrandLogo: async (req: any, res: Response) => {
    const data = await adminService.uploadBrandLogo(req.file);
    res.json({ success: true, data });
  },
};
