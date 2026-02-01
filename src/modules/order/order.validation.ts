import { z } from "zod";

export const checkoutSchema = z.object({
  address: z.string().min(5, "Address is required"),

  phone: z.string().min(6, "Phone is required"),   

  items: z.array(
    z.object({
      medicineId: z.string().uuid("Invalid medicineId"),
      quantity: z.number().int().min(1, "Quantity must be at least 1"),
    })
  ).min(1, "At least one item required"),
});


export const updateOrderItemsSchema = z.object({
  items: z.array(
    z.object({
      medicineId: z.string().uuid(),
      quantity: z.number().int().min(1),
    })
  ).min(1, "At least one item required"),
});

