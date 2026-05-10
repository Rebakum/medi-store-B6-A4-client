import { User } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import bcrypt from "bcrypt";
import httpStatus from "http-status"

import { signAccessToken, signRefreshToken, TokenPayload, verifyRefreshToken } from "../../utils/jwt";
import ApiError from "../../utils/apiError";
import { safeUnlink } from "../../utils/file.util";

type UpdateProfilePayload = {
  name?: string;
  email?: string;
  password?: string;
  role?: "CUSTOMER" | "SELLER"; // keep public update safe
};

// Register
const register = async (payload: User) => {
     const exists = await prisma.user.findUnique({
  where: { email: payload.email }
});

if (exists) {
  throw new ApiError(httpStatus.CONFLICT, "User already exists");
}
if (payload.role === "ADMIN") {
  throw new ApiError(403, "Admin cannot be created from public registration");
}
  const hashPassword = await bcrypt.hash(payload.password, 10);
 


  const user = await prisma.user.create({
    data: { ...payload, password: hashPassword },
  });

  return user;
};

// Login

 const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid credentials");

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid credentials");

  const payload = { userId: user.id, role: user.role };

  return {
    user,
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
};


// Refresh Token
const refreshToken = async (refreshToken: string) => {
  if (!refreshToken) throw new ApiError(httpStatus.UNAUTHORIZED, "Refresh token required");

  const decoded = verifyRefreshToken(refreshToken); 
  const payload: TokenPayload  = { userId: decoded.userId, role: decoded.role };  
  const newAccessToken = signAccessToken(payload);  
  return {
    accessToken: newAccessToken,
    refreshToken: signRefreshToken(payload),
  };
};

// Logout
 const logout = async () => {
  return { loggedOut: true };
};

const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
  id: true,
  name: true,
  email: true,
  phone: true,    
  role: true,
  isActive: true,
  avatar: true,
  sellerLogo: true,
  createdAt: true,
  updatedAt: true,
}

  });

  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  return user;
};



export const updateProfile = async (userId: string, payload: any) => {
  if (!userId) throw new ApiError(httpStatus.BAD_REQUEST, "User ID required");

  // 1 First find user by ID
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  // 2 Block admin role change
  if (payload.role === "ADMIN") {
    throw new ApiError(403, "Admin role cannot be set from this endpoint");
  }

  const data: any = {};

  if (payload.name) data.name = payload.name;
  if (payload.phone !== undefined) data.phone = payload.phone;

  if (payload.isActive !== undefined) data.isActive = payload.isActive;

    if (payload.password) {
    data.password = await bcrypt.hash(payload.password, 10);
  }

    if (payload.email) {
    const email = payload.email.toLowerCase().trim();

    const exists = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id: userId },
      },
      select: { id: true },
    });

    if (exists) {
      throw new ApiError(httpStatus.CONFLICT, "Email already exists");
    }

    data.email = email;
  }

  // 5 Finally update (ID based)
  const updated = await prisma.user.update({
    where: { id: userId },
    data,
  select: {
  id: true,
  name: true,
  email: true,
  phone: true,      
  role: true,
  isActive: true,
  avatar: true,
  sellerLogo: true,
  createdAt: true,
  updatedAt: true,
}

  });

  return updated;
};

const getAllUsers = async () => {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
};
const getSingleUser = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");

  return user;
};

const deleteUser = async (id: string) => {
  return prisma.user.delete({
    where: { id },
    select: {
      id: true,
      email: true,
    },
  });
};


//  avatar upload
const updateAvatar = async (userId: string, avatarPath: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");

  // delete old avatar
  if (user.avatar && user.avatar !== avatarPath) safeUnlink(user.avatar);

  return prisma.user.update({
    where: { id: userId },
    data: { avatar: avatarPath },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      sellerLogo: true,
      isActive: true,
      updatedAt: true,
    },
  });
};



//  seller logo upload (SELLER only) + title update
const updateSellerLogo = async (userId: string, logoPath: string, title?: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");

  // delete old logo
  if (user.sellerLogo && user.sellerLogo !== logoPath) safeUnlink(user.sellerLogo);

  const cleanTitle = (title ?? "").trim();

  return prisma.user.update({
    where: { id: userId },
    data: {
      sellerLogo: logoPath,
      ...(cleanTitle ? { name: cleanTitle } : {}), 
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      sellerLogo: true,
      isActive: true,
      updatedAt: true,
    },
  });
};

export const authService = {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  updateProfile,
  getAllUsers,
  deleteUser,
  getSingleUser,
  updateAvatar,
  updateSellerLogo,
};