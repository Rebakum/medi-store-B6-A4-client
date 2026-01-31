import { RequestHandler } from "express";

const catchAsync = (fn: RequestHandler) => {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default catchAsync;
