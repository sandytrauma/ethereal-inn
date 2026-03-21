"use server";

import { db } from "@/db";
import { 
  financialRecords, 
  users, 
  invoices, 
  inquiries, 
  tasks 
} from "@/db/schema";
import { revalidatePath } from "next/cache";
import { desc, sql, eq, gte, asc } from "drizzle-orm";
import { cookies } from "next/headers";
import { decrypt } from "../auth"; 

/**
 * Helper to calculate start dates based on period
 */
function getStartDateString(period: 'month' | 'quarter' | 'year') {
  const now = new Date();
  let date: Date;

  if (period === 'month') {
    date = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (period === 'quarter') {
    date = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  } else if (period === 'year') {
    date = new Date(now.getFullYear(), 0, 1);
  } else {
    date = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return date.toISOString().split('T')[0];
}

/**
 * Fetches high-level financial cards data
 */
export async function getFinancialSummary(period: 'month' | 'quarter' | 'year' = 'month') {
  try {
    const startDateStr = getStartDateString(period);

    const [summary] = await db
      .select({
        totalRevenue: sql<string>`coalesce(sum(cast(total_collection as numeric)), '0')`,
        totalExpenses: sql<string>`coalesce(sum(cast(petty_expenses as numeric)), '0')`,
      })
      .from(financialRecords)
      .where(gte(financialRecords.date, startDateStr));

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

/**
 * Fetches audit trail history with user joins
 */
export async function getFullHistory() {
  try {
    return await db
      .select({
        id: financialRecords.id,
        date: financialRecords.date,
        createdAt: financialRecords.createdAt,
        totalCollection: financialRecords.totalCollection,
        cashRevenue: financialRecords.cashRevenue,
        upiRevenue: financialRecords.upiRevenue,
        otaPayouts: financialRecords.otaPayouts,
        roomRevenue: financialRecords.roomRevenue,
        serviceRevenue: financialRecords.serviceRevenue,
        status: financialRecords.status,
        staffName: users.name, 
      })
      .from(financialRecords)
      .leftJoin(users, eq(financialRecords.userId, users.id)) 
      .orderBy(desc(financialRecords.date))
      .limit(50);
  } catch (e) { 
    console.error("History fetch error:", e);
    return []; 
  }
}

/**
 * Fetches individual checkout invoices
 */
export async function getInvoiceHistory() {
  try {
    return await db
      .select()
      .from(invoices)
      .orderBy(desc(invoices.checkoutDate))
      .limit(100);
  } catch (e) {
    console.error("Invoice history fetch error:", e);
    return [];
  }
}

/**
 * Fetches comprehensive report data for Market Intel Analytics
 */
export async function getReportData(period: 'month' | 'quarter' | 'year') {
  try {
    const startDateStr = getStartDateString(period);
    const startDateObj = new Date(startDateStr);

    const logs = await db
      .select()
      .from(financialRecords)
      .where(gte(financialRecords.date, startDateStr))
      .orderBy(asc(financialRecords.date));

    const inquiryList = await db
      .select()
      .from(inquiries)
      .where(gte(inquiries.createdAt, startDateObj));

    const guestHistory = await db
      .select({
        id: invoices.id,
        guestName: invoices.guestName,
        roomNumber: invoices.roomNumber,
        totalAmount: invoices.totalAmount,
        checkoutDate: invoices.checkoutDate,
      })
      .from(invoices)
      .where(gte(invoices.checkoutDate, startDateObj))
      .orderBy(desc(invoices.checkoutDate))
      .limit(20);

    const taskList = await db
      .select()
      .from(tasks)
      .where(gte(tasks.createdAt, startDateObj));

    return {
      success: true,
      logs: logs || [],
      inquiries: inquiryList || [],
      guests: guestHistory || [],
      tasks: taskList || []
    };
  } catch (e) {
    console.error("Report data error:", e);
    return { success: false, logs: [], inquiries: [], guests: [], tasks: [] };
  }
}

/**
 * Returns list of staff
 */
export async function getStaffMembers() {
  try {
    return await db
      .select({ 
        id: users.id, 
        name: users.name, 
        role: users.role,
        email: users.email 
      })
      .from(users)
      .orderBy(asc(users.name));
  } catch (e) { 
    console.error("Staff fetch error:", e);
    return []; 
  }
}

/**
 * Reconciles day book figures (upsert based on date)
 */
export async function closeDayBook(formData: any) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    const session = token ? await decrypt(token) : null;
    const userId = session?.id || (session as any)?.userId;

    if (!userId) {
      return { success: false, error: "Unauthorized. Please re-login." };
    }

    const todayStr = new Date().toISOString().split('T')[0];

    await db.insert(financialRecords)
      .values({
        date: todayStr,
        userId: Number(userId),
        createdById: Number(userId),
        cashRevenue: String(formData.cashRevenue || "0"),
        upiRevenue: String(formData.upiRevenue || "0"),
        otaPayouts: String(formData.otaPayouts || "0"),
        roomRevenue: String(formData.roomRevenue || "0"), 
        serviceRevenue: String(formData.serviceRevenue || "0"),
        pettyExpenses: String(formData.pettyExpenses || "0"),
        totalCollection: String(formData.totalCollection || "0"),
        netCash: String(formData.netCash || "0"),
        notes: formData.notes || "",
        status: "reconciled",
      })
      .onConflictDoUpdate({
        target: financialRecords.date,
        set: {
          userId: Number(userId),
          cashRevenue: String(formData.cashRevenue || "0"),
          upiRevenue: String(formData.upiRevenue || "0"),
          otaPayouts: String(formData.otaPayouts || "0"),
          roomRevenue: String(formData.roomRevenue || "0"), 
          serviceRevenue: String(formData.serviceRevenue || "0"),
          pettyExpenses: String(formData.pettyExpenses || "0"),
          totalCollection: String(formData.totalCollection || "0"),
          netCash: String(formData.netCash || "0"),
          status: "reconciled",
        },
      });

    revalidatePath("/dashboard");
    return { success: true };

  } catch (error: any) {
    console.error("DayBook Submission Error:", error);
    return { success: false, error: "System failed to archive record." };
  }
}

export async function updateInquiryStatus(id: number, status: string) {
  try {
    await db.update(inquiries)
      .set({ status })
      .where(eq(inquiries.id, id));
    
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    return { success: false };
  }
}

/**
 * Deletes an inquiry record
 */
export async function deleteInquiry(id: number) {
  try {
    await db.delete(inquiries).where(eq(inquiries.id, id));
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    return { success: false };
  }
}