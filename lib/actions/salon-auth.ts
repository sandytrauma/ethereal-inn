// lib/actions/salon-auth.ts
"use server";

import { db } from "@/db";
import { salonAuthUsers } from "@/db/glam-schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs"; 
import { createSalonSession, destroySalonSession } from "@/lib/salon-token"; // 🌟 Import destroy here

export async function loginSalonUser(credentials: { email: string; passwordRaw: string }) {
  try {
    const userMatch = await db.query.salonAuthUsers.findFirst({
      where: eq(salonAuthUsers.email, credentials.email),
      with: {
        tenant: true 
      }
    });

    if (!userMatch || !userMatch.isActive) {
      return { success: false, error: "Invalid Salon Credentials. Access Denied." };
    }

    const isPasswordValid = await bcrypt.compare(credentials.passwordRaw, userMatch.passwordHash);
    if (!isPasswordValid) {
      return { success: false, error: "Invalid Salon Credentials. Access Denied." };
    }

    if (userMatch.tenant.subscriptionStatus !== "active") {
      return { success: false, error: "Subscription Expired or Suspended. Contact Administration." };
    }

    await createSalonSession({
      id: String(userMatch.id),
      tenantId: String(userMatch.tenantId),
      outletId: userMatch.outletId ? String(userMatch.outletId) : null,
      role: String(userMatch.role),
      name: String(userMatch.name)
    });

    return { success: true, role: userMatch.role };

  } catch (error: any) {
    console.error("Salon Auth Runtime Error:", error.message);
    return { success: false, error: "Internal Authentication Node Failure." };
  }
}

// 🌟 THE FIX: Explicitly export logout as a named server action function
export async function logoutSalonUser() {
  await destroySalonSession();
}