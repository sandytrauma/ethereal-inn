// lib/validations/culinary.ts
import { z } from "zod";

export const CulinaryOnboardSchema = z.object({
  name: z.string().min(3, "Store name must be at least 3 characters long.").trim(),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters.")
    .regex(/^[a-z0-9-]+$/, "Slugs can only contain lowercase letters, numbers, and dashes.")
    .trim(),
  locationContext: z.string().min(5, "Please provide a valid location description.").trim(),
  whatsappNumber: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, "Please enter a valid phone number with country code (e.g., +919999999999)"),
  zomatoStoreId: z.string().optional(),
  swiggyStoreId: z.string().optional(),
  toingStoreId: z.string().optional(),
  masterSecret: z.string().min(1, "Master Admin Secret passphrase is required."),
});

export type CulinaryOnboardInput = z.infer<typeof CulinaryOnboardSchema>;