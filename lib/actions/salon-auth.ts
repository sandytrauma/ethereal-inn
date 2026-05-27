// lib/actions/salon-auth.ts
"use server";

import { db } from "@/db";
import { salonAuthUsers, salonTenants } from "@/db/glam-schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs"; 
import { createSalonSession, destroySalonSession } from "@/lib/salon-token";

/**
 * Validates credentials, checks subscription statuses, and issues cookies
 */
export async function loginSalonUser(credentials: { email: string; passwordRaw: string }) {
  try {
    // 🌟 THE FIX: Swap out the broken db.query relational builder for a flat join select statement
    // This runs completely immune to the "services" relationship mapping crash!
    const [resultRow] = await db
      .select({
        id: salonAuthUsers.id,
        tenantId: salonAuthUsers.tenantId,
        outletId: salonAuthUsers.outletId,
        name: salonAuthUsers.name,
        role: salonAuthUsers.role,
        passwordHash: salonAuthUsers.passwordHash,
        isActive: salonAuthUsers.isActive,
        subscriptionStatus: salonTenants.subscriptionStatus,
      })
      .from(salonAuthUsers)
      .leftJoin(salonTenants, eq(salonAuthUsers.tenantId, salonTenants.id))
      .where(eq(salonAuthUsers.email, credentials.email))
      .limit(1);

    if (!resultRow || !resultRow.isActive) {
      return { success: false, error: "Invalid Salon Credentials. Access Denied." };
    }

    const isPasswordValid = await bcrypt.compare(credentials.passwordRaw, resultRow.passwordHash);
    if (!isPasswordValid) {
      return { success: false, error: "Invalid Salon Credentials. Access Denied." };
    }

    if (resultRow.subscriptionStatus !== "active") {
      return { success: false, error: "Subscription Expired or Suspended. Contact Administration." };
    }

    // Pass parameters straight down into your root cookie generator utility method
    await createSalonSession({
      id: String(resultRow.id),
      tenantId: String(resultRow.tenantId),
      outletId: resultRow.outletId ? String(resultRow.outletId) : null,
      role: String(resultRow.role),
      name: String(resultRow.name)
    });

    return { success: true, role: resultRow.role };

  } catch (error: any) {
    console.error("Salon Auth Runtime Error:", error.message);
    return { success: false, error: "Internal Authentication Node Failure." };
  }
}

/**
 * Destroys the active salon session token cleanly upon trigger invocation
 */
export async function logoutSalonUser() {
  await destroySalonSession();
}