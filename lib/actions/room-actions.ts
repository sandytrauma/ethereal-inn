"use server";

import { db } from "@/db";
import { properties } from "@/db/micro-schema";
import { clients, financialRecords, inquiries, invoices, rooms, tasks } from "@/db/schema";
import { asc, eq, ne, sql, and, gte } from "drizzle-orm";
import { cookies } from "next/headers";
import { decrypt } from "../auth";
import { revalidatePath } from "next/cache";

// Types
export type RoomStatus = "available" | "occupied" | "cleaning" | "maintenance";

export type ActionResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
};

/**
 * Helper to validate UUID strings cleanly to prevent PostgreSQL syntax rejections.
 */
const isValidUuidString = (id: string) => {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return regex.test(id);
};

/**
 * 🌟 FIXED & SECURED: Enforces session-fenced property isolation paths.
 * Blocks standard staff from pulling rooms outside their workspace context boundary.
 */
export async function getRoomsList(propertyId?: string): Promise<any[]> {
  try {
    // 1. EXTRACT ACCOUNT PAYLOAD CONTEXT
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    const session = token ? await decrypt(token).catch(() => null) : null;

    if (!session) return [];

    const isMasterSuperAdmin = Number((session as any).userId || (session as any).id) === 1;
    const assignedPropertyId = (session as any).propertyId;

    // 2. DEFINE THE FLAT QUERY BASE CONTRACT WITH SYSTEM METADATA JOIN
    const baseQuery = db
      .select({
        id: rooms.id,
        number: rooms.number,
        floor: rooms.floor,
        status: rooms.status,
        propertyId: rooms.propertyId,
        guestName: rooms.guestName,
        checkInTime: rooms.checkInTime,
        propertyName: properties.name, 
      })
      .from(rooms)
      .leftJoin(properties, eq(rooms.propertyId, properties.id));

    // =========================================================================
    // 🌟 MULTI-ROLE CONTAINER FENCING MATRIX
    // Enforce parameter alignment rules based on active user privileges
    // =========================================================================
    let targetPropertyId = propertyId;

    if (!isMasterSuperAdmin) {
      // If a standard manager or receptionist triggers the script, force filter boundary checks
      targetPropertyId = assignedPropertyId && assignedPropertyId !== "global" ? assignedPropertyId : "REJECT_ACCESS";
    }

    if (!targetPropertyId) {
      // Super Admin fallback for unassigned global portfolio snapshots
      return await baseQuery.orderBy(asc(rooms.number));
    }

    if (!isValidUuidString(targetPropertyId)) {
      console.warn("Intercepted malformed UUID mapping context target query:", targetPropertyId);
      return [];
    }

    return await baseQuery
      .where(eq(rooms.propertyId, targetPropertyId))
      .orderBy(asc(rooms.number));
      
  } catch (error) {
    console.error("Database error in getRoomsList execution:", error);
    return [];
  }
}

/**
 * Updates status and guest metadata for a specific unit.
 * Scoped by propertyId to prevent cross-property validation tampering.
 */
export async function updateRoomStatus(
  propertyId: string,
  roomNumber: number | string, 
  status: RoomStatus, 
  guestName?: string | null,
  metadata?: { pax?: number; idNumber?: string; origin?: string }
): Promise<ActionResponse> {
  if (!isValidUuidString(propertyId)) return { success: false, error: "Invalid Property ID format" };

  try {
    const isOccupied = status === 'occupied';
    const num = Number(roomNumber);
    if (isNaN(num)) return { success: false, error: "Invalid Room Number structural format" };

    return await db.transaction(async (tx) => {
      // 1. Update Room records row parameters inside the sandbox fence
      await tx.update(rooms)
        .set({ 
          status: status,
          guestName: isOccupied ? (guestName || null) : null,
          checkInTime: isOccupied ? new Date() : null,
        })
        .where(
          and(
            eq(rooms.propertyId, propertyId),
            eq(rooms.number, num)
          )
        );

      // 2. Build explicit converted guest lead traces inside the inquiries table logs
      if (isOccupied && guestName) {
        await tx.insert(inquiries).values({
          propertyId: propertyId,
          message: `Guest: ${guestName} | ID: ${metadata?.idNumber || 'N/A'} | Pax: ${metadata?.pax || 1}`,
          status: "converted",
          source: metadata?.origin || "Walk-in", 
          createdAt: new Date(),
        });
      }

      revalidatePath("/occupancy");
      revalidatePath("/dashboard");
      revalidatePath(`/pms/${propertyId}`);
      
      return { success: true };
    });
  } catch (error: any) {
    console.error("Room Update Error:", error);
    return { success: false, error: error.message || "Failed to finalize unit state modifications." };
  }
}

/**
 * 🌟 FIXED: Processes checkout transactions and injects user session links 
 * to provide human-readable names inside operational audit trail views.
 */
