"use server";

import { db } from "@/db";
import { invoices, rooms } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";


export async function getRoomsList() {
  try {
    const allRooms = await db.select().from(rooms).orderBy(asc(rooms.number));
    return allRooms;
  } catch (error) {
    console.error("Database Error: Failed to fetch rooms", error);
    return [];
  }
}

export async function processCheckout(roomNumber: number, guestName: string, amount: number) {
  try {
    // 1. Create the invoice record
    await db.insert(invoices).values({
      roomNumber,
      guestName,
      totalAmount: amount,
    });

    // 2. Update room to cleaning and clear guest info
    await db.update(rooms)
      .set({ 
        status: "cleaning",
        guestName: null,
        checkInTime: null 
      })
      .where(eq(rooms.number, roomNumber));

    revalidatePath("/staff/occupancy");
    return { success: true };
  } catch (e) {
    return { success: false };
  }
}

export async function updateRoomStatus(
  roomNumber: string, 
  status: "available" | "occupied" | "cleaning" | "maintenance",
  guestName?: string // <--- Add this optional 3rd argument
) {
  try {
    await db.update(rooms)
      .set({ 
        status, 
        // If guestName is provided, update it; otherwise, if moving 
        // to available/cleaning, you might want to null it out.
        guestName: guestName || (status === 'occupied' ? undefined : null)
      })
      .where(eq(rooms.number, Number(roomNumber)));

    revalidatePath("/occupancy");
    return { success: true };
  } catch (error) {
    console.error("Failed to update room:", error);
    return { success: false };
  }
}

export async function seedRooms() {
  try {
    // 1. Check if rooms already exist
    const existing = await db.select().from(rooms);
    if (existing.length > 0) return { message: "Rooms already exist" };

    // 2. Generate 15 rooms (3 per floor)
    const roomData = [1, 2, 3, 4, 5].flatMap((floor) => 
      [1, 2, 3].map((num) => ({
        number: Number(`${floor}0${num}`), // Creates 101, 102, 103, 201...
        floor: floor,
        status: "available" as const,
      }))
    );

    await db.insert(rooms).values(roomData);
    revalidatePath("/occupancy");
    
    return { success: true };
  } catch (error) {
    console.error("Seeding failed:", error);
    return { success: false };
  }
}