import { Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { checkoutSchema } from "./order.validation";
import { orderService } from "./order.service";


const checkout = catchAsync(async (req: any, res: Response) => {
  const userId = req.user?.id ?? req.user?.userId;
  const role = req.user?.role;

  const parsed = checkoutSchema.parse(req.body);
  const result = await orderService.checkout(userId, role, parsed);

  sendResponse(res, {
    statusCode: 201,
    message: "Order placed successfully",
    data: result,
  });
});

const myOrders = catchAsync(async (req: any, res: Response) => {
  const userId = req.user?.id ?? req.user?.userId;

  const result = await orderService.getMyOrders(userId, req.query);

  sendResponse(res, {
    message: "My orders fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const allOrders = catchAsync(async (req: any, res: Response) => {
  const role = req.user?.role;

  const result = await orderService.getAllOrders(role, req.query);

  sendResponse(res, {
    message: "All orders fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getOne = catchAsync(async (req: any, res: Response) => {
  const userId = req.user?.id ?? req.user?.userId;
  const role = req.user?.role;

  const result = await orderService.getSingleOrder(req.params.id, userId, role);

  sendResponse(res, {
    message: "Order fetched successfully",
    data: result,
  });
});

const cancel = catchAsync(async (req: any, res: Response) => {
  const userId = req.user?.id ?? req.user?.userId;
  const role = req.user?.role;

  const result = await orderService.cancelOrder(req.params.id, userId, role);

  sendResponse(res, {
    message: "Order cancelled successfully",
    data: result,
  });
});

const updateStatus = catchAsync(async (req: any, res: Response) => {
  const { status } = req.body;
  const result = await orderService.updateOrderStatus(req.params.id, status);

  sendResponse(res, {
    message: "Order status updated successfully",
    data: result,
  });
});

export const orderController = {
  checkout,
  myOrders,
  allOrders,
  getOne,
  cancel,
  updateStatus,
};
