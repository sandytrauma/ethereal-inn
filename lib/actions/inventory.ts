"use server";

import { db } from "@/db";
import { inventoryItems, assetMaintenance, inventoryCategories, inventoryTransactions } from "@/db/schema";
import { eq, and, sql, asc, inArray } from "drizzle-orm";
import { cookies } from "next/headers";
import { decrypt } from "../auth";
import { revalidatePath } from "next/cache";

/**
 * Context Helper: Decrypts session payload parameters and enforces multi-tenant fences.
 * Safely handles single values or structural array extensions.
 */
async function getValidatedSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  const session = token ? await decrypt(token).catch(() => null) : null;
  if (!session) throw new Error("Unauthorized: Session signature expired.");
  
  // Extract both single propertyId and potential accessible array mappings from session payload
  const sessionPropertyId = (session as any).propertyId;
  const accessibleProperties: string[] = (session as any).accessibleProperties || 
    (sessionPropertyId ? [String(sessionPropertyId)] : []);

  return {
    userId: Number((session as any).id || (session as any).userId),
    sessionPropertyId,
    accessibleProperties, // 🌟 ADDED: Array tracking block for multi-property tenants
    isMasterAdmin: Number((session as any).id || (session as any).userId) === 1
  };
}

/**
 * 🌟 OPTIMIZED & SECURED: Fetches tenant-isolated inventory listings.
 * Supports fluid array input parsing if a tenant owns multiple properties.
 */
export async function getInventoryList(propertyIdOrIds: string | string[]) {
  try {
    const session = await getValidatedSession();
    
    // Normalize target parameters down into a clean string array path
    const targets = Array.isArray(propertyIdOrIds) ? propertyIdOrIds : [propertyIdOrIds];

    // Cross-Tenant Interception Gate: Enforce security validation across all requested contexts
    if (!session.isMasterAdmin) {
      const hasUnauthorizedTarget = targets.some(id => !session.accessibleProperties.includes(id));
      if (hasUnauthorizedTarget) {
        throw new Error("Access Denied: Restricted Multi-Property Boundary breached.");
      }
    }

    // Dynamic database condition switcher based on array sizing constraints
    const propertyCondition = targets.length === 1 
      ? eq(inventoryItems.propertyId, targets[0])
      : inArray(inventoryItems.propertyId, targets);

    const items = await db.query.inventoryItems.findMany({
      where: propertyCondition,
      with: {
        category: true, 
      },
      orderBy: [asc(inventoryItems.name)]
    });

    return { success: true, data: items };
  } catch (error: any) {
    console.error("Inventory Fetch Error:", error.message);
    return { success: false, error: error.message || "Failed to load stock data." };
  }
}

/**
 * 🌟 FIXED & SECURED: Adds an asset or consumable item bound directly to the property context.
 * Explicitly validates that the operator owns the target property before running insertions.
 */
export async function addInventoryItem(propertyId: string, payload: any) {
  try {
    const session = await getValidatedSession();

    if (!session.isMasterAdmin && !session.accessibleProperties.includes(String(propertyId))) {
      throw new Error("Access Denied: Target Multi-tenant verification failure.");
    }

    // Defensive parsing for incoming calendar dates
    const parsedServiceDate = payload.nextServiceDate && payload.nextServiceDate.trim() !== ""
      ? new Date(payload.nextServiceDate)
      : null;

    await db.insert(inventoryItems).values({
      propertyId: propertyId,
      categoryId: Number(payload.categoryId),
      name: String(payload.name),
      sku: payload.sku ? String(payload.sku) : null,
      description: payload.description ? String(payload.description) : null,
      itemType: String(payload.itemType), 
      currentStock: Number(payload.currentStock || 0),
      minRequiredStock: Number(payload.minRequiredStock || 0),
      unitOfMeasurement: String(payload.unitOfMeasurement || "pcs"),
      serialNumber: payload.serialNumber ? String(payload.serialNumber) : null,
      locationInProperty: payload.locationInProperty ? String(payload.locationInProperty) : null,
      nextServiceDate: parsedServiceDate ? parsedServiceDate.toISOString().split('T')[0] : null,
      updatedBy: session.userId,
    });

    revalidatePath(`/pms/${propertyId}`);
    revalidatePath("/inventory");
    return { success: true };
  } catch (error: any) {
    console.error("Add Inventory Failure:", error);
    return { success: false, error: error.message || "Failed to log new stock asset row." };
  }
}

