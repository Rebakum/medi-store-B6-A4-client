import { Request } from "express";

export const getUserId = (req: Request): string | undefined => {
  const user = (req as any).user;
  return user?.id ?? user?.userId;
};
