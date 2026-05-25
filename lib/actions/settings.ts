"use server";

import { db } from "@/db"; 
import { documents, inquiries, statutoryMaster, tasks, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * 🌟 FIXED: Dynamically coordinates both Role changes AND Property UUID links 
 * to ensure users are anchored straight to their operational branch environments.
 */
export async function updateUserRole(id: number, role: string, propertyId: string) {
  try {
    if (!propertyId || propertyId === "global" || propertyId === "undefined") {
      return { success: false, error: "Validation Failure: A valid Property ID is mandatory to bind user access." };
    }

    await db.update(users)
      .set({ 
        role: role.toLowerCase().trim(), 
        propertyId: propertyId // Explicitly links user to their physical location column node
      })
      .where(eq(users.id, id));

    revalidatePath('/'); // Clear layout caches on server instantly
    return { success: true }; 
  } catch (error) {
    console.error("Failed to update user role mapping constraints:", error);
    return { success: false, error: "Server encountered a database error during account update." };
  }
}

/**
 * Removes a staff member safely from the system bounds
 */
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

/**
 * 🌟 FIXED & SECURED: Enforces strict multi-tenant boundary parameters on backup extraction loops.
 * Ensures a branch administrator can only back up data belonging to their active workspace context.
 */
export async function exportFinancialData() {
  try {
    // 1. SECURE SESSION ACCESS EVALUATION
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    const session = token ? await decrypt(token).catch(() => null) : null;

    if (!session) {
      throw new Error("Unauthorized Access: Verification token expired.");
    }

    const isMasterSuperAdmin = Number((session as any).userId || (session as any).id) === 1;
    const assignedPropertyId = (session as any).propertyId;

    let allUsers = [];
    let allTasks = [];
    let allInquiries = [];
    let allDocs = [];
    let allStatutory = [];

    // 2. ENFORCE DATA EXTRACTION CONTAINMENT WALLS
    if (isMasterSuperAdmin) {
      // Platform Owner Profile (ID: 1) retains absolute master infrastructure visibility
      [allUsers, allTasks, allInquiries, allDocs, allStatutory] = await Promise.all([
        db.select().from(users),
        db.select().from(tasks),
        db.select().from(inquiries),
        db.select().from(documents),
        db.select().from(statutoryMaster),
      ]);
    } else {
      // =========================================================================
      // DEFENSIVE CONTAINMENT FILTER MATRICES:
      // Restrict all data extraction fields strictly to their active property UUID context cell parameter.
      // =========================================================================
      if (!assignedPropertyId || assignedPropertyId === "global" || assignedPropertyId === "undefined") {
        return { success: false, error: "Security Exception: Cannot compile backups inside an unbound global scope layout." };
      }

      [allUsers, allTasks, allInquiries, allDocs, allStatutory] = await Promise.all([
        // Filter users assigned strictly to this branch node
        db.select().from(users).where(eq(users.propertyId, assignedPropertyId)),
        
        // Filter tasks, inquiries, and files explicitly bound to this property UUID
        db.select().from(tasks).where(eq(tasks.propertyId, assignedPropertyId)),
        db.select().from(inquiries).where(eq(inquiries.propertyId, assignedPropertyId)),
        db.select().from(documents).where(eq(documents.propertyId, assignedPropertyId)),
        db.select().from(statutoryMaster).where(eq(statutoryMaster.propertyId, assignedPropertyId)),
      ]);
    }

    return {
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        propertyScope: isMasterSuperAdmin ? "SYSTEM_WIDE_BACKUP" : assignedPropertyId,
        users: allUsers,
        tasks: allTasks,
        inquiries: allInquiries,
        documents: allDocs,
        statutory: allStatutory,
      }
    };
  } catch (error) {
    console.error("Export Error:", error);
    throw new Error("Failed to compile secure multi-tenant data dump backup files.");
  }
}