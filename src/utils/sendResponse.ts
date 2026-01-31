import { Response } from "express";

interface ISendResponse<T, M = any> {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: T;
  meta?: M; 
}

const sendResponse = <T, M = any>(res: Response, payload: ISendResponse<T, M>) => {
  const {
    success = true,
    statusCode = 200,
    message = "Request successful",
    data,
    meta,
  } = payload;

  res.status(statusCode).json({
    success,
    message,
    meta,
    data,
  });
};

export default sendResponse;
