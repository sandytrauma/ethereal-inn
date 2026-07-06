"use server";

import { db } from "@/db";
import { invoices } from "@/db/schema"; // 🌟 FIXED: Shifting from tasks to invoices for accurate revenue fields
import { count, sum, and, eq, gte, lte } from "drizzle-orm";
import { cookies } from "next/headers";
import { decrypt } from "../auth";

/**
 * Helper: Validates if a string is a standard UUID.
 */
const isValidUuidString = (id: string) => 
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

/**
 * Fetches daily performance metrics for a specific property context.
 * Enforces server-side session fencing to block cross-property id-swapping attacks.
 */
export async function getDailyStats(propertyId: string) {
  // 1. Structural Sanity Check
  if (!propertyId || !isValidUuidString(propertyId)) {
    console.error("getDailyStats: Malformed or missing propertyId payload");
    return { success: false, bookings: 0, revenue: 0, error: "Invalid Property identity" };
  }

  try {
    // =========================================================================
    // 2. BACKEND AUTHENTICATION SECURITY CONTAINMENT FENCE
    // Cross-verify the request with the user's session token to block leaks
    // =========================================================================
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    const session = token ? await decrypt(token).catch(() => null) : null;

    if (!session) {
      return { success: false, bookings: 0, revenue: 0, error: "Authentication required" };
    }

    const isMasterSuperAdmin = Number((session as any).userId || (session as any).id) === 1;

    const assignedPropertyId = (session as any).propertyId;

    // Direct Cross-Tenant Access Interception
    if (!isMasterSuperAdmin && String(assignedPropertyId) !== String(propertyId)) {
      console.warn(`Security Breach Alert: Cross-tenant tracking attempt by user ${session.email}`);
      return { success: false, bookings: 0, revenue: 0, error: "Access Denied: Restricted Context Scope Boundary" };
    }

    // =========================================================================
    // 3. TIMEZONE NORMALIZATION MATRIX (IST BOUNDARY CORRECTION)
    // Synchronize your server date parameters cleanly with your properties' local time
    // =========================================================================
    const nowIST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    
    // Construct local midnight lower boundary stamp
    const todayStart = new Date(nowIST);
    todayStart.setHours(0, 0, 0, 0);

    // Construct local night upper boundary stamp
    const todayEnd = new Date(nowIST);
    todayEnd.setHours(23, 59, 59, 999);

    // Convert back into raw database matching timestamps
    const dbStartBound = new Date(todayStart.getTime());
    const dbEndBound = new Date(todayEnd.getTime());

    // =========================================================================
    // 4. SECURE INVOICE AGGREGATION QUERY
    // =========================================================================
    const [result] = await db
      .select({
        totalBookings: count(invoices.id),
        totalRevenue: sum(invoices.totalAmount), // Using explicit billing metric fields
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.propertyId, propertyId),
          gte(invoices.checkoutDate, dbStartBound),
          lte(invoices.checkoutDate, dbEndBound)
        )
      );

    return {
      success: true,
      bookings: Number(result?.totalBookings ?? 0),
      revenue: parseFloat(result?.totalRevenue ?? "0"),
    };
  } catch (error) {
    console.error(`Stats Error for propertyId ${propertyId}:`, error);
    return { 
      success: false, 
      bookings: 0, 
      revenue: 0, 
      error: "Failed to fetch secure real-time daily metrics summaries" 
    };
  }
}