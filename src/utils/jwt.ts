import jwt, { type SignOptions } from "jsonwebtoken";
import type { StringValue } from "ms";
import config from "../config";
import { Role } from "@prisma/client";

export interface TokenPayload {
  userId: string;
  role: Role;
}

function asMsStringValue(v: string): StringValue {
  const value = v.trim();
  if (!/^(\d+)(ms|s|m|h|d|w|y)$/i.test(value)) {
    throw new Error(`Invalid expiresIn: "${v}" (use "15m", "7d", "2h")`);
  }
  return value as StringValue;
}

export const signAccessToken = (payload: TokenPayload) => {
  const secret = config.jwt.access_secret;
  if (!secret) throw new Error("JWT_ACCESS_SECRET missing");

  const options: SignOptions = {}; 

  const raw = config.jwt.access_expires_in; 
  if (raw) {
    options.expiresIn = asMsStringValue(raw); 
  }

  return jwt.sign(payload, secret, options);
};

export const signRefreshToken = (payload: TokenPayload) => {
  const secret = config.jwt.refresh_secret;
  if (!secret) throw new Error("JWT_REFRESH_SECRET missing");

  const options: SignOptions = {};

  const raw = config.jwt.refresh_expires_in;
  if (raw) {
    options.expiresIn = asMsStringValue(raw);
  }

  return jwt.sign(payload, secret, options);
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwt.access_secret) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwt.refresh_secret) as TokenPayload;
};
