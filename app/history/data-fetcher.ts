// data-fetcher.ts
import { db } from "@/db"; 
import { invoices } from "@/db/schema"; 
import { properties } from "@/db/micro-schema";
import { desc, eq, and } from "drizzle-orm";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";

export async function getCheckoutHistory() {
  try {
    // 1. AUTHENTICATION & ACCESS VERIFICATION LAYER
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    const session = token ? await decrypt(token).catch(() => null) : null;

    if (!session) return [];

    const safeUserId = String((session as any).id || (session as any).userId || "");
    const safeUserRole = String((session as any).role || "staff").toLowerCase().trim();
    const isMasterSuperAdmin = Number((session as any).userId || (session as any).id) === 1;

    // 2. DEFINE THE UNIFIED SHAPE Contract
    // Using a single declarative structure prevents drift across roles
    const selectFields = {
      id: invoices.id,
      propertyId: invoices.propertyId,
      roomNumber: invoices.roomNumber,
      guestName: invoices.guestName,
      totalAmount: invoices.totalAmount,
      checkoutDate: invoices.checkoutDate,
    };

    // 3. ENFORCE SECURE STRATIFIED DATA BOUNDARIES
    if (isMasterSuperAdmin) {
      // Super Admin profile (ID: 1) retains raw visibility over all rows system-wide
      return await db
        .select(selectFields)
        .from(invoices)
        .leftJoin(properties, eq(invoices.propertyId, properties.id))
        .orderBy(desc(invoices.checkoutDate));
    } else {
      // =========================================================================
      // 🌟 MULTI-ROLE SECURITY FIX:
      // Prioritize filtering by their assigned property context to let 
      // multiple admins, managers, and staff access their branch logs cleanly.
      // =========================================================================
      const assignedPropertyId = (session as any).propertyId;

      if (assignedPropertyId && assignedPropertyId !== "global" && assignedPropertyId !== "undefined" && assignedPropertyId !== "null") {
        return await db
          .select(selectFields)
          .from(invoices)
          .innerJoin(properties, eq(invoices.propertyId, properties.id))
          .where(eq(invoices.propertyId, assignedPropertyId)) // Isolate by linked branch context
          .orderBy(desc(invoices.checkoutDate));
      } else if (safeUserRole === "admin" || safeUserRole === "owner") {
        // FALLBACK ONLY: If they are the original tenant admin but haven't selected a property context yet, 
        // fallback to items matching their platform corporate registration profile ID.
        return await db
          .select(selectFields)
          .from(invoices)
          .innerJoin(properties, eq(invoices.propertyId, properties.id))
          .where(eq(properties.ownerId, Number(safeUserId)))
          .orderBy(desc(invoices.checkoutDate));
      }
      
      // Defensively return an empty matrix for any completely unassigned users
      return [];
    }
  } catch (error) {
    console.error("Database Error inside getCheckoutHistory:", error);
    return [];
  }
}