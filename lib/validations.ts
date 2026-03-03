import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { financialRecords } from '@/db/schema';
import { z } from 'zod';

// Schema for validating data BEFORE inserting into DB
export const insertFinancialRecordSchema = createInsertSchema(financialRecords, {
  // Overriding specific fields for stricter UI validation
  cashRevenue: z.coerce.number().min(0, "Cash cannot be negative"),
  upiRevenue: z.coerce.number().min(0),
  otaPayouts: z.coerce.number().min(0),
  pettyExpenses: z.coerce.number().min(0),
  notes: z.string().max(1000, "Notes are too long").optional(),
}).omit({
  id: true,
  createdAt: true,
});

// Type for your frontend forms
export type NewFinancialRecord = z.infer<typeof insertFinancialRecordSchema>;