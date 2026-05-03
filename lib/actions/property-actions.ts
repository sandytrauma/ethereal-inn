"use server";

import { db } from "@/db";
import { properties } from "@/db/micro-schema";
import { rooms } from "@/db/schema";
import { revalidatePath } from "next/cache";

export type PropertyActionResponse = 
  | { success: true; propertyId: string } 
  | { success: false; error: string };

export async function initializeNewProperty(data: {
  name: string;
  city: string;
  managerEmail: string;
  floors: number;
  roomsPerFloor: number;
}): Promise<PropertyActionResponse> {
  try {
    return await db.transaction(async (tx) => {
      // 1. Generate Slug
      const baseSlug = data.name.toLowerCase().trim().replace(/\s+/g, '-');
      const uniqueSuffix = Math.random().toString(36).substring(2, 5);
      const slug = `${baseSlug}-${uniqueSuffix}`;

      // 2. Insert Property Metadata
      // Removed createdAt and updatedAt because they are missing from your schema
      const [newProperty] = await tx.insert(properties).values({
        name: data.name,
        slug: slug,
        city: data.city,
        managerEmail: data.managerEmail,
        // lat/lng are optional in your schema, leaving them out for now
      }).returning({ id: properties.id });

      if (!newProperty) {
        throw new Error("Failed to generate Property record.");
      }

      const propertyId = newProperty.id;

      // 3. Prepare Room Data
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
            // Ensure these fields exist in your schema. If not, delete them:
            pax: 0,
            idNumber: null,
            origin: null,
          });
        }
      }

      // 4. Bulk Insert Rooms
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