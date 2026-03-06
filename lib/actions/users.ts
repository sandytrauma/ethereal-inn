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
  try {
    const updateData: any = { name: data.name };

    // Only hash and update password if the user actually typed a new one
    if (data.password && data.password.length >= 6) {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      updateData.password = hashedPassword;
    }

    await db.update(users)
      .set(updateData)
      .where(eq(users.id, id));

    revalidatePath('/'); 
    return { success: true };
  } catch (error) {
    console.error("Profile Update Error:", error);
    return { success: false, error: "Failed to sync profile changes." };
  }
}