import { z } from "zod";

export const createMedicineSchema = z.object({
  name: z.string().min(2),
  brand: z.string().min(1),
  form: z.enum(["TABLET","CAPSULE","SYRUP","INJECTION","OINTMENT","DROPS"]),
  price: z.coerce.number().min(0),
  stock: z.coerce.number().int().min(0),
  description: z.string().min(1),
  manufacturer: z.string().min(1),
  categoryId: z.string().uuid(),
  status: z.enum(["ACTIVE","OUT_OF_STOCK","DISABLED"]).optional(),
});
export const updateMedicineSchema = z.object({
  name: z.string().min(2).optional(),
  brand: z.string().min(1).optional(),
  form: z.enum(["TABLET","CAPSULE","SYRUP","INJECTION","OINTMENT","DROPS"]).optional(),
  price: z.coerce.number().min(0).optional(),
  stock: z.coerce.number().int().min(0).optional(),
  description: z.string().min(1).optional(),
  manufacturer: z.string().min(1).optional(),
  categoryId: z.string().uuid().optional(),
  status: z.enum(["ACTIVE","OUT_OF_STOCK","DISABLED"]).optional(),
});
