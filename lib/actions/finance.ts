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
import { desc, sql, eq, gte, asc, and } from "drizzle-orm";
import { cookies } from "next/headers";
import { decrypt } from "../auth"; 
import { properties } from "@/db/micro-schema";
import { validate as validateUuid } from "uuid";

// --- HELPERS ---

/**
 * Validates if a string is a valid UUID to prevent Postgres runtime errors
 */
const isValidUUID = (uuid: string) => {
  return validateUuid(uuid);
};

/**
 * Calculates start dates based on the requested period
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

// --- CORE ACTIONS ---

/**
 * Fetches high-level financial cards data.
 * UPDATED: propertyId is now optional to support global overview.
 * Includes property metadata for context.
 */
export async function getFinancialSummary(
  propertyId?: string, 
  period: 'month' | 'quarter' | 'year' = 'month'
) {
  try {
    if (propertyId && !isValidUUID(propertyId)) {
      console.error("Invalid UUID in getFinancialSummary:", propertyId);
      return { 
        success: false, 
        error: "Invalid Property ID",
        data: { revenue: 0, expenses: 0, netProfit: 0, propertyName: "Unknown" } 
      };
    }

    const startDateStr = getStartDateString(period);
    const whereConditions = [gte(financialRecords.date, startDateStr)];
    
    if (propertyId) {
      whereConditions.push(eq(financialRecords.propertyId, propertyId));
    }

    const [summary] = await db
      .select({
        totalRevenue: sql<string>`coalesce(sum(cast(${financialRecords.totalCollection} as numeric)), '0')`,
        totalExpenses: sql<string>`coalesce(sum(cast(${financialRecords.pettyExpenses} as numeric)), '0')`,
        propertyName: properties.name,
      })
      .from(financialRecords)
      .leftJoin(properties, eq(financialRecords.propertyId, properties.id))
      .where(and(...whereConditions))
      .groupBy(properties.name);

    const revenue = Number(summary?.totalRevenue || 0);
    const expenses = Number(summary?.totalExpenses || 0);

    return { 
      success: true, 
      data: { 
        revenue, 
        expenses, 
        netProfit: revenue - expenses,
        propertyName: summary?.propertyName || "Global Fleet"
      } 
    };
  } catch (error) {
    console.error("Stats fetch error:", error);
    return { 
      success: false, 
      error: "Stats failed",
      data: { revenue: 0, expenses: 0, netProfit: 0 }
    };
  }
}

/**
 * Fetches audit trail history with user and property joins
 */
export async function getFullHistory(propertyId: string) {
  try {
    if (!propertyId || !isValidUUID(propertyId)) return [];

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
        propertyName: properties.name,
      })
      .from(financialRecords)
      .leftJoin(users, eq(financialRecords.userId, users.id)) 
      .leftJoin(properties, eq(financialRecords.propertyId, properties.id))
      .where(eq(financialRecords.propertyId, propertyId))
      .orderBy(desc(financialRecords.date))
      .limit(50);
  } catch (e) { 
    console.error("History fetch error:", e);
    return []; 
  }
}

/**
 * Fetches individual checkout invoices for a specific property
 */
export async function getInvoiceHistory(propertyId: string) {
  try {
    if (!propertyId || !isValidUUID(propertyId)) return [];

    return await db
      .select({
        id: invoices.id,
        propertyId: invoices.propertyId,
        propertyName: properties.name,
        roomNumber: invoices.roomNumber,
        guestName: invoices.guestName,
        totalAmount: invoices.totalAmount,
        checkoutDate: invoices.checkoutDate,
      })
      .from(invoices)
      .leftJoin(properties, eq(invoices.propertyId, properties.id))
      .where(eq(invoices.propertyId, propertyId))
      .orderBy(desc(invoices.checkoutDate))
      .limit(100);
  } catch (e) {
    console.error("Invoice history fetch error:", e);
    return [];
  }
}

/**
 * Fetches comprehensive report data for Market Intel Analytics (Scoped by Property)
 */
