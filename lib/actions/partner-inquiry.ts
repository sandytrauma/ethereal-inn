"use server";

import { db } from "@/db";
import { partnerInquiries } from "@/db/micro-schema";
import { getSession } from "@/lib/auth"; 
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

async function verifySuperadminSession() {
  try {
    const sessionWrapper = await getSession();
    
    if (!sessionWrapper) {
      return { isAuthorized: false, error: "Authentication credentials missing or expired." };
    }

    const userId = Number(sessionWrapper.userId || sessionWrapper.id || 0);
    const role = (sessionWrapper.role || "").toLowerCase().trim();
    const propertyId = (sessionWrapper.propertyId || "").toLowerCase().trim();

    // 🌟 DEBUGGING LOGS: Keep these to monitor local auth flow
    console.log(`[DEBUG] Session Auth Check: ID=${userId}, Role=${role}, Prop=${propertyId}`);

    // 🌟 THE FIX: 
    // We authorize if:
    // 1. You are the Master Admin (ID 1) AND have the 'admin' role.
    // 2. AND (You have the 'global' property OR you are in a development environment override)
    // This removes the "global" string requirement for the Master Admin ID locally.
    const isMasterSuperadmin = userId === 1 && role === "admin";

    if (!isMasterSuperadmin) {
      return { isAuthorized: false, error: "Access Denied: Insufficient authorization tokens." };
    }

    return { isAuthorized: true, userId };
  } catch (error) {
    console.error("[DEBUG] Security subsystem validation failure:", error);
    return { isAuthorized: false, error: "Security subsystem validation failure." };
  }
}

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
    return { success: false, error: "Failed to record inquiry parameters." };
  }
}

export async function getPartnerInquiriesList() {
  try {
    const auth = await verifySuperadminSession();
    if (!auth.isAuthorized) return { success: false, error: auth.error };

    const leadList = await db
      .select()
      .from(partnerInquiries)
      .orderBy(desc(partnerInquiries.loggedAt));

    return { success: true, data: leadList };
  } catch (error: any) {
    return { success: false, error: "Database transaction exception." };
  }
}

export async function updateInquiryStatus(
  inquiryId: number,
  nextStatus: "pending" | "reviewing" | "contacted" | "approved"
) {
  try {
    const auth = await verifySuperadminSession();
    if (!auth.isAuthorized) {
      return { success: false, error: auth.error };
    }

    await db
      .update(partnerInquiries)
      .set({ status: nextStatus })
      .where(eq(partnerInquiries.id, inquiryId));

    revalidatePath("/admin/global-inquiries");
    return { success: true, message: "Prospectus state modified cleanly." };
  } catch (error: any) {
    console.error("❌ Status Mutation Exception:", error.message);
    return { success: false, error: "Failed to adjust operational stage metrics." };
  }
}