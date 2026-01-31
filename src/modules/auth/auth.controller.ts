import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { authService } from "./auth.service";

const register = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const user = await authService.register(payload);

  sendResponse(res, {
    statusCode: 201,
    message: "Registered Successfully",
    data: user,
  });
});

const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const data = await authService.login(email, password);

  // ✅ refresh token httpOnly cookie
  res.cookie("refreshToken", data.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // ✅ prod true
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  sendResponse(res, {
    message: "Logged in successfully",
    data: {
      user: data.user,
      accessToken: data.accessToken,
    },
  });
});

const refresh = catchAsync(async (req: any, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
   
    return sendResponse(res, {
      statusCode: 401,
      success: false,
      message: "No refresh token",
    });
  }

  const data = await authService.refreshToken(refreshToken);

  sendResponse(res, {
    message: "Token refreshed successfully",
    data,
  });
});

const logout = catchAsync(async (_req: Request, res: Response) => {
  res.clearCookie("refreshToken");

  sendResponse(res, {
    message: "Logged out",
  });
});

const updateProfile = catchAsync(async (req: any, res: Response) => {
  const userId = req.user?.userId ?? req.user?.id;

  if (!userId) {
    return sendResponse(res, {
      statusCode: 401,
      success: false,
      message: "Unauthorized",
    });
  }

  const updated = await authService.updateProfile(userId, req.body);

  sendResponse(res, {
    message: "Profile updated successfully",
    data: updated,
  });
});

const getAllUsers = catchAsync(async (_req: Request, res: Response) => {
  const users = await authService.getAllUsers();

  sendResponse(res, {
    message: "Users fetched successfully",
    data: users,
  });
});

const getSingleUser = catchAsync(async (req: Request, res: Response) => {
  const user = await authService.getSingleUser(req.params.id as string);

  sendResponse(res, {
    message: "User fetched successfully",
    data: user,
  });
});

const deleteUser = catchAsync(async (req: Request, res: Response) => {
  await authService.deleteUser(req.params.id as string);

  sendResponse(res, {
    message: "User deleted successfully",
  });
});

export const authController = {
  register,
  login,
  refresh,
  logout,
  updateProfile,
  getAllUsers,
  getSingleUser,
  deleteUser,
};
