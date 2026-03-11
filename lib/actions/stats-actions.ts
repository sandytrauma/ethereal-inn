"use server";

import { db } from "@/db";
import { tasks } from "@/db/schema";
import { count, sum, sql } from "drizzle-orm";

export async function getDailyStats() {
  // Define "Today" boundaries
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  try {
    const [result] = await db
      .select({
        totalBookings: count(tasks.id),
        totalRevenue: sum(tasks.amount),
      })
      .from(tasks)
      .where(
        sql`${tasks.createdAt} BETWEEN ${todayStart} AND ${todayEnd}`
      );

    return {
      bookings: result.totalBookings ?? 0,
      revenue: parseFloat(result.totalRevenue ?? "0"),
    };
  } catch (error) {
    console.error("Stats Error:", error);
    return { bookings: 0, revenue: 0 };
  }
}