import "express";
import { Role } from "@prisma/client";

export interface JwtUser {
  id: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtUser;
    }
  }
}
