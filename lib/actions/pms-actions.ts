"use server";

import { db } from "@/db"; 
import { properties, propertyRevenueBridge } from "@/db/micro-schema";
import { rooms, tasks, financialRecords, inquiries, statutoryMaster } from "@/db/schema";
import { eq, desc, sql, and, isNotNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Helper: Validates if a string is a standard UUID.
 */
const isValidUUID = (id: string) => 
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// --- CORE FETCHING FUNCTIONS ---

/**
 * 🌟 FIXED & SECURED: Enforces session-fenced property isolation paths.
 * Prevents non-master accounts from tracking properties outside their workspace scope.
 */
export async function getAllProperties() {
  try {
    // 1. EXTRACT ACCOUNT COOKIE PAYLOAD CONTEXT
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    const session = token ? await decrypt(token).catch(() => null) : null;

    if (!session) return [];

    const isMasterSuperAdmin = Number((session as any).userId || (session as any).id) === 1;
    const assignedPropertyId = (session as any).propertyId;

    let allProps = [];

    // 2. APPLY RADIAL MULTI-TENANT CONTAINMENT BOUNDARIES
    if (isMasterSuperAdmin) {
      allProps = await db.select().from(properties);
    } else {
      if (!assignedPropertyId || assignedPropertyId === "global" || assignedPropertyId === "undefined") {
        return []; // Defensively abort if an unlinked manager probes the endpoint
      }
      allProps = await db.select().from(properties).where(eq(properties.id, assignedPropertyId));
    }

    const fleet = await Promise.all(allProps.map(async (prop) => {
      // Fetch Rooms & Inquiries scoped strictly to this specific asset node
      const propRooms = await db.select().from(rooms).where(eq(rooms.propertyId, prop.id));
      const propInquiries = await db.select().from(inquiries).where(eq(inquiries.propertyId, prop.id));

      // Aggregate Revenue from the bridge table
      const [revenueData] = await db.select({
        total: sql<string>`sum(${propertyRevenueBridge.amount})`
      })
      .from(propertyRevenueBridge)
      .where(eq(propertyRevenueBridge.propertyId, prop.id));

      return {
        ...prop,
        rooms: propRooms,
        inquiries: propInquiries,
        finance: {
          totalCollection: revenueData?.total || "0",
          upiRevenue: "0", 
          cashRevenue: "0",
          pettyExpenses: "0" 
        },
        stats: { 
          arrivals: 0, 
          occupancy: `${propRooms.length}/${propRooms.length}`, 
          occupancyPercent: "100%" 
        }
      };
    }));

    return fleet;
  } catch (e: any) {
    console.error("Global Fleet Fetch Error:", e.message);
    return [];
  }
}

/**
 * 🌟 FIXED & SECURED: Restricts compliance data arrays by property context boundary lines.
 */
export async function getMultiPropertyData(propertyId: string) {
  if (!isValidUUID(propertyId)) return { error: "Invalid ID", property: null };
  
  try {
    // 1. EXTRACTION & SECURITY AUDIT LOOP
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    const session = token ? await decrypt(token).catch(() => null) : null;

    if (!session) throw new Error("Verification Failure: Session tracking signature missing.");

    const isMasterSuperAdmin = Number((session as any).userId || (session as any).id) === 1;
    const assignedPropertyId = (session as any).propertyId;

    // Reject immediate cross-tenant parameter tinkering across active dashboard endpoints
    if (!isMasterSuperAdmin && String(assignedPropertyId) !== String(propertyId)) {
      throw new Error("Access Denied: Cross-tenant tracking boundary breach intercepted.");
    }

    // 2. PARALLEL RESOLUTION WITH PROPERTY ENFORCEMENT FENCES
    const [prop, rm, tsk, fin, inq, stat] = await Promise.all([
      db.select().from(properties).where(eq(properties.id, propertyId)).limit(1),
      db.select().from(rooms).where(eq(rooms.propertyId, propertyId)).orderBy(rooms.number),
      db.select().from(tasks).where(eq(tasks.propertyId, propertyId)).orderBy(desc(tasks.createdAt)).limit(10),
      db.select().from(financialRecords).where(eq(financialRecords.propertyId, propertyId)).orderBy(desc(financialRecords.date)).limit(1),
      db.select().from(inquiries).where(eq(inquiries.propertyId, propertyId)).orderBy(desc(inquiries.createdAt)).limit(10),
      
      // 🌟 FIXED: Scoped statutory master list by active workspace context to seal data leaks
      isMasterSuperAdmin 
        ? db.select().from(statutoryMaster).limit(20)
        : db.select().from(statutoryMaster).where(eq(statutoryMaster.propertyId, propertyId)).limit(20)
    ]);

    const roomsList = rm || [];
    const occupiedCount = roomsList.filter(r => r.status === 'occupied').length;

 

    return {
      property: prop[0] || null,
      rooms: roomsList,
      tasks: tsk || [],
      
      // 🌟 FIXED: Standardized field casing to resolve object structure mapping properties cleanly
      finance: fin[0] || { totalCollection: "0", upiRevenue: "0", cashRevenue: "0", pettyExpenses: "0", expenses: "0" },
      inquiries: inq || [],
      statutory: stat || [], 
      stats: {
        arrivals: occupiedCount, 
        occupancy: `${occupiedCount}/${roomsList.length}`,
        occupancyPercent: roomsList.length > 0 
          ? `${Math.round((occupiedCount / roomsList.length) * 100)}%` 
          : "0%"
      }
    };
  } catch (e: any) { 
    console.error(`Sync failed for property ${propertyId}:`, e.message);
    throw new Error(`Data sync failed: ${e.message}`); 
  }
}

// --- OPERATIONAL ACTIONS ---

/**
 * Initializes rooms for a property. 
 * Prevents duplicates via UPSERT logic.
 */
export async function seedRooms(propertyId: string, floors: number, roomsPerFloor: number) {
  if (!isValidUUID(propertyId)) throw new Error("Invalid Property ID");

  try {
    const roomEntries: (typeof rooms.$inferInsert)[] = [];

    for (let f = 1; f <= floors; f++) {
      for (let r = 1; r <= roomsPerFloor; r++) {
        roomEntries.push({
          propertyId: propertyId,
          number: f * 100 + r,
          floor: f,
          status: "available",
        });
      }
    }

    if (roomEntries.length > 0) {
      await db.insert(rooms)
        .values(roomEntries)
        .onConflictDoUpdate({
          target: [rooms.propertyId, rooms.number],
          set: { floor: sql`excluded.floor` }
        });
    }

    revalidatePath(`/pms/${propertyId}`);
    revalidatePath("/occupancy");
    return { success: true };
  } catch (error) {
    console.error("Seeding Error:", error);
    throw new Error("Failed to initialize property rooms");
  }
}

/**
 * Fetches historical financial data for Reports.
 */
export async function getReportData(propertyId: string) {
  if (!isValidUUID(propertyId)) return [];
  try {
    return await db.select()
      .from(financialRecords)
      .where(eq(financialRecords.propertyId, propertyId))
      .orderBy(desc(financialRecords.date))
      .limit(30);
  } catch (e) {
    console.error("Report Fetch Error:", e);
    return [];
  }
}

/**
 * Fetches guest list from the rooms table.
 */
export async function getGuestList(propertyId: string) {
  if (!isValidUUID(propertyId)) return [];
  try {
    return await db
      .select({
        name: rooms.guestName,
        room: rooms.number,
        status: rooms.status,
      })
      .from(rooms)
      .where(
        and(
          eq(rooms.propertyId, propertyId),
          isNotNull(rooms.guestName)
        )
      )
      .orderBy(rooms.number);
  } catch (error) {
    console.error("Guest List Fetch Error:", error);
    return [];
  }
}