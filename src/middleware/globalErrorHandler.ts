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



else if (err instanceof ZodError) {
  statusCode = 400;
  message = "Validation error";
  errors = err.issues.map(i => ({
    field: i.path.join("."),
    message: i.message,
  }));
}


else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
  statusCode = 500;
  message = err.message;
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
