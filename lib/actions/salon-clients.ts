// lib/actions/salon-clients.ts
"use server";

import { db } from "@/db";
import { salonClients } from "@/db/glam-schema";
import { getSalonSession } from "@/lib/salon-token";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function quickRegisterNewClient(formData: {
  name: string;
  phone: string;
  email?: string;
}) {
  const session = await getSalonSession();
  if (!session) return { success: false, error: "Authentication credentials expired." };

  const tenantIdStr = String(session.tenantId);
  const cleanPhone = formData.phone.trim();

  try {
    // =========================================================================
    // 🛡️ DE-DUPLICATION FIREWALL GATE
    // =========================================================================
    // Check if this phone number is already registered inside THIS specific salon tenant.
    // This allows different salon businesses to share the same customer numbers globally
    // without clashing or leaking data across your SaaS platform boundaries.
    const [existingClient] = await db
      .select({ id: salonClients.id, name: salonClients.name })
      .from(salonClients)
      .where(
        and(
          eq(salonClients.tenantId, tenantIdStr),
          eq(salonClients.phone, cleanPhone)
        )
      )
      .limit(1);

    if (existingClient) {
      return { 
        success: true, // Return true so the frontend modal can instantly auto-select the profile
        client: existingClient, 
        message: "Existing customer profile identified and automatically mapped." 
      };
    }

    // =========================================================================
    // 📝 SECURE WORKSPACE WRITE
    // =========================================================================
    const [newClient] = await db
      .insert(salonClients)
      .values({
        tenantId: tenantIdStr,
        name: formData.name.trim(),
        phone: cleanPhone,
        email: formData.email?.trim() || null,
      })
      .returning({ id: salonClients.id, name: salonClients.name });

    // Refresh dynamic layouts across your scheduling nodes
    revalidatePath("/glam/appointments");
    revalidatePath("/glam/dashboard");
    
    return { success: true, client: newClient, message: "Client profile successfully committed to salon directory!" };
  } catch (error: any) {
    console.error("Client Directory Write Exception:", error.message);
    return { success: false, error: "Failed to securely write profile card to master cloud storage." };
  }
}