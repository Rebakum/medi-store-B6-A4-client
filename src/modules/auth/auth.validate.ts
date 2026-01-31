import { z } from "zod";

// Public registration (ADMIN blocked)
const registerRoleEnum = z.enum(["CUSTOMER", "SELLER"]);

const nameSchema = z
  .string()
  .trim()
  .min(4, "Name must be at least 4 characters")
  .max(50, "Name must be at most 50 characters");

const emailSchema = z
  .string({ error: "Email is required" })
  .trim()
  .email("Invalid email");


const passwordSchema = z
  .string({ error: "Password is required" })
  .min(6, "Password must be at least 6 characters")
  .max(100, "Password too long")
  .regex(/[A-Z]/, "Password must contain at least 1 uppercase letter")
  .regex(/[a-z]/, "Password must contain at least 1 letter lowercase")
  .regex(/[0-9]/, "Password must contain at least 1 number");

export const authValidation = {
  //  Register
  register: z.object({
    name: nameSchema.optional(),
    email: emailSchema,
    password: passwordSchema,
    role: registerRoleEnum.optional(),
  }),

  //  Login
  login: z.object({
    email: emailSchema,
    password: z.string().min(1, "Password is required"),
  }),

  //  Update profile
  updateProfile: z
    .object({
      name: nameSchema.optional(),
      email: emailSchema.optional(),
      password: passwordSchema.optional(),
      role: registerRoleEnum.optional(),
    })
    .refine(data => Object.keys(data).length > 0, {
      message: "At least one field is required to update",
    }),
};
