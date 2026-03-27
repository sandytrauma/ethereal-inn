"use server";

import { db } from "@/db";
import { clients, financialRecords, inquiries, invoices, rooms, tasks } from "@/db/schema";
import { asc, eq, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type RoomStatus = "available" | "occupied" | "cleaning" | "maintenance";

export async function getRoomsList() {
  try {
    return await db.select().from(rooms).orderBy(asc(rooms.number));
  } catch (error) {
    console.error("Fetch Error:", error);
    return [];
  }
}

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

    revalidatePath("/inventory");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Room Update Error:", error);
    return { success: false };
  }
}

export async function processCheckout(roomNumber: number, guestName: string, totalAmount: number) {
  try {
    return await db.transaction(async (tx) => {
      
      // 1. Update Room Status to cleaning
      await tx.update(rooms)
        .set({ 
          status: 'cleaning', 
          guestName: null, 
          checkInTime: null 
        })
        .where(eq(rooms.number, roomNumber));

      // 2. Insert into Invoices Table
      await tx.insert(invoices).values({
        roomNumber,
        guestName,
        totalAmount: Math.round(totalAmount), 
        checkoutDate: new Date(),
      });

      // 3. Update or Insert into Financial Records (The Day Book)
      const todayDate = new Date().toISOString().split('T')[0];

      const existingRecord = await tx.select()
        .from(financialRecords)
        .where(eq(financialRecords.date, todayDate))
        .limit(1);

      if (existingRecord.length > 0) {
        // Update existing daily record - using numeric cast for safety
        await tx.update(financialRecords)
          .set({
            roomRevenue: sql`CAST(${financialRecords.roomRevenue} AS NUMERIC) + ${totalAmount}`,
            totalCollection: sql`CAST(${financialRecords.totalCollection} AS NUMERIC) + ${totalAmount}`,
          })
          .where(eq(financialRecords.date, todayDate));
      } else {
        // Create new record for the day
        await tx.insert(financialRecords).values({
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

      revalidatePath("/inventory");
      revalidatePath("/dashboard");
      return { success: true };
    });
  } catch (error) {
    console.error("Checkout Error:", error);
    return { success: false, message: "Failed to process checkout revenue" };
  }
}

export async function seedRooms() {
  try {
    const existing = await db.select().from(rooms).limit(1);
    if (existing.length > 0) return { success: false };

    const roomData = [1, 2, 3, 4, 5].flatMap((floor) => 
      [1, 2, 3].map((num) => ({
        number: Number(`${floor}0${num}`),
        floor: floor,
        status: "available" as const,
      }))
    );

    await db.insert(rooms).values(roomData);
    revalidatePath("/inventory");
    return { success: true };
  } catch (error) {
    console.error("Seed Error:", error);
    return { success: false };
  }
}


export async function getLiveReceptionData() {
  try {
    // 1. Fetch all rooms
    const allRooms = await db.select().from(rooms).orderBy(rooms.number);

    // 2. Fetch active tasks for those rooms (Cleaning or Maintenance)
    const activeTasks = await db.select()
      .from(tasks)
      .where(ne(tasks.status, "completed"));

    // 3. Fetch fresh inquiries for the alert sidebar
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