import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import ApiError from "../utils/apiError";

const globalErrorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = 500;
  let message = "Something went wrong";
  let errors: { field: string; message: string }[] | undefined;

  //  ApiError
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  //  Zod error (v4 uses "issues")
  else if (err instanceof ZodError) {
    statusCode = 400;
    message = "Validation error";
    errors = err.issues.map((i) => ({
      field: i.path.join("."),
      message: i.message,
    }));
  }

  //  Prisma known error
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint
    if (err.code === "P2002") {
      statusCode = 409;
      const target = Array.isArray(err.meta?.target)
        ? err.meta?.target.join(", ")
        : String(err.meta?.target ?? "field");
      message = `Duplicate value for ${target}`;
    }
  }

  //  normal error
  else if (err instanceof Error) {
    message = err.message;
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors, 
  });
};

export default globalErrorHandler;