/**
 * Atomically adjusts consumable stock counts and dynamically shifts database statuses.
 */
export async function adjustStockLevel(propertyId: string, itemId: string, delta: number) {
  try {
    const session = await getValidatedSession();

    if (!session.isMasterAdmin && !session.accessibleProperties.includes(String(propertyId))) {
      throw new Error("Access Denied: Structural context manipulation intercepted.");
    }

    await db.transaction(async (tx) => {
      // 1. Pull current count to safely evaluate boundaries
      const currentItem = await tx.query.inventoryItems.findFirst({
        where: and(
          eq(inventoryItems.id, itemId),
          eq(inventoryItems.propertyId, propertyId)
        )
      });

      if (!currentItem) throw new Error("Target item row not found inside this property context.");

      const computedStock = Math.max(0, currentItem.currentStock + delta);
      
      // 2. Determine string flag dynamically based on computed allocation properties
      let dynamicStatus = "active";
      if (computedStock === 0) {
        dynamicStatus = "depleted"; // Mark out of stock explicitly in database records
      } else if (computedStock <= currentItem.minRequiredStock) {
        dynamicStatus = "low_stock";
      }

      // 3. Write back changes in a unified atomic pass
      await tx
        .update(inventoryItems)
        .set({
          currentStock: computedStock,
          status: dynamicStatus,
          updatedAt: new Date(),
          updatedBy: session.userId
        })
        .where(eq(inventoryItems.id, itemId));
    });

    revalidatePath(`/pms/${propertyId}`);
    revalidatePath("/inventory");
    return { success: true };
  } catch (error: any) {
    console.error("Adjust Stock Failure:", error.message);
    return { success: false, error: error.message || "Failed to update item balance thresholds." };
  }
}

/**
 * 🌟 OPTIMIZED ALERTS ENGINE: Fetches items running below reorder targets
 * supporting single or comprehensive multiple property array evaluations.
 */
