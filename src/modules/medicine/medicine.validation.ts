import { z } from "zod";

const MedicineStatus = z.enum(["ACTIVE", "OUT_OF_STOCK", "DISABLED"]);
const MedicineForm = z.enum([
  "TABLET",
  "CAPSULE",
  "SYRUP",
  "INJECTION",
  "OINTMENT",
  "DROPS",
]);

export const createMedicineSchema = z.object({
  name: z.string().min(2).max(120),
  brand: z.string().min(1).max(80),
  form: MedicineForm,
  price: z.number().positive(),
  stock: z.number().int().min(0),
  description: z.string().min(5),
  manufacturer: z.string().min(2).max(120),
  categoryId: z.string().uuid(),
  // status optional (default ACTIVE). Seller/admin চাইলে দিতে পারে:
  status: MedicineStatus.optional(),
});

export const updateMedicineSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  brand: z.string().min(1).max(80).optional(),
  form: MedicineForm.optional(),
  price: z.number().positive().optional(),
  stock: z.number().int().min(0).optional(),
  description: z.string().min(5).optional(),
  manufacturer: z.string().min(2).max(120).optional(),
  categoryId: z.string().uuid().optional(),
  status: MedicineStatus.optional(),
});
