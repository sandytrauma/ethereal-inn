// lib/actions/salon-appointments.ts
"use server";

import { db } from "@/db";
import { salonAppointments, salonClients } from "@/db/glam-schema";
import { getSalonSession } from "@/lib/salon-token";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

interface BookingPayload {
  clientId: number;
  targetDate: string; // 🌟 FIX: Force explicit date pass (e.g., "2026-06-15") to stop calendar context drifting
  hour: number;       // Operational hours block (e.g., 14 for 2:00 PM)
  notes?: string;
  estimatedCost?: string;
  name?: string; 
  phone?: string;
  services?: any[];
}

export async function createNewTimeSlotBooking(formData: BookingPayload) {
  const session = await getSalonSession();
  if (!session) return { success: false, error: "Authentication session expired." };

  const tenantIdStr = String(session.tenantId);
  const outletIdStr = String(session.outletId);

  try {
    // =========================================================================
    // 🛡️ SECURITY VERIFICATION: ANTI-ID-SWAPPING GATE
    // =========================================================================
    // Confirms the selected customer record belongs explicitly to this workspace tenant
    const [clientProfileMatch] = await db
      .select()
      .from(salonClients)
      .where(
        and(
          eq(salonClients.id, formData.clientId),
          eq(salonClients.tenantId, tenantIdStr)
        )
      )
      .limit(1);

    if (!clientProfileMatch) {
      return { success: false, error: "Security Access Violation: Client data context invalid." };
    }

    // =========================================================================
    // 📅 PRECISE TIMELINE MATHEMATICAL BUILD
    // =========================================================================
    // Construct the absolute timestamp objects using the client's chosen calendar day
    const startTime = new Date(`${formData.targetDate}T00:00:00`);
    startTime.setHours(formData.hour, 0, 0, 0);
    
    const endTime = new Date(startTime);
    endTime.setHours(formData.hour + 1, 0, 0, 0); // Defaults to a standard fractional 1-hour lane window

    // Generate token identification sequences 
    const ticketSequence = Math.floor(100 + Math.random() * 900);
    const generatedToken = `GLAM-REV-${ticketSequence}`;

    // 3. Commit the write securely to Neon PostgreSQL
    await db.insert(salonAppointments).values({
      tenantId: tenantIdStr,
      outletId: outletIdStr,
      clientId: formData.clientId,
      tokenNumber: generatedToken,
      appointmentDate: formData.targetDate,
      startTime: startTime,
      endTime: endTime,
      status: "scheduled", 
      totalAmount: formData.estimatedCost || "1500.00", // Fallback default baseline pricing tier 
      notes: formData.notes?.trim() || null
    });

    // Refresh layout caching segments
    revalidatePath("/glam/appointments");
    revalidatePath("/glam/dashboard");
    
    return { success: true, message: "Appointment time lane successfully locked!" };
  } catch (error: any) {
    console.error("Booking Write Exception Fallback:", error.message);
    return { success: false, error: "Failed to securely commit scheduling ledger item." };
  }
}