export async function processCheckout(
  propertyId: string, 
  roomNumber: number, 
  guestName: string, 
  totalAmount: number
): Promise<ActionResponse> {
  if (!isValidUuidString(propertyId)) return { success: false, error: "Invalid Property ID structure parameters" };

  try {
    // 1. EXTRACT LOGGED IN CLOUD STAFF ACCOUNT IDENTIFIERS
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    const session = token ? await decrypt(token).catch(() => null) : null;
    const activeStaffId = session?.id || (session as any)?.userId;

    if (!activeStaffId) return { success: false, error: "Authentication Exception: Please refresh browser credentials to transact." };

    return await db.transaction(async (tx) => {
      
      // 2. Shift the targeted room records cleanly over onto room housekeeping cleaning frames
      await tx.update(rooms)
        .set({ 
          status: 'cleaning', 
          guestName: null, 
          checkInTime: null 
        })
        .where(
          and(
            eq(rooms.propertyId, propertyId),
            eq(rooms.number, roomNumber)
          )
        );

      // 3. Document ledger tracking invoices matching room parameters definitions
      await tx.insert(invoices).values({
        propertyId: propertyId,
        roomNumber,
        guestName,
        totalAmount: Math.round(totalAmount), 
        checkoutDate: new Date(),
      });

      const todayDate = new Date().toISOString().split('T')[0];

      // 4. Look up running balance logs for this explicit asset location context
      const existingRecord = await tx.select()
        .from(financialRecords)
        .where(
          and(
            eq(financialRecords.date, todayDate),
            eq(financialRecords.propertyId, propertyId)
          )
        )
        .limit(1);

      if (existingRecord.length > 0) {
        await tx.update(financialRecords)
          .set({
            roomRevenue: sql`CAST(${financialRecords.roomRevenue} AS NUMERIC) + ${totalAmount}`,
            totalCollection: sql`CAST(${financialRecords.totalCollection} AS NUMERIC) + ${totalAmount}`,
            userId: Number(activeStaffId), // Bind updating actor to the row audit context
            updatedAt: new Date()
          })
          .where(eq(financialRecords.id, existingRecord[0].id));
      } else {
        // 🌟 FIXED: Created unique tracking records using uniform column references
        await tx.insert(financialRecords).values({
          propertyId: propertyId,
          userId: Number(activeStaffId),
          date: todayDate,
          roomRevenue: totalAmount.toString(),
          totalCollection: totalAmount.toString(),
          cashRevenue: "0",
          upiRevenue: "0",
          otaPayouts: "0",
          serviceRevenue: "0",
          pettyExpenses: "0",
          netCash: "0",
          status: "pending"
        });
      }

      revalidatePath("/occupancy");
      revalidatePath("/dashboard");
      revalidatePath(`/pms/${propertyId}`);
      
      return { success: true };
    });
  } catch (error: any) {
    console.error("Checkout Error:", error);
    return { success: false, error: error.message || "Failed to settle checkout revenue channels safely." };
  }
}

/**
 * seedRooms
 * CLEARS existing room data for ONLY the specified property and rebuilds the grid cleanly.
 */
export async function seedRooms(
  propertyId: string, 
  floors: number, 
  roomsPerFloor: number
): Promise<ActionResponse> {
  try {
    if (!propertyId || !isValidUuidString(propertyId)) {
      throw new Error("A valid Property ID is required for seeding operations.");
    }

    // Scoped delete: only wipe rooms belonging strictly to this localized property node
    await db.delete(rooms).where(eq(rooms.propertyId, propertyId));

    const roomData = [];
    for (let f = 1; f <= floors; f++) {
      for (let r = 1; r <= roomsPerFloor; r++) {
        roomData.push({
          number: f * 100 + r, 
          floor: f,
          status: "available" as const,
          propertyId: propertyId,
        });
      }
    }

    if (roomData.length > 0) {
      await db.insert(rooms).values(roomData);
    }
    
    revalidatePath("/occupancy");
    revalidatePath("/dashboard");
    revalidatePath(`/pms/${propertyId}`);

    return { success: true, count: roomData.length };
  } catch (error: any) {
    console.error("Seed Error:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Fetches rooms, tasks, and inquiries for a specific property's reception view.
 */
export async function getLiveReceptionData(propertyId: string): Promise<ActionResponse> {
  if (!propertyId || !isValidUuidString(propertyId)) {
    return { success: false, error: "Invalid or missing property boundary selection parameters" };
  }

  try {
    const [allRooms, activeTasks, recentInquiries] = await Promise.all([
      db.select().from(rooms).where(eq(rooms.propertyId, propertyId)).orderBy(rooms.number),
      db.select().from(tasks).where(and(eq(tasks.propertyId, propertyId), ne(tasks.status, "completed"))),
      db.select().from(inquiries).where(and(eq(inquiries.propertyId, propertyId), eq(inquiries.status, "new"))).limit(5)
    ]);

    return {
      success: true,
      data: {
        rooms: allRooms,
        tasks: activeTasks,
        inquiries: recentInquiries
      }
    };
  } catch (error: any) {
    console.error("Database Error:", error);
    return { success: false, error: error.message || "Database synchronization handshake connection failed" };
  }
}

/**
 * Trims excess rooms allocation layout blocks cleanly.
 */
export async function trimExcessRooms(
  propertyId: string, 
  floor: number, 
  keepCount: number
): Promise<ActionResponse> {
  if (!isValidUuidString(propertyId)) return { success: false, error: "Invalid Property ID format mapping parameter text" };
  
  try {
    const threshold = (floor * 100) + keepCount + 1;

    await db.delete(rooms)
      .where(
        and(
          eq(rooms.propertyId, propertyId),
          eq(rooms.floor, floor),
          gte(rooms.number, threshold)
        )
      );

    revalidatePath("/occupancy");
    revalidatePath(`/pms/${propertyId}`);
    
    return { success: true, message: `Trimmed rooms on floor ${floor} starting from ${threshold}` };
  } catch (error: any) {
    console.error("Cleanup failed:", error);
    return { success: false, error: error.message || "Failed to trim rooms" };
  }
}