"use server";

import { db } from "@/db";
import { properties } from "@/db/micro-schema";
import { rooms, users } from "@/db/schema";
import bcrypt from "bcryptjs";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";


export type SaaSActionResponse = {
  success: boolean;
  error?: string; // The question mark makes it optionally present, satisfying TypeScript
};

export async function registerNewTenant(formData: FormData): Promise<SaaSActionResponse> {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!name || !email || !password) {
    return { success: false, error: "All profile fields are mandatory." };
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new partner business owner into the database
    await db.insert(users).values({
      name,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: "admin", // Allows them to provision their own properties later
    });

    // CRITICAL SAAS MODIFICATION:
    // Removed cookieStore.set() lines so you remain completely logged in 
    // as the master administrator while creating profiles!

    return { success: true };
  } catch (error: any) {
    console.error("SaaS Manual Sign-Up Exception:", error);
    if (error.code === "23505") {
      return { success: false, error: "This email address is already registered." };
    }
    return { success: false, error: "System initialization fault encountered." };
  }
}

export async function deleteTenantEntirely(tenantUserId: number): Promise<SaaSActionResponse> {
  // Prevent catastrophic accidents: Never let the system delete the Master Super Admin
  if (tenantUserId === 1) {
    return { success: false, error: "Catastrophic Protection: The root super-admin account cannot be deleted." };
  }

  try {
    return await db.transaction(async (tx) => {
      // 1. Find all properties belonging to this specific tenant user
      const tenantProperties = await tx
        .select({ id: properties.id })
        .from(properties)
        .where(eq(properties.ownerId, tenantUserId));

      const propertyIds = tenantProperties.map((p) => p.id);

      if (propertyIds.length > 0) {
        // 2. Wipe all room layouts linked to those properties first
        await tx.delete(rooms).where(inArray(rooms.propertyId, propertyIds));

        // 3. Wipe the property shell metadata records
        await tx.delete(properties).where(inArray(properties.id, propertyIds));
      }

      // 4. Finally, wipe the core tenant user profile account row
      const deleteResult = await tx.delete(users).where(eq(users.id, tenantUserId));

      if (deleteResult.rowCount === 0) {
        throw new Error("Target tenant user record not found.");
      }

      // Clear cache frameworks to remove trace entries from dashboard dropdowns
      revalidatePath("/");
      revalidatePath("/pms-admin/onboarding");

      return { success: true };
    });
  } catch (error: any) {
    console.error("Failed to safely execute tenant purging pipeline:", error);
    return { success: false, error: error.message || "Database execution fault during purge." };
  }
}

export async function purgePropertyEntirely(propertyId: string): Promise<SaaSActionResponse> {
  try {
    return await db.transaction(async (tx) => {
      // 1. First, delete all rooms belonging to this property to clear foreign keys
      await tx.delete(rooms).where(eq(rooms.propertyId, propertyId));

      // 2. Delete the property metadata row itself
      const result = await tx.delete(properties).where(eq(properties.id, propertyId));

      if (result.rowCount === 0) {
        throw new Error("Target property record not found.");
      }

      // 3. Clear cache frameworks so the dashboard updates instantly
      revalidatePath("/");
      revalidatePath("/occupancy");

      return { success: true };
    });
  } catch (error: any) {
    console.error("Failed to safely execute property purging transaction:", error);
    return { success: false, error: error.message || "Database execution fault during purge." };
  }
}