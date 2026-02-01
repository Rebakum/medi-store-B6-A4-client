import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(2, "Category name is required").max(50),
 
});

export const updateCategorySchema = z.object({
  name: z.string().min(2).max(50).optional().transform(v => v ?? undefined),
  
});

