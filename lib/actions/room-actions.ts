"use server";

import { db } from "@/db";
import { properties } from "@/db/micro-schema";
import { clients, financialRecords, inquiries, invoices, rooms, tasks } from "@/db/schema";
import { asc, eq, ne, sql, and, gte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { validate as validateUuid } from 'uuid';

// Types
export type RoomStatus = "available" | "occupied" | "cleaning" | "maintenance";

export type ActionResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
};

/**
 * Helper to validate UUID strings before database execution
 */
const isValidUuidString = (uuid: string) => {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return regex.test(uuid);
};

/**
 * Fetches rooms list.
 * UPDATED: 'propertyId' is now optional (?) to allow for global fetching.
 * This prevents "Expected 1 arguments" and "Malformed UUID" errors.
 */
/**
 * Fetches rooms list with Property Names.
 * JOINs the properties table to provide human-readable context.
 */
export async function getRoomsList(propertyId?: string): Promise<any[]> {
  try {
    // 1. Define the base query with a Join to get the property name
    const baseQuery = db
      .select({
        // Room fields
        id: rooms.id,
        number: rooms.number,
        floor: rooms.floor,
        status: rooms.status,
        propertyId: rooms.propertyId,
        guestName: rooms.guestName,
        checkInTime: rooms.checkInTime,
        // Property field from the joined table
        propertyName: properties.name, 
      })
      .from(rooms)
      .leftJoin(properties, eq(rooms.propertyId, properties.id));

    // 2. GLOBAL FETCH: If no ID provided, return all rooms with their names
    if (!propertyId) {
      return await baseQuery.orderBy(asc(rooms.number));
    }

    // 3. VALIDATION: If an ID is provided, ensure it is a valid UUID
    if (!isValidUuidString(propertyId)) {
      console.warn("Invalid UUID provided for getRoomsList, falling back to empty array:", propertyId);
      return [];
    }

    // 4. SCOPED FETCH: Return rooms for specific property
    return await baseQuery
      .where(eq(rooms.propertyId, propertyId))
      .orderBy(asc(rooms.number));
      
  } catch (error) {
    console.error("Database error in getRoomsList:", error);
    return [];
  }
}

/**
 * Updates status and guest metadata for a specific unit.
 * Scoped by propertyId to prevent cross-property updates.
 */
export async function updateRoomStatus(
  propertyId: string,
  roomNumber: number | string, 
  status: RoomStatus, 
  guestName?: string | null,
  metadata?: { pax?: number; idNumber?: string; origin?: string }
): Promise<ActionResponse> {
  if (!validateUuid(propertyId)) return { success: false, error: "Invalid Property ID" };

  try {
    const isOccupied = status === 'occupied';
    const num = Number(roomNumber);
    if (isNaN(num)) return { success: false, error: "Invalid Room Number" };

    return await db.transaction(async (tx) => {
      // 1. Update the Room Table
      await tx.update(rooms)
        .set({ 
          status: status,
          guestName: isOccupied ? (guestName || null) : null,
          checkInTime: isOccupied ? new Date() : null,
        })
        .where(
          and(
            eq(rooms.propertyId, propertyId),
            eq(rooms.number, num)
          )
        );

      // 2. If Checking In, Create the Guest Registry (Inquiries)
      if (isOccupied && guestName) {
        await tx.insert(inquiries).values({
          propertyId: propertyId,
          message: `Guest: ${guestName} | ID: ${metadata?.idNumber || 'N/A'} | Pax: ${metadata?.pax || 1}`,
          status: "converted",
          source: metadata?.origin || "Walk-in", 
          createdAt: new Date(),
        });
      }

      revalidatePath("/occupancy");
      revalidatePath("/inventory");
      revalidatePath("/dashboard");
      revalidatePath(`/pms/${propertyId}`);
      
      return { success: true };
    });
  } catch (error: any) {
    console.error("Room Update Error:", error);
    return { success: false, error: error.message || "Failed to update room status" };
  }
}

/**
 * Processes checkout and ensures financial records are linked to the correct property.
 */
