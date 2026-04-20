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
export async function seedRooms(floorCount: number, roomsPerFloor: number) {
  try {
    const property = await db.select().from(properties).limit(1);
    if (!property || property.length === 0) throw new Error("No property found.");

    const actualPropertyId = property[0].id;
    
    // 1. CLEAR EXISTING DATA (This prevents the "5 floors" ghosting issue)
    await db.delete(rooms).where(eq(rooms.propertyId, actualPropertyId));

    const roomData = [];

    // 2. Loop through floors dynamically based on UI input
    for (let f = 1; f <= floorCount; f++) {
      for (let r = 1; r <= roomsPerFloor; r++) {
        roomData.push({
          number: f * 100 + r, // e.g. Floor 1: 101, 102...
          floor: f,
          status: "available" as const,
          propertyId: actualPropertyId,
        });
      }
    }

    // 3. Insert the new infrastructure
    if (roomData.length > 0) {
        await db.insert(rooms).values(roomData);
    }
    
    // 4. Force UI Refresh
    revalidatePath("/occupancy");
    revalidatePath("/inventory");
    revalidatePath("/dashboard");

    return { success: true, count: roomData.length };
  } catch (error: any) {
    console.error("Seed Error:", error.message);
    throw new Error(error.message);
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