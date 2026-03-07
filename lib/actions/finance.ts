"use server";

import { db } from "@/db";
import { financialRecords, users } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { desc, sql, eq, gte, and } from "drizzle-orm";
import { cookies } from "next/headers";
import { decrypt } from "../auth"; 
import { z } from "zod";

// --- UTILITY: DATE FILTER HELPER ---
function getStartDate(period: 'month' | 'quarter' | 'year') {
  const now = new Date();
  if (period === 'month') return new Date(now.getFullYear(), now.getMonth(), 1);
  if (period === 'quarter') return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  if (period === 'year') return new Date(now.getFullYear(), 0, 1);
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

// --- 1. GET SUMMARY (FOR THE TOP CARDS) ---
export async function getFinancialSummary(period: 'month' | 'quarter' | 'year' = 'month') {
  try {
    const startDate = getStartDate(period);

    const [summary] = await db
      .select({
        totalRevenue: sql<string>`coalesce(sum(cast(cash_revenue as numeric) + cast(upi_revenue as numeric) + cast(ota_payouts as numeric)), '0')`,
        totalExpenses: sql<string>`coalesce(sum(cast(petty_expenses as numeric)), '0')`,
      })
      .from(financialRecords)
      .where(gte(financialRecords.createdAt, startDate)); // Filtering by selected period

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

// --- 2. GET FULL HISTORY (FOR THE AUDIT TRAIL) ---
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
        roomRevenue: financialRecords.roomRevenue,
        serviceRevenue: financialRecords.serviceRevenue,
        staffName: users.name, 
      })
      .from(financialRecords)
      .leftJoin(users, eq(financialRecords.createdById, users.id)) 
      .orderBy(desc(financialRecords.createdAt))
      .limit(50); // Optimization: only show last 50 entries
  } catch (e) { 
    console.error("History fetch error:", e);
    return []; 
  }
}

// --- 3. GET STAFF MEMBERS ---
export async function getStaffMembers() {
  try {
    return await db.select({ id: users.id, name: users.name, role: users.role }).from(users);
  } catch (e) { return []; }
}

// --- 4. CLOSE DAYBOOK (SUBMISSION) ---
export async function closeDayBook(formData: any) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    const session = token ? await decrypt(token) : null;
    const extractedId = session?.id || session?.userId || session?.sub;

    if (!session || !extractedId) {
      return { success: false, error: "Unauthorized. Please re-login." };
    }

    const entry = {
      createdById: Number(extractedId),
      cashRevenue: String(formData.cashRevenue || "0"),
      upiRevenue: String(formData.upiRevenue || "0"),
      otaPayouts: String(formData.otaPayouts || "0"),
      roomRevenue: String(formData.roomRevenue || "0"), 
      serviceRevenue: String(formData.serviceRevenue || "0"),
      pettyExpenses: String(formData.pettyExpenses || "0"),
      totalCollection: String(formData.totalCollection || "0"),
      netCash: String(formData.netCash || "0"),
      notes: formData.notes || "",
    };

    await db.insert(financialRecords).values(entry);

    revalidatePath("/dashboard");
    return { success: true };

  } catch (error: any) {
    console.error("DayBook Submission Error:", error);
    return { success: false, error: error.message || "System failed to archive record." };
  }
}

// --- 5. GET REPORT DATA (FOR ANALYTICS TAB) ---
export async function getReportData(period: 'month' | 'quarter' | 'year') {
  try {
    const startDate = getStartDate(period);
    return await db.select()
      .from(financialRecords)
      .where(gte(financialRecords.createdAt, startDate))
      .orderBy(desc(financialRecords.createdAt));
  } catch (e) {
    return [];
  }
}