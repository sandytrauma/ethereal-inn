"use server";

import { db } from "@/db";
import { users, financialRecords } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Update user roles (Admin Control)
export async function updateUserRole(userId: number, newRole: string) {
  await db.update(users).set({ role: newRole }).where(eq(users.id, userId));
  revalidatePath("/");
}

// Delete a staff member (Admin Control)
export async function removeStaff(userId: number) {
  await db.delete(users).where(eq(users.id, userId));
  revalidatePath("/");
}

// Export Data (Simple CSV Generator logic placeholder)
export async function exportFinancialData() {
  const data = await db.select().from(financialRecords);
  return data; // In a real app, convert this to CSV string
}