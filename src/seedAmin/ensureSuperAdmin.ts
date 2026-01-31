import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";
import { Role } from "@prisma/client";
import config from "../config";

export const ensureSuperAdmin = async () => {
  try {
    if (config.auto_seed_super_admin !== "true") return;

    const email = config.super_admin_email?.trim().toLowerCase();
    const password = config.super_admin_password;

    if (!email || !password) {
      console.log(" SUPER_ADMIN env missing");
      return;
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        password: hashed,         
        isActive: true,
        role: Role.ADMIN,          
        name: "Super Admin",       
      },
      create: {
        name: "Super Admin",
        email,
        password: hashed,
        role: Role.ADMIN,
        isActive: true,
      },
      select: { email: true },
    });

    console.log(" Super admin ensured:", user.email);
  } catch (err) {
    console.error(" ensureSuperAdmin failed:", err);
  }
};