export async function getReportData(propertyId: string, period: 'month' | 'quarter' | 'year') {
  try {
    if (!propertyId || !isValidUUID(propertyId)) {
      return { success: false, message: "Invalid Property ID", logs: [], inquiries: [], guests: [], tasks: [] };
    }

    const startDateStr = getStartDateString(period);
    const startDateObj = new Date(startDateStr);

    const [logs, inquiryList, guestHistory, taskList] = await Promise.all([
      // FIXED: Explicitly select fields instead of using ...financialRecords
      db.select({
        id: financialRecords.id,
        date: financialRecords.date,
        totalCollection: financialRecords.totalCollection,
        cashRevenue: financialRecords.cashRevenue,
        upiRevenue: financialRecords.upiRevenue,
        otaPayouts: financialRecords.otaPayouts,
        roomRevenue: financialRecords.roomRevenue,
        serviceRevenue: financialRecords.serviceRevenue,
        pettyExpenses: financialRecords.pettyExpenses,
        netCash: financialRecords.netCash,
        status: financialRecords.status,
        notes: financialRecords.notes,
        propertyName: properties.name // Joined field
      })
      .from(financialRecords)
      .leftJoin(properties, eq(financialRecords.propertyId, properties.id))
      .where(and(eq(financialRecords.propertyId, propertyId), gte(financialRecords.date, startDateStr)))
      .orderBy(asc(financialRecords.date)),
      
      db.select().from(inquiries).where(and(eq(inquiries.propertyId, propertyId), gte(inquiries.createdAt, startDateObj))),
      
      db.select({
        id: invoices.id,
        guestName: invoices.guestName,
        roomNumber: invoices.roomNumber,
        totalAmount: invoices.totalAmount,
        checkoutDate: invoices.checkoutDate,
        propertyName: properties.name,
      }).from(invoices)
      .leftJoin(properties, eq(invoices.propertyId, properties.id))
      .where(and(eq(invoices.propertyId, propertyId), gte(invoices.checkoutDate, startDateObj)))
      .orderBy(desc(invoices.checkoutDate)).limit(20),
      
      db.select().from(tasks).where(and(eq(tasks.propertyId, propertyId), gte(tasks.createdAt, startDateObj)))
    ]);

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
 * Reconciles day book figures for a specific property
 */
export async function closeDayBook(formData: any, propertyId: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    const session = token ? await decrypt(token) : null;
    const userId = session?.id || (session as any)?.userId;

    if (!userId) return { success: false, error: "Unauthorized. Please re-login." };
    if (!propertyId || !isValidUUID(propertyId)) return { success: false, error: "Valid Property ID is required." };

    const todayStr = new Date().toISOString().split('T')[0];

    const existingRecord = await db.select()
      .from(financialRecords)
      .where(and(eq(financialRecords.date, todayStr), eq(financialRecords.propertyId, propertyId)))
      .limit(1);

    const payload = {
      userId: Number(userId),
      cashRevenue: String(formData.cashRevenue || "0"),
      upiRevenue: String(formData.upiRevenue || "0"),
      otaPayouts: String(formData.otaPayouts || "0"),
      roomRevenue: String(formData.roomRevenue || "0"), 
      serviceRevenue: String(formData.serviceRevenue || "0"),
      pettyExpenses: String(formData.pettyExpenses || "0"),
      totalCollection: String(formData.totalCollection || "0"),
      netCash: String(formData.netCash || "0"),
      status: "reconciled" as const,
      updatedAt: new Date(),
    };

    if (existingRecord.length > 0) {
      await db.update(financialRecords).set(payload).where(eq(financialRecords.id, existingRecord[0].id));
    } else {
      await db.insert(financialRecords).values({
        ...payload,
        propertyId,
        date: todayStr,
        createdById: Number(userId),
        notes: formData.notes || "",
      });
    }

    revalidatePath("/dashboard");
    revalidatePath("/reports");
    return { success: true };
  } catch (error: any) {
    console.error("DayBook Submission Error:", error);
    return { success: false, error: "System failed to archive record." };
  }
}

/**
 * Updates status of a lead/inquiry
 */
export async function updateInquiryStatus(id: number, status: string) {
  try {
    await db.update(inquiries).set({ status }).where(eq(inquiries.id, id));
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

/**
 * Fetches all revenue and expense records for CSV export
 */
export type ExportDataResult = 
  | { success: true; data: any[]; error?: never }
  | { success: false; data: []; error: string };

export async function getExportData(
  propertyId?: string, 
  period: 'month' | 'quarter' | 'year' = 'month'
): Promise<ExportDataResult> {
  try {
    if (propertyId && !isValidUUID(propertyId)) {
      return { success: false, error: "Invalid Property ID format", data: [] };
    }

    const startDateStr = getStartDateString(period);
    const whereConditions = [gte(financialRecords.date, startDateStr)];
    
    if (propertyId) {
      whereConditions.push(eq(financialRecords.propertyId, propertyId));
    }

    const records = await db
      .select({
        id: financialRecords.id,
        date: financialRecords.date,
        propertyName: properties.name,
        staffName: users.name,
        roomRevenue: financialRecords.roomRevenue,
        serviceRevenue: financialRecords.serviceRevenue,
        cashRevenue: financialRecords.cashRevenue,
        upiRevenue: financialRecords.upiRevenue,
        otaPayouts: financialRecords.otaPayouts,
        totalCollection: financialRecords.totalCollection,
        pettyExpenses: financialRecords.pettyExpenses,
        netCash: financialRecords.netCash,
        status: financialRecords.status,
        notes: financialRecords.notes,
        createdAt: financialRecords.createdAt,
      })
      .from(financialRecords)
      .leftJoin(properties, eq(financialRecords.propertyId, properties.id))
      .leftJoin(users, eq(financialRecords.userId, users.id))
      .where(and(...whereConditions))
      .orderBy(asc(financialRecords.date));

    return { success: true, data: records };
  } catch (error) {
    console.error("Export Fetch Error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch export data",
      data: [] 
    };
  }
}