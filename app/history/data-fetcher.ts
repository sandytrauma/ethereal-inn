// data-fetcher.ts
import { db } from "@/db"; 
import { invoices, rooms } from "@/db/schema"; // Import rooms to pull time parameters
import { properties } from "@/db/micro-schema";
import { desc, eq, and } from "drizzle-orm";
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

    // Prefixed mapping targets to fully avoid SQL ambiguous field naming clashes on compilation
    const selectFields = {
      id: invoices.id,
      propertyId: invoices.propertyId,
      roomNumber: invoices.roomNumber,
      guestName: invoices.guestName,
      totalAmount: invoices.totalAmount,
      checkinDate: rooms.checkInTime, // 🌟 Pull checkin date via rooms relation link directly
      checkoutDate: invoices.checkoutDate,
    };

    if (isMasterSuperAdmin) {
      return await db
        .select(selectFields)
        .from(invoices)
        .leftJoin(rooms, and(eq(invoices.roomNumber, rooms.number), eq(invoices.propertyId, rooms.propertyId)))
        .leftJoin(properties, eq(invoices.propertyId, properties.id))
        .orderBy(desc(invoices.checkoutDate));
    } else {
      const assignedPropertyId = (session as any).propertyId;

      if (assignedPropertyId && assignedPropertyId !== "global" && assignedPropertyId !== "undefined") {
        return await db
          .select(selectFields)
          .from(invoices)
          .leftJoin(rooms, and(eq(invoices.roomNumber, rooms.number), eq(invoices.propertyId, rooms.propertyId)))
          .innerJoin(properties, eq(invoices.propertyId, properties.id))
          .where(eq(invoices.propertyId, assignedPropertyId))
          .orderBy(desc(invoices.checkoutDate));
      } else if (safeUserRole === "admin" || safeUserRole === "owner") {
        return await db
          .select(selectFields)
          .from(invoices)
          .leftJoin(rooms, and(eq(invoices.roomNumber, rooms.number), eq(invoices.propertyId, rooms.propertyId)))
          .innerJoin(properties, eq(invoices.propertyId, properties.id))
          .where(eq(properties.ownerId, Number(safeUserId)))
          .orderBy(desc(invoices.checkoutDate));
      }
      return [];
    }
  } catch (error) {
    console.error("Database Error inside getCheckoutHistory:", error);
    return [];
  }
}