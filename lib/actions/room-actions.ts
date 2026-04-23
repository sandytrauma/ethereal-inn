"use server";

import { db } from "@/db";
import { properties } from "@/db/micro-schema";
import { clients, financialRecords, inquiries, invoices, rooms, tasks } from "@/db/schema";
import { asc, eq, ne, sql, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type RoomStatus = "available" | "occupied" | "cleaning" | "maintenance";

/**
 * Fetches all rooms ordered by unit number.
 */
export async function getRoomsList() {
  try {
    return await db.select().from(rooms).orderBy(asc(rooms.number));
  } catch (error) {
    console.error("Fetch Error:", error);
    return [];
  }
}

/**
 * Updates status and guest metadata for a specific unit.
 */
export async function updateRoomStatus(
  roomNumber: number | string, 
  status: RoomStatus, 
  guestName?: string | null
) {
  try {
    const isOccupied = status === 'occupied';
    await db.update(rooms)
      .set({ 
        status: status,
        guestName: isOccupied ? (guestName || null) : null,
        checkInTime: isOccupied ? new Date() : null,
      })
      .where(eq(rooms.number, Number(roomNumber)));

    revalidatePath("/occupancy");
    revalidatePath("/inventory");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Room Update Error:", error);
    return { success: false };
  }
}

/**
 * Processes checkout, generates invoice, and updates financial records.
 */
export async function processCheckout(roomNumber: number, guestName: string, totalAmount: number) {
  try {
    return await db.transaction(async (tx) => {
      
      const [roomDetails] = await tx
        .select({ propertyId: rooms.propertyId })
        .from(rooms)
        .where(eq(rooms.number, roomNumber))
        .limit(1);

      if (!roomDetails || !roomDetails.propertyId) {
        throw new Error(`Room ${roomNumber} is not assigned to a property.`);
      }

      const activePropertyId = roomDetails.propertyId;

      // Update Room State
      await tx.update(rooms)
        .set({ 
          status: 'cleaning', 
          guestName: null, 
          checkInTime: null 
        })
        .where(eq(rooms.number, roomNumber));

      // Log Invoice
      await tx.insert(invoices).values({
        roomNumber,
        guestName,
        totalAmount: Math.round(totalAmount), 
        checkoutDate: new Date(),
      });

      const todayDate = new Date().toISOString().split('T')[0];

      // Update or Create Financial Record for the day
      const existingRecord = await tx.select()
        .from(financialRecords)
        .where(
          and(
            eq(financialRecords.date, todayDate),
            eq(financialRecords.propertyId, activePropertyId)
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
          propertyId: activePropertyId,
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
      return { success: true };
    });
  } catch (error) {
    console.error("Checkout Error:", error);
    return { success: false, message: "Failed to process checkout revenue" };
  }
}

/**
 * seedRooms
 * CLEARS existing room data and builds the new structural grid.
 */
export async function seedRooms(propertyId: string, floors: number, roomsPerFloor: number) {
  try {
    // 1. VALIDATION
    // Use the propertyId passed from the frontend instead of selecting the first property from DB
    if (!propertyId) throw new Error("Property ID is required for seeding.");

    // 2. CLEAR EXISTING DATA
    // Only delete rooms belonging to THIS specific property
    await db.delete(rooms).where(eq(rooms.propertyId, propertyId));

    const roomData = [];

    // 3. DYNAMIC GENERATION 
    // We use the arguments passed from the frontend (e.g., 1 floor, 9 rooms)
    for (let f = 1; f <= floors; f++) {
      for (let r = 1; r <= roomsPerFloor; r++) {
        roomData.push({
          // Generates 101-109 for floor 1, 201-209 for floor 2, etc.
          number: f * 100 + r, 
          floor: f,
          status: "available" as const,
          propertyId: propertyId,
        });
      }
    }

    // 4. BATCH INSERT
    if (roomData.length > 0) {
        await db.insert(rooms).values(roomData);
    }
    
    // 5. CACHE INVALIDATION
    // Ensure all possible routes using this data are refreshed
    revalidatePath("/occupancy");
    revalidatePath("/inventory");
    revalidatePath("/dashboard");
    // If you have a dynamic route [id], revalidate that too:
    revalidatePath(`/pms/${propertyId}`);

    return { success: true, count: roomData.length };
  } catch (error: any) {
    console.error("Seed Error:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Fetches rooms, tasks, and inquiries for the reception interface.
 */
export async function getLiveReceptionData() {
  try {
    const allRooms = await db.select().from(rooms).orderBy(rooms.number);

    const activeTasks = await db.select()
      .from(tasks)
      .where(ne(tasks.status, "completed"));

    const recentInquiries = await db.select()
      .from(inquiries)
      .where(eq(inquiries.status, "new"))
      .limit(5);

    return {
      success: true,
      rooms: allRooms,
      tasks: activeTasks,
      inquiries: recentInquiries
    };
  } catch (error) {
    console.error("Database Error:", error);
    return { success: false, error: "Database connection failed" };
  }
}