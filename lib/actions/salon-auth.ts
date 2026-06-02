// lib/actions/salon-auth.ts
"use server";

import { db } from "@/db";
import { salonAuthUsers, salonTenants, salonOutlets } from "@/db/glam-schema"; // 🌟 Import salonOutlets
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
    // 🌟 Expanded Join Execution: Grabs dynamic location markers straight from the assigned branch outlet
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
        // 🌟 Pull coordinates dynamically from the linked outlet location row
        outletLat: salonOutlets.latitude,
        outletLng: salonOutlets.longitude,
      })
      .from(salonAuthUsers)
      .leftJoin(salonTenants, eq(salonAuthUsers.tenantId, salonTenants.id))
      .leftJoin(salonOutlets, eq(salonAuthUsers.outletId, salonOutlets.id)) // 🌟 Linked via outletId mapping
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

    // =========================================================================
    // 4. 🛡️ 5 KM RADIUS GEOGATE ENFORCEMENT LAYER WITH ADMINISTRATIVE OVERRIDE
    // =========================================================================
    const userRole = String(resultRow.role).toLowerCase().trim();
    
    // Administrative roles bypass spatial fences entirely to permit remote orchestration
    const isAdministrativeRole = userRole === "admin" || userRole === "owner" || userRole === "tenant_admin";

    if (!isAdministrativeRole) {
      // 🌟 DYNAMIC RESOLUTION: Fall back safely to defaults if database coordinates aren't set yet
      const STORE_LATITUDE_ANCHOR = resultRow.outletLat ? parseFloat(resultRow.outletLat) : 25.4489;  
      const STORE_LONGITUDE_ANCHOR = resultRow.outletLng ? parseFloat(resultRow.outletLng) : 81.8212; 
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
    } else {
      console.log(`🔓 Login Geo-fence bypassed for administrative session context: [${userRole}]`);
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