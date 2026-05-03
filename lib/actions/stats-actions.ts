"use server";

import { db } from "@/db";
import { tasks } from "@/db/schema";
import { count, sum, and, eq, gte, lte } from "drizzle-orm";

/**
 * Fetches daily performance metrics for a specific property.
 * @param propertyId - The unique UUID of the property
 */
export async function getDailyStats(propertyId: string) {
  // 1. Validation
  if (!propertyId) {
    console.error("getDailyStats: No propertyId provided");
    return { bookings: 0, revenue: 0 };
  }

  // 2. Define "Today" boundaries (Server-side local time)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  try {
    // 3. Execute Query with Multi-property filtering
    const [result] = await db
      .select({
        totalBookings: count(tasks.id),
        totalRevenue: sum(tasks.amount),
      })
      .from(tasks)
      .where(
        and(
          // Ensure we are only looking at the requested property
          eq(tasks.propertyId, propertyId),
          // Filter by the date range
          gte(tasks.createdAt, todayStart),
          lte(tasks.createdAt, todayEnd)
        )
      );

    // 4. Return formatted results
    // sum() returns a string in Drizzle/Postgres to handle large decimals
    return {
      success: true,
      bookings: result?.totalBookings ?? 0,
      revenue: parseFloat(result?.totalRevenue ?? "0"),
    };
  } catch (error) {
    console.error(`Stats Error for property ${propertyId}:`, error);
    return { 
      success: false, 
      bookings: 0, 
      revenue: 0, 
      error: "Failed to fetch daily metrics" 
    };
  }
}