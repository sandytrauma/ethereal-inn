"use server";

import { db } from "@/db";
import { invoices, rooms, financialRecords, tasks } from "@/db/schema";
import { asc, eq, sql } from "drizzle-orm";
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
    return { success: false };
  }
}

export async function processCheckout(roomNumber: number, guestName: string, totalAmount: number) {
  return await db.transaction(async (tx) => {
    // Record the checkout as a completed "Financial Task"
    await tx.insert(tasks).values({
      roomNumber, // Ensure this field exists in your tasks table
      title: `Checkout: ${guestName}`,
      description: `Revenue: ₹${totalAmount}`,
      status: "completed",
    });

    // Reset the room
    await tx.update(rooms)
      .set({ status: "cleaning", guestName: null })
      .where(eq(rooms.number, roomNumber));

    return { success: true };
  });
}

export async function seedRooms() {
  try {
    const existing = await db.select().from(rooms).limit(1);
    if (existing.length > 0) return { success: false, message: "Rooms already exist" };

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
    console.error("Seeding failed:", error);
    return { success: false };
  }
}