export async function getInventoryAlerts(propertyIdOrIds: string | string[]) {
  try {
    const session = await getValidatedSession();
    const targets = Array.isArray(propertyIdOrIds) ? propertyIdOrIds : [propertyIdOrIds];

    if (!session.isMasterAdmin) {
      const hasUnauthorizedTarget = targets.some(id => !session.accessibleProperties.includes(id));
      if (hasUnauthorizedTarget) {
        throw new Error("Access Denied: Inadequate cross-property privileges.");
      }
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const propertyCondition = targets.length === 1 
      ? eq(inventoryItems.propertyId, targets[0])
      : inArray(inventoryItems.propertyId, targets);

    // 1. Fetch consumables running dangerously low
    const stockAlerts = await db
      .select()
      .from(inventoryItems)
      .where(
        and(
          propertyCondition,
          eq(inventoryItems.itemType, "consumable"),
          sql`${inventoryItems.currentStock} <= ${inventoryItems.minRequiredStock}`
        )
      );

    // 2. Fetch fixed assets needing immediate inspections
    const serviceAlerts = await db
      .select()
      .from(inventoryItems)
      .where(
        and(
          propertyCondition,
          eq(inventoryItems.itemType, "fixed_asset"),
          sql`${inventoryItems.nextServiceDate} <= ${todayStr}`
        )
      );

    return { 
      success: true, 
      data: {
        lowStock: stockAlerts || [],
        overdueService: serviceAlerts || []
      }
    };
  } catch (error: any) {
    console.error("Alerts Processing Failure:", error.message);
    return { success: false, error: error.message || "Failed to process target inventory safety metrics." };
  }
}

/**
 * Logs historical service actions and rolls forward compliance tracking deadlines.
 */
export async function logAssetMaintenance(propertyId: string, payload: any) {
  try {
    const session = await getValidatedSession();

    if (!session.isMasterAdmin && !session.accessibleProperties.includes(String(propertyId))) {
      throw new Error("Access Denied: Multi-tenant maintenance registration failure.");
    }

    const executionDate = payload.serviceDate ? new Date(payload.serviceDate) : new Date();

    await db.transaction(async (tx) => {
      // 1. Document the service history log row
      await tx.insert(assetMaintenance).values({
        propertyId: propertyId,
        itemId: String(payload.itemId),
        serviceType: String(payload.serviceType), 
        description: String(payload.description),
        cost: Number(payload.cost || 0),
        serviceDate: executionDate.toISOString().split('T')[0],
        performedBy: payload.performedBy ? String(payload.performedBy) : "Internal Maintenance",
      });

      // 2. Update the parent asset's status indicators and next audit deadline
      if (payload.nextServiceDate) {
        await tx.update(inventoryItems)
          .set({
            status: "active",
            lastAuditDate: executionDate.toISOString().split('T')[0],
            nextServiceDate: new Date(payload.nextServiceDate).toISOString().split('T')[0],
            updatedBy: session.userId,
            updatedAt: new Date()
          })
          .where(
            and(
              eq(inventoryItems.id, String(payload.itemId)),
              eq(inventoryItems.propertyId, propertyId) // Protect against logical cross-writes
            )
          );
      }
    });

    revalidatePath(`/pms/${propertyId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Log Maintenance Failure:", error);
    return { success: false, error: error.message || "Failed to archive asset maintenance records." };
  }
}

/**
 * Global Category Lookup Helper for populating UI forms
 */
export async function getGlobalInventoryCategories() {
  try {
    const categories = await db.select().from(inventoryCategories).orderBy(asc(inventoryCategories.name));
    return { success: true, data: categories };
  } catch (error: any) {
    return { success: false, error: "Failed to compile system categorizations dropdown index." };
  }
}

/**
 * SECURE ACTION: Issues a specific quantity of an item for property operations use.
 * Deducts stock atomically and appends a structured transaction ledger trail.
 */
export async function issueInventoryItem(propertyId: string, payload: {
  itemId: string;
  quantity: number;
  allocatedTo: string;
  notes?: string;
}) {
  try {
    const session = await getValidatedSession(); 

    if (!session.isMasterAdmin && !session.accessibleProperties.includes(String(propertyId))) {
      throw new Error("Access Denied: Inadequate multi-property clearance.");
    }

    const qtyToDeduct = Number(payload.quantity);
    if (qtyToDeduct <= 0) throw new Error("Quantity must be greater than zero.");

    // 🌟 THE FIX: Remove the 'return' keyword from here
    await db.transaction(async (tx) => {
      const targetItem = await tx.query.inventoryItems.findFirst({
        where: and(
          eq(inventoryItems.id, payload.itemId),
          eq(inventoryItems.propertyId, propertyId)
        )
      });

      if (!targetItem) throw new Error("Asset entry node not found.");
      if (targetItem.currentStock < qtyToDeduct) {
        throw new Error(`Deficit: Only ${targetItem.currentStock} units available.`);
      }

      const postTransactionStock = targetItem.currentStock - qtyToDeduct;

      let updatedStatus = "active";
      if (postTransactionStock === 0) updatedStatus = "depleted";
      else if (postTransactionStock <= targetItem.minRequiredStock) updatedStatus = "low_stock";

      await tx
        .update(inventoryItems)
        .set({
          currentStock: postTransactionStock,
          status: updatedStatus,
          updatedAt: new Date(),
          updatedBy: session.userId
        })
        .where(eq(inventoryItems.id, payload.itemId));

      const truncatedTypeSummary = `issue:${String(payload.allocatedTo || "Use")}`.substring(0, 50);

     

await tx.insert(inventoryTransactions).values({
  propertyId: String(propertyId),
  itemId: String(payload.itemId),
  transactionType: "issue", // Bounces back down to a clean status string constant
  quantity: Number(payload.quantity),
  
  // 🌟 SAFELY BIND BOTH INDEPENDENT TRACKING INPUTS NOW
  allocatedTo: payload.allocatedTo ? String(payload.allocatedTo) : "General Operations",
  notes: payload.notes ? String(payload.notes) : null,
  
  issuedBy: Number(session.userId || 1),
});
    });

    revalidatePath(`/pms/${propertyId}`);
    revalidatePath("/inventory");
    
    // 🌟 THE FIX: Return a clean, predictable signature outside the transaction block
    return { success: true, error: null };

  } catch (error: any) {
    console.error("Issue Inventory Fault:", error.message);
    // 🌟 THE FIX: Match the signature here precisely
    return { success: false, error: error.message || "Failed to finalize stock issuance." };
  }
}

