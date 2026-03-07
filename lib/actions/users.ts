"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { revalidatePath } from "next/cache";
import bcrypt, { hash } from "bcryptjs";
import { z } from "zod";
import { eq } from "drizzle-orm";

const UserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["admin", "manager", "staff"]),
});

export async function createStaffMember(data: any) {
  const validated = UserSchema.safeParse(data);
  if (!validated.success) return { success: false, error: "Invalid input data" };

  try {
    const { name, email, password, role } = validated.data;
    const hashedPassword = await hash(password, 10);

    await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
      role,
    });

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    if (error.code === '23505') return { success: false, error: "Email already exists" };
    return { success: false, error: "Database error" };
  }
}

export async function updateStaffProfile(id: number, data: { name: string; password?: string }) {
  // 1. SAFETY CHECK: Prevent the NaN error from hitting the DB
  if (!id || isNaN(id)) {
    console.error("Action rejected: Received invalid ID", id);
    return { success: false, error: "System Error: Invalid User ID." };
  }

  try {
    const updateData: any = { name: data.name };

    // 2. PASSWORD HASHING: Only update if a new password is provided
    if (data.password && data.password.trim().length >= 6) {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      updateData.password = hashedPassword;
    }

    // 3. DATABASE EXECUTION
    const result = await db.update(users)
      .set(updateData)
      .where(eq(users.id, id));

    // 4. CACHE INVALIDATION: Force Next.js to pull fresh data for the entire app
    // This fixes the "profile not updating" visual bug.
    revalidatePath('/', 'layout'); 
    
    return { success: true };
  } catch (error: any) {
    console.error("Database Update Failed:", error);
    
    // Check for specific Postgres errors if needed (e.g., unique constraint)
    if (error.code === '23505') {
      return { success: false, error: "This email or name is already taken." };
    }
    
    return { success: false, error: "Database rejected the update. Please try again." };
  }
}