export async function processCheckout(
  propertyId: string, 
  roomNumber: number, 
  guestName: string, 
  totalAmount: number
): Promise<ActionResponse> {
  if (!validateUuid(propertyId)) return { success: false, error: "Invalid Property ID" };

  try {
    return await db.transaction(async (tx) => {
      
      // 1. Update Room State - scoped to property
      await tx.update(rooms)
        .set({ 
          status: 'cleaning', 
          guestName: null, 
          checkInTime: null 
        })
        .where(
          and(
            eq(rooms.propertyId, propertyId),
            eq(rooms.number, roomNumber)
          )
        );

      // 2. Log Invoice
      await tx.insert(invoices).values({
        propertyId: propertyId,
        roomNumber,
        guestName,
        totalAmount: Math.round(totalAmount), 
        checkoutDate: new Date(),
      });

      const todayDate = new Date().toISOString().split('T')[0];

      // 3. Update or Create Financial Record for THIS property
      const existingRecord = await tx.select()
        .from(financialRecords)
        .where(
          and(
            eq(financialRecords.date, todayDate),
            eq(financialRecords.propertyId, propertyId)
          )
        )
        .limit(1);

      if (existingRecord.length > 0) {
        await tx.update(financialRecords)
          .set({
            roomRevenue: sql`CAST(${financialRecords.roomRevenue} AS NUMERIC) + ${totalAmount}`,
            totalCollection: sql`CAST(${financialRecords.totalCollection} AS NUMERIC) + ${totalAmount}`,
          })
          .where(eq(financialRecords.id, existingRecord[0].id));
      } else {
        await tx.insert(financialRecords).values({
          propertyId: propertyId,
          date: todayDate,
          roomRevenue: totalAmount.toString(),
          totalCollection: totalAmount.toString(),
          cashRevenue: "0",
          upiRevenue: "0",
          otaPayouts: "0",
          serviceRevenue: "0",
          pettyExpenses: "0",
          netCash: "0",
          status: "pending"
        });
      }

      revalidatePath("/occupancy");
      revalidatePath("/inventory");
      revalidatePath("/dashboard");
      revalidatePath(`/pms/${propertyId}`);
      
      return { success: true };
    });
  } catch (error: any) {
    console.error("Checkout Error:", error);
    return { success: false, error: error.message || "Failed to process checkout revenue" };
  }
}

/**
 * seedRooms
 * CLEARS existing room data for ONLY the specified property and rebuilds the grid.
 */
export async function seedRooms(
  propertyId: string, 
  floors: number, 
  roomsPerFloor: number
): Promise<ActionResponse> {
  try {
    if (!propertyId || !validateUuid(propertyId)) {
      throw new Error("A valid Property ID is required for seeding.");
    }

    // Scoped delete: only delete rooms belonging to this property
    await db.delete(rooms).where(eq(rooms.propertyId, propertyId));

    const roomData = [];
    for (let f = 1; f <= floors; f++) {
      for (let r = 1; r <= roomsPerFloor; r++) {
        roomData.push({
          number: f * 100 + r, 
          floor: f,
          status: "available" as const,
          propertyId: propertyId,
        });
      }
    }

    if (roomData.length > 0) {
      await db.insert(rooms).values(roomData);
    }
    
    revalidatePath("/occupancy");
    revalidatePath("/inventory");
    revalidatePath("/dashboard");
    revalidatePath(`/pms/${propertyId}`);

    return { success: true, count: roomData.length };
  } catch (error: any) {
    console.error("Seed Error:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Fetches rooms, tasks, and inquiries for a specific property's reception.
 */
export async function getLiveReceptionData(propertyId: string): Promise<ActionResponse> {
  if (!propertyId || !validateUuid(propertyId)) {
    return { success: false, error: "Invalid or missing property selection" };
  }

  try {
    const [allRooms, activeTasks, recentInquiries] = await Promise.all([
      db.select().from(rooms).where(eq(rooms.propertyId, propertyId)).orderBy(rooms.number),
      db.select().from(tasks).where(and(eq(tasks.propertyId, propertyId), ne(tasks.status, "completed"))),
      db.select().from(inquiries).where(and(eq(inquiries.propertyId, propertyId), eq(inquiries.status, "new"))).limit(5)
    ]);

    return {
      success: true,
      data: {
        rooms: allRooms,
        tasks: activeTasks,
        inquiries: recentInquiries
      }
    };
  } catch (error: any) {
    console.error("Database Error:", error);
    return { success: false, error: error.message || "Database connection failed" };
  }
}

/**
 * Trims excess rooms (e.g., if you mistakenly seeded 12 but only have 6).
 */
export async function trimExcessRooms(
  propertyId: string, 
  floor: number, 
  keepCount: number
): Promise<ActionResponse> {
  if (!validateUuid(propertyId)) return { success: false, error: "Invalid Property ID" };
  
  try {
    const threshold = (floor * 100) + keepCount + 1;

    await db.delete(rooms)
      .where(
        and(
          eq(rooms.propertyId, propertyId),
          eq(rooms.floor, floor),
          gte(rooms.number, threshold)
        )
      );

    revalidatePath("/occupancy");
    revalidatePath(`/pms/${propertyId}`);
    
    return { success: true, message: `Trimmed rooms on floor ${floor} starting from ${threshold}` };
  } catch (error: any) {
    console.error("Cleanup failed:", error);
    return { success: false, error: error.message || "Failed to trim rooms" };
  }
}