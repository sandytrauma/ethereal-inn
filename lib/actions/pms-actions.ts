"use server";

import { db } from "@/db";
import { properties } from "@/db/micro-schema";
import { rooms, tasks, financialRecords, inquiries, statutoryMaster } from "@/db/schema";
import { eq, desc, sql, and, isNotNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// --- EXISTING FUNCTIONS ---

/**
 * Fetches all properties from the database
 */
export async function getAllProperties() {
  try { 
    return await db.select().from(properties); 
  } catch (e) { 
    return []; 
  }
}

const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

/**
 * Fetches consolidated dashboard data for a specific property
 */
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
  } catch (e) { 
    throw new Error("Sync failed"); 
  }
}

// --- NEW FUNCTIONAL ACTIONS ---

/**
 * FIXED: Added seedRooms to accept floors and roomsPerFloor arguments
 * This resolves the "Expected 0 arguments, but got 2" build error.
 */
export async function seedRooms(propertyId: string, floors: number, roomsPerFloor: number) {
  if (!isValidUUID(propertyId)) throw new Error("Invalid Property ID");

  try {
    // 1. Explicitly type the array using Drizzle's InferInsert model
    // This ensures 'status' matches the Enum defined in your schema
    const roomEntries: (typeof rooms.$inferInsert)[] = [];

    for (let f = 1; f <= floors; f++) {
      for (let r = 1; r <= roomsPerFloor; r++) {
        const roomNumber = f * 100 + r;
        
        roomEntries.push({
          propertyId: propertyId,
          number: roomNumber,
          floor: f,
          // 2. Changed "vacant" to "available" to match your schema's Enum
          status: "available", 
        });
      }
    }

    if (roomEntries.length > 0) {
      // 3. The insert will now pass validation
      await db.insert(rooms).values(roomEntries);
    }

    revalidatePath(`/pms/${propertyId}`);
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Seeding Error:", error);
    throw new Error("Failed to initialize property rooms");
  }
}

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
 * Fetches unique guest history from the rooms table
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
          isNotNull(rooms.guestName)
        )
      );

    return results;
  } catch (error) {
    console.error("Guest List Fetch Error:", error);
    return [];
  }
}