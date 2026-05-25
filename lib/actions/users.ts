"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { revalidatePath } from "next/cache";
import bcrypt, { hash } from "bcryptjs";
import { z } from "zod";
import { eq } from "drizzle-orm";

// 🌟 FIXED: Appended propertyId validation constraint strings to match incoming payloads
const UserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["admin", "manager", "staff"]),
  propertyId: z.string().uuid().optional().nullable(), // Keeps validation loose but strict on structures
});

export async function createStaffMember(data: any) {
  const validated = UserSchema.safeParse(data);
  if (!validated.success) {
    console.error("Zod Validation Intercept Defect:", validated.error.format());
    return { success: false, error: "Validation Failure: Invalid input data format parameters." };
  }

  try {
    const { name, email, password, role, propertyId } = validated.data;
    const hashedPassword = await hash(password, 10);

    // 🌟 FIXED: Explicitly mapping down the propertyId context node cell column placement
    await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
      role,
      propertyId: propertyId || null, // Resolves safely to PostgreSQL columns maps
    });

    revalidatePath("/");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    if (error.code === '23505') return { success: false, error: "Email already exists inside system registry nodes" };
    console.error("Critical User Insertion Failure:", error);
    return { success: false, error: "Database transaction boundary rejection exception" };
  }
}

/**
 * Updates an existing staff profile entry safely
 */
export async function updateStaffProfile(id: number | string, data: { name: string; password?: string }) {
  const userId = typeof id === 'string' ? parseInt(id, 10) : id;

  if (!userId || isNaN(userId)) {
    return { success: false, error: "System Error: Invalid User ID." };
  }

  try { 
    const updateData: Partial<typeof users.$inferInsert> = { name: data.name };

    if (data.password && data.password.trim().length >= 6) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    await db.update(users)
      .set(updateData)
      .where(eq(users.id, userId));

    revalidatePath('/', 'layout'); 
    return { success: true };
  } catch (error: any) {
    console.error("Database Update Failed:", error);
    return { success: false, error: "Update failed. Please try again." };
  }
}