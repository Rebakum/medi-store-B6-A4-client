import { Request, Response, NextFunction } from "express";
import { ZodError, ZodSchema } from "zod";

export const validateRequest =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = err.issues.map(i => ({
          field: i.path.join(".") || "body",
          message: i.message,
        }));

        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors,
        });
      }

      return res.status(500).json({
        success: false,
        message: "Something went wrong",
      });
    }
  };
