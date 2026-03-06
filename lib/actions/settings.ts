"use server";

import { db } from "@/db"; // or your db path
import { documents, inquiries, statutoryMaster, tasks, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateUserRole(id: number, role: string) {
  try {
    await db.update(users)
      .set({ role })
      .where(eq(users.id, id));

    revalidatePath('/'); // Refresh the data on the server
    return { success: true }; 
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to update role" };
  }
}

export async function removeStaff(id: number) {
  try {
    await db.delete(users)
      .where(eq(users.id, id));

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to remove staff member" };
  }
}

export async function exportFinancialData() {
  try {
    // Fetching data from all relevant tables for a full system backup
    const [allUsers, allTasks, allInquiries, allDocs, allStatutory] = await Promise.all([
      db.select().from(users),
      db.select().from(tasks),
      db.select().from(inquiries),
      db.select().from(documents),
      db.select().from(statutoryMaster),
    ]);

    return {
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        users: allUsers,
        tasks: allTasks,
        inquiries: allInquiries,
        documents: allDocs,
        statutory: allStatutory,
      }
    };
  } catch (error) {
    console.error("Export Error:", error);
    throw new Error("Failed to fetch export data");
  }
}