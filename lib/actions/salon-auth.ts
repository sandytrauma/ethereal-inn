// lib/actions/salon-auth.ts
"use server";

import { db } from "@/db";
import { salonAuthUsers, salonTenants } from "@/db/glam-schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs"; 
import { createSalonSession, destroySalonSession } from "@/lib/salon-token";

// 🧮 Pure Mathematical Haversine Distance Calculator (5 KM Fence Verification)
function calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Validates credentials, evaluates geo-fence compliance, checks subscriptions, and issues cookies
 */
export async function loginSalonUser(credentials: { 
  email: string; 
  passwordRaw: string;
  clientLat?: number; // 📍 Captured via browser navigator API
  clientLon?: number;
}) {
  try {
    // 🌟 Flat join execution: Safe from relationship structure compilation drops
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
        // Pull down configuration metadata layer for geo evaluation checks
        // Note: Assuming you mapped location variables inside salonTenants or extended parameters
        // If these coordinates live inside salonTenantDetails, swap the table reference accordingly
      })
      .from(salonAuthUsers)
      .leftJoin(salonTenants, eq(salonAuthUsers.tenantId, salonTenants.id))
      .where(eq(salonAuthUsers.email, credentials.email))
      .limit(1);

    // 1. Structural Checklist Gates
    if (!resultRow || !resultRow.isActive) {
      return { success: false, error: "Invalid Salon Credentials. Access Denied." };
    }

    // 2. Cryptographic Security check
    const isPasswordValid = await bcrypt.compare(credentials.passwordRaw, resultRow.passwordHash);
    if (!isPasswordValid) {
      return { success: false, error: "Invalid Salon Credentials. Access Denied." };
    }

    // 3. Multi-Tenant Status Guard rails
    if (!resultRow.subscriptionStatus || resultRow.subscriptionStatus !== "active") {
      return { success: false, error: "Subscription Expired or Suspended. Contact Administration." };
    }

    // 4. 🛡️ 5 KM RADIUS GEOGATE ENFORCEMENT LAYER
    // Replace placeholder coordinates below with real references if stored inside your configuration tables
    const STORE_LATITUDE_ANCHOR = 25.4489;  // Target Store Base latitude
    const STORE_LONGITUDE_ANCHOR = 81.8212; // Target Store Base longitude
    const MAX_ALLOWED_RADIUS_KM = 5.00;

    if (!credentials.clientLat || !credentials.clientLon) {
      return { 
        success: false, 
        error: "Security Access Requirement: Device physical location synchronization must be active to log in." 
      };
    }

    const physicalDistanceApart = calculateHaversineDistanceKm(
      credentials.clientLat,
      credentials.clientLon,
      STORE_LATITUDE_ANCHOR,
      STORE_LONGITUDE_ANCHOR
    );

    if (physicalDistanceApart > MAX_ALLOWED_RADIUS_KM) {
      return {
        success: false,
        error: `Terminal Access Restricted: You are currently located ${physicalDistanceApart.toFixed(2)} km away. Device operations are locked to a ${MAX_ALLOWED_RADIUS_KM} km storefront radius.`
      };
    }

    // 5. Build Cryptographic Cookie Session Identity
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