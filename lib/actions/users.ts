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

export async function updateStaffProfile(id: number | string, data: { name: string; password?: string }) {
  // 1. Convert ID safely - Drizzle 'eq' expects the exact type defined in schema
  const userId = typeof id === 'string' ? parseInt(id, 10) : id;

  if (!userId || isNaN(userId)) {
    return { success: false, error: "System Error: Invalid User ID." };
  }

  try { 
    // Prepare update object with explicit typing
    const updateData: Partial<typeof users.$inferInsert> = { name: data.name };

    // 2. PASSWORD HASHING
    if (data.password && data.password.trim().length >= 6) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    // 3. DATABASE EXECUTION
    const result = await db.update(users)
      .set(updateData)
      .where(eq(users.id, userId));

    // 4. CACHE INVALIDATION
    // 'layout' is good, but for specific PMS data, revalidating the specific path is faster
    revalidatePath('/', 'layout'); 
    
    return { success: true };
  } catch (error: any) {
    console.error("Database Update Failed:", error);
    return { success: false, error: "Update failed. Please try again." };
  }
}