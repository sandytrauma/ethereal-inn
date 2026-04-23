"use server";

import { db } from "@/db";
import { properties } from "@/db/micro-schema";
import { rooms, tasks, financialRecords, inquiries, statutoryMaster } from "@/db/schema";
import { eq, desc, sql, and, isNotNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// --- EXISTING FUNCTIONS (Kept as requested) ---
export async function getAllProperties() {
  try { return await db.select().from(properties); } 
  catch (e) { return []; }
}

const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

export async function getMultiPropertyData(propertyId: string) {
  if (!isValidUUID(propertyId)) return { error: "Invalid ID", property: null };
  try {
    const [prop, rm, tsk, fin, inq, stat] = await Promise.all([
      db.select().from(properties).where(eq(properties.id, propertyId)).limit(1),
      db.select().from(rooms).where(eq(rooms.propertyId, propertyId)).orderBy(rooms.number),
      db.select().from(tasks).where(eq(tasks.propertyId, propertyId)).orderBy(desc(tasks.createdAt)).limit(5),
      db.select().from(financialRecords).where(eq(financialRecords.propertyId, propertyId)).orderBy(desc(financialRecords.date)).limit(1),
      db.select().from(inquiries).where(eq(inquiries.propertyId, propertyId)).orderBy(desc(inquiries.createdAt)).limit(5),
      db.select().from(statutoryMaster).limit(5)
    ]);

    const occupiedCount = (rm || []).filter(r => r.status === 'occupied').length;

    return {
      property: prop[0] || null,
      rooms: rm || [],
      tasks: tsk || [],
      financials: fin[0] || { totalCollection: "0" },
      inquiries: inq || [],
      statutory: stat || [],
      stats: {
        arrivals: occupiedCount,
        departures: 0,
        occupancy: `${occupiedCount}/${rm.length || 9}`,
        occupancyPercent: `${Math.round((occupiedCount / (rm.length || 9)) * 100)}%`
      }
    };
  } catch (e) { throw new Error("Sync failed"); }
}

// --- NEW FUNCTIONAL ACTIONS ---

/**
 * Fetches historical financial data for Reports
 */
export async function getReportData(propertyId: string) {
  return await db.select()
    .from(financialRecords)
    .where(eq(financialRecords.propertyId, propertyId))
    .orderBy(desc(financialRecords.date))
    .limit(30);
}

/**
 * Fetches unique guest history from the rooms and inquiries tables
 */
export async function getGuestList(propertyId: string) {
  try {
    const results = await db
      .select({
        name: rooms.guestName,
        room: rooms.number,
        status: rooms.status,
      })
      .from(rooms)
      .where(
        and(
          eq(rooms.propertyId, propertyId),
          isNotNull(rooms.guestName) // Correct Drizzle way to check for null
        )
      );

    return results;
  } catch (error) {
    console.error("Guest List Fetch Error:", error);
    return [];
  }
}