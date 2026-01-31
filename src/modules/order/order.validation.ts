import { z } from "zod";

export const checkoutSchema = z.object({
  address: z.string().min(5),
  items: z.array(
    z.object({
      medicineId: z.string().uuid(),
      quantity: z.number().int().min(1),
    })
  ).min(1),
});
