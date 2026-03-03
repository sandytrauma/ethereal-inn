"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";
import { z } from "zod";

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