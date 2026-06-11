// lib/actions/partner-inquiry.ts
"use server";

import { db } from "@/db";
import { partnerInquiries } from "@/db/micro-schema";
import { getSession } from "@/lib/auth"; // 🌟 Connected directly to your auth session engine
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// 🔐 SECURITY WHITELIST: Definitive system owners with global visibility permissions
const SUPERADMIN_EMAILS = [
  "admin@ethereal.com", // Replace with your exact primary superadmin login email
];

/**
 * Internal Security Guard to evaluate session identity credentials.
 * Aborts early if the user is a tenant, staff member, or manager.
 */
async function verifySuperadminSession() {
  try {
    const sessionWrapper = await getSession();
    
    if (!sessionWrapper) {
      return { isAuthorized: false, error: "Authentication credentials missing or expired." };
    }

    // 🌟 REALIGNED SECURITY MATCHING: 
    // Reads directly from your active flat token parameters
    const userId = Number(sessionWrapper.userId || sessionWrapper.id || 0);
    const role = (sessionWrapper.role || "").toLowerCase().trim();
    const propertyId = (sessionWrapper.propertyId || "").toLowerCase().trim();

    // Absolute Master Security Check:
    // User must be ID #1, role must be admin, and propertyId must be global
    const isMasterSuperadmin = userId === 1 && role === "admin" && propertyId === "global";

    if (!isMasterSuperadmin) {
      return { isAuthorized: false, error: "Access Denied: Insufficient authorization tokens." };
    }

    return { isAuthorized: true, userId };
  } catch (error) {
    return { isAuthorized: false, error: "Security subsystem validation failure." };
  }
}

// =========================================================================
// ➕ CREATE: PUBLIC SUBMISSION ENGINE (Open to landing page traffic queries)
// =========================================================================
export async function submitPartnerInquiry(payload: {
  hotelName: string;
  ownerName: string;
  email: string;
  phone: string;
  totalRooms: number;
  message?: string;
}) {
  try {
    const rawHotel = payload.hotelName?.trim();
    const rawOwner = payload.ownerName?.trim();
    const rawEmail = payload.email?.trim()?.toLowerCase();
    const rawPhone = payload.phone?.trim();

    if (!rawHotel || !rawOwner || !rawEmail || !rawPhone) {
      return { success: false, error: "Required structural data metrics are missing." };
    }

    // Basic email validation checkpoint regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(rawEmail)) {
      return { success: false, error: "Invalid corporate communication channel format." };
    }

    await db.insert(partnerInquiries).values({
      hotelName: rawHotel,
      ownerName: rawOwner,
      email: rawEmail,
      phone: rawPhone,
      totalRooms: Math.max(0, payload.totalRooms || 0),
      message: payload.message?.trim() || null,
      status: "pending",
    });

    return { success: true, message: "Prospectus successfully submitted." };
  } catch (error: any) {
    console.error("❌ Lead Ingestion Failure:", error.message);
    return { success: false, error: "Failed to record inquiry parameters into target registry." };
  }
}

// =========================================================================
// 🔒 READ: ENFORCED SUPERADMIN-ONLY LEADS LOG STREAM
// =========================================================================
export async function getPartnerInquiriesList() {
  try {
    const auth = await verifySuperadminSession();
    if (!auth.isAuthorized) {
      return { success: false, error: auth.error };
    }

    // Fetch master leads stream directly from micro-schema tables
    const leadList = await db
      .select()
      .from(partnerInquiries)
      .orderBy(desc(partnerInquiries.loggedAt));

    return { success: true, data: leadList };
  } catch (error: any) {
    console.error("❌ Fetch Inquiries Security Exception:", error.message);
    return { success: false, error: "Database transaction exception encountered." };
  }
}

// =========================================================================
// 🔒 UPDATE: ENFORCED SUPERADMIN-ONLY STATE PROGRESSIONS
// =========================================================================
export async function updateInquiryStatus(
  inquiryId: number,
  nextStatus: "pending" | "reviewing" | "contacted" | "approved"
) {
  try {
    const auth = await verifySuperadminSession();
    if (!auth.isAuthorized) {
      return { success: false, error: auth.error };
    }

    const validStatuses = ["pending", "reviewing", "contacted", "approved"];
    if (!validStatuses.includes(nextStatus)) {
      return { success: false, error: "Illegal progress route transition definition." };
    }

    await db
      .update(partnerInquiries)
      .set({ status: nextStatus })
      .where(eq(partnerInquiries.id, inquiryId));

    // Refreshes the server-side metrics on the dashboard automatically
    revalidatePath("/admin/global-inquiries");
    return { success: true, message: "Prospectus state modified cleanly." };
  } catch (error: any) {
    console.error("❌ Status Mutation Exception Handler Triggered:", error.message);
    return { success: false, error: "Failed to adjust operational stage metrics." };
  }
}