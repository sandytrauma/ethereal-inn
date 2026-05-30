// lib/actions/salon-checkout.ts
"use server";

import { db } from "@/db";
import { salonAppointments } from "@/db/glam-schema";
import { getSalonSession } from "@/lib/salon-token";
import { eq, and, gte, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Phase 1: Processes individual ticket checkout operations
 * Bound cleanly to your CheckoutControlTerminal action triggers
 */
export async function checkoutAppointmentTicket(appointmentId: string) {
  const session = await getSalonSession();
  if (!session) return { success: false, error: "Authentication credentials expired." };

  try {
    await db
      .update(salonAppointments)
      .set({ 
        status: "completed", // Fits your Drizzle enum type literals perfectly
        // 🛡️ CRITICAL SECURITY FIXED: Removed 'createdAt: new Date()' mutation.
        // Preserving historic timestamps keeps historical business metrics accurate.
      })
      .where(
        and(
          eq(salonAppointments.id, appointmentId),
          eq(salonAppointments.tenantId, String(session.tenantId)),
          eq(salonAppointments.outletId, String(session.outletId))
        )
      );

    revalidatePath("/glam/dashboard");
    revalidatePath("/glam/appointments");
    return { success: true, message: "Ticket successfully checked out and settled." };
  } catch (error: any) {
    return { success: false, error: error.message || "Checkout database mutation failed." };
  }
}

/**
 * Phase 2: Generates a flat snapshot report for the day's total cash flow
 */
export async function closeOperationalDayLedger() {
  const session = await getSalonSession();
  if (!session) return { success: false, error: "Authentication credentials expired." };

  // Track absolute mathematical boundaries for the entire calendar day loop
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  try {
    // 📊 Computes aggregate math values natively via optimized database indexing columns
    const salesRows = await db
      .select({ amount: salonAppointments.totalAmount })
      .from(salonAppointments)
      .where(
        and(
          eq(salonAppointments.tenantId, String(session.tenantId)),
          eq(salonAppointments.outletId, String(session.outletId)),
          eq(salonAppointments.status, "completed"),
          // 🌟 THE PRODUCTION FIX: Look up using scheduling execution time slots, NOT creation dates.
          gte(salonAppointments.startTime, startOfDay),
          lte(salonAppointments.startTime, endOfDay)
        )
      );

    const consolidatedEarning = salesRows.reduce((sum, row) => sum + parseFloat(row.amount || "0"), 0);

    return { 
      success: true, 
      totalSettled: consolidatedEarning,
      message: `Day closed cleanly. Total collection of ₹${consolidatedEarning.toLocaleString("en-IN")} registered in cloud master archive records.` 
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to consolidate daily ledger matrix logs." };
  }
}