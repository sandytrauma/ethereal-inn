"use server";

import { db } from "@/db";
import { financialRecords, users } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { desc, sql, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { decrypt } from "../auth"; 
import { z } from "zod";

const DayBookSchema = z.object({
  cashRevenue: z.coerce.number().min(0),
  upiRevenue: z.coerce.number().min(0),
  otaPayouts: z.coerce.number().min(0),
  pettyExpenses: z.coerce.number().min(0),
  totalCollection: z.coerce.number(),
  netCash: z.coerce.number(),
  notes: z.string().max(500).optional().nullable(),
});

export async function getFinancialSummary() {
  try {
    const [summary] = await db
      .select({
        // We use coalesce to ensure we don't get null if the table is empty
        totalRevenue: sql<string>`coalesce(sum(cash_revenue + upi_revenue + ota_payouts), '0')`,
        totalExpenses: sql<string>`coalesce(sum(petty_expenses), '0')`,
      })
      .from(financialRecords);

    // Convert strings from Postgres/Drizzle to actual numbers
    const revenue = Number(summary?.totalRevenue || 0);
    const expenses = Number(summary?.totalExpenses || 0);

    return { 
      success: true, 
      data: { 
        revenue, 
        expenses, 
        netProfit: revenue - expenses 
      } 
    };
  } catch (error) {
    console.error("Stats fetch error:", error);
    return { success: false, error: "Stats failed" };
  }
}

export async function getFullHistory() {
  try {
    return await db
      .select({
        id: financialRecords.id,
        createdAt: financialRecords.createdAt,
        totalCollection: financialRecords.totalCollection,
        cashRevenue: financialRecords.cashRevenue,
        upiRevenue: financialRecords.upiRevenue,
        otaPayouts: financialRecords.otaPayouts,
        staffName: users.name, 
      })
      .from(financialRecords)
      .leftJoin(users, eq(financialRecords.createdById, users.id)) 
      .orderBy(desc(financialRecords.createdAt));
  } catch (e) { return []; }
}

export async function getStaffMembers() {
  try {
    return await db.select({ id: users.id, name: users.name, role: users.role }).from(users);
  } catch (e) { return []; }
}

export async function closeDayBook(data: any) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  const session = token ? await decrypt(token) : null;
  if (!session?.userId) return { success: false, error: "Unauthorized" };

  const validatedFields = DayBookSchema.safeParse(data);
  if (!validatedFields.success) return { success: false, error: "Invalid data" };

  try {
    const val = validatedFields.data;
    await db.insert(financialRecords).values({
      createdById: Number(session.userId),
      cashRevenue: val.cashRevenue.toString(),
      upiRevenue: val.upiRevenue.toString(),
      otaPayouts: val.otaPayouts.toString(),
      pettyExpenses: val.pettyExpenses.toString(),
      totalCollection: val.totalCollection.toString(),
      netCash: val.netCash.toString(),
      notes: val.notes || "",
    });
    revalidatePath("/");
    return { success: true };
  } catch (error) { return { success: false, error: "Database failure" }; }
}