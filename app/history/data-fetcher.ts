// data-fetcher.ts
import { db } from "@/db"; 
import { inquiries, invoices, rooms } from "@/db/schema"; // Import rooms to pull time parameters
import { properties } from "@/db/micro-schema";
import { desc, eq, and, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";

export async function getCheckoutHistory() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    const session = token ? await decrypt(token).catch(() => null) : null;

    if (!session) return [];

    const safeUserId = String((session as any).id || (session as any).userId || "");
    const safeUserRole = String((session as any).role || "staff").toLowerCase().trim();
    const isMasterSuperAdmin = Number((session as any).userId || (session as any).id) === 1;

    // 1. Define the subquery clearly
    const checkInSubquery = sql<Date>`(
      SELECT MAX(created_at) 
      FROM ${inquiries} 
      WHERE ${inquiries.propertyId} = ${invoices.propertyId}
      AND ${inquiries.message} LIKE CONCAT('Guest: ', ${invoices.guestName}, ' |%')
      AND ${inquiries.status} = 'converted'
    )`.as("check_in_date");

    // 2. Build the initial query object with explicit type inference
    const query = db
      .select({
        id: invoices.id,
        propertyId: invoices.propertyId,
        roomNumber: invoices.roomNumber,
        guestName: invoices.guestName,
        totalAmount: invoices.totalAmount,
        checkInDate: checkInSubquery,
        checkoutDate: invoices.checkoutDate,
      })
      .from(invoices)
      .leftJoin(properties, eq(invoices.propertyId, properties.id));

    // 3. Apply logic using conditional typing for the query variable
    if (isMasterSuperAdmin) {
      return await query.orderBy(desc(invoices.checkoutDate));
    }

    const assignedPropertyId = (session as any).propertyId;

    if (assignedPropertyId && assignedPropertyId !== "global" && assignedPropertyId !== "undefined") {
      return await query
        .where(eq(invoices.propertyId, assignedPropertyId))
        .orderBy(desc(invoices.checkoutDate));
    } 
    
    if (safeUserRole === "admin" || safeUserRole === "owner") {
      return await query
        .where(eq(properties.ownerId, Number(safeUserId)))
        .orderBy(desc(invoices.checkoutDate));
    }

    return [];

  } catch (error) {
    console.error("Database Error inside getCheckoutHistory:", error);
    return [];
  }
}