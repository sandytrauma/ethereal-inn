"use server";

import { db } from "@/db";
import { properties } from "@/db/micro-schema";
import { rooms } from "@/db/schema";
import { revalidatePath } from "next/cache";

export type PropertyActionResponse = 
  | { success: true; propertyId: string } 
  | { success: false; error: string };

// 1. EXTENDED SIGNATURE: Accepts slug and userId from components safely
export async function initializeNewProperty(data: {
  name: string;
  city: string;
  managerEmail: string;
  floors: number;
  roomsPerFloor: number;
  slug: string;   // Added parameter matching layout requirements
  userId: number; // Added parameter matching tenant tracking rules
}): Promise<PropertyActionResponse> {
  try {
    return await db.transaction(async (tx) => {
      // 2. Insert Property Metadata with Owner Scope Mapping
      const [newProperty] = await tx.insert(properties).values({
        name: data.name,
        slug: data.slug, // Uses the generated safe slug string passed from UI
        city: data.city,
        managerEmail: data.managerEmail,
        
        // =========================================================================
        // MULTI-TENANT TRACKING INJECTION
        // Maps the incoming user identifier to your schema column cleanly
        // =========================================================================
        ownerId: data.userId, 
      }).returning({ id: properties.id });

      if (!newProperty) {
        throw new Error("Failed to generate Property record.");
      }

      const propertyId = newProperty.id;

      // 3. Prepare Room Data (Untouched - exactly as you wrote it)
      const roomData = [];
      for (let f = 1; f <= data.floors; f++) {
        for (let r = 1; r <= data.roomsPerFloor; r++) {
          roomData.push({
            number: f * 100 + r, 
            floor: f,
            status: "available" as const,
            propertyId: propertyId,
            guestName: null,
            checkInTime: null,
            pax: 0,
            idNumber: null,
            origin: null,
          });
        }
      }

      // 4. Bulk Insert Rooms (Untouched)
      if (roomData.length > 0) {
        await tx.insert(rooms).values(roomData);
      }

      revalidatePath("/dashboard");
      revalidatePath("/occupancy");

      return { success: true, propertyId };
    });
  } catch (error: any) {
    console.error("Initialization Failed:", error);
    return { success: false, error: error.message || "Database Insert Error" };
  }
}