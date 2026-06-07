// lib/actions/salon-auth.ts
"use server";

import { db } from "@/db";
import { salonAuthUsers, salonTenants, salonOutlets } from "@/db/glam-schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createSalonSession, destroySalonSession } from "@/lib/salon-token";

function calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Validates credentials, evaluates geo-fence compliance, checks subscription constraints,
 * enforces strict subdomain scope boundaries, and issues cookies.
 */
export async function loginSalonUser(credentials: {
  email: string;
  passwordRaw: string;
  currentDomainSlug: string | null; // 🌟 ADDED: Capture incoming browser routing context
  clientLat?: number;
  clientLon?: number;
}) {
  try {
    // =========================================================================
    // 🛡️ ISOLATED MULTI-TENANT FILTER MATRICES
    // =========================================================================
    const queryConditions = [eq(salonAuthUsers.email, credentials.email.toLowerCase().trim())];

    // If logging in from a customized domain tenant portal, lock the user search
    // execution strictly down to that specific slug's database row partition.
    if (
      credentials.currentDomainSlug && 
      credentials.currentDomainSlug !== "www" && 
      !credentials.currentDomainSlug.includes("localhost")
    ) {
      queryConditions.push(eq(salonTenants.slug, credentials.currentDomainSlug.toLowerCase().trim()));
    }

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
        slug: salonTenants.slug, 
        outletLat: salonOutlets.latitude,
        outletLng: salonOutlets.longitude,
      })
      .from(salonAuthUsers)
      .leftJoin(salonTenants, eq(salonAuthUsers.tenantId, salonTenants.id))
      .leftJoin(salonOutlets, eq(salonAuthUsers.outletId, salonOutlets.id))
      .where(and(...queryConditions)) // 🌟 FIXED: Cross-checks domain tenant mapping during selection flight
      .limit(1);

    // If user credentials do not belong inside this specific subdomain slice, fail right here
    if (!resultRow || !resultRow.isActive) {
      return { success: false, error: "Invalid Salon Credentials for this workspace portal." };
    }

    const isPasswordValid = await bcrypt.compare(credentials.passwordRaw, resultRow.passwordHash);
    if (!isPasswordValid) {
      return { success: false, error: "Invalid Salon Credentials for this workspace portal." };
    }

    if (!resultRow.subscriptionStatus || resultRow.subscriptionStatus !== "active") {
      return { success: false, error: "Subscription Expired or Suspended. Contact Administration." };
    }

    const userRole = String(resultRow.role).toLowerCase().trim();
    const isAdministrativeRole = userRole === "admin" || userRole === "owner" || userRole === "tenant_admin";

    if (!isAdministrativeRole) {
      if (!resultRow.outletLat || !resultRow.outletLng) {
        return {
          success: false,
          error: "Store coordinate matrix unconfigured. Please contact your store administrator."
        };
      }

      const STORE_LATITUDE_ANCHOR = parseFloat(resultRow.outletLat);
      const STORE_LONGITUDE_ANCHOR = parseFloat(resultRow.outletLng);
      const MAX_ALLOWED_RADIUS_KM = 5.0;

      if (!credentials.clientLat || !credentials.clientLon) {
        return {
          success: false,
          error: "Location verification required. Please enable location access."
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
          error: `Access Denied: You are ${physicalDistanceApart.toFixed(2)} km away. Access is limited to ${MAX_ALLOWED_RADIUS_KM} km radius.`
        };
      }
    } else {
      console.log(`Admin login geo-fence bypassed: [${userRole}]`);
    }

    // Provision secure session token matching authenticated metadata parameters
    await createSalonSession({
      id: String(resultRow.id),
      tenantId: String(resultRow.tenantId),
      outletId: resultRow.outletId ? String(resultRow.outletId) : null,
      role: String(resultRow.role),
      name: String(resultRow.name),
      email: credentials.email.toLowerCase().trim(), 
      slug: resultRow.slug ? String(resultRow.slug) : null, 
      latitude: resultRow.outletLat ? String(resultRow.outletLat) : null,
      longitude: resultRow.outletLng ? String(resultRow.outletLng) : null,
    });

    return { success: true, role: resultRow.role };

  } catch (error: any) {
    console.error("Salon Auth Runtime Error:", error.message);
    return { success: false, error: "Internal Authentication Error." };
  }
}

export async function logoutSalonUser() {
  await destroySalonSession();
}