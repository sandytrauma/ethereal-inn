// lib/actions/salon-inventory.ts
"use server";

import { db } from "@/db";
import { salonProductsStock, salonProductConsumptionLogs } from "@/db/glam-schema";
import { getSalonSession } from "@/lib/salon-token";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Explicit type constraints for internal data ingestion pipelines
interface InventoryFilters {
  search?: string;
  alertLevel?: string;
}

interface NewProductInput {
  productName: string;
  sku?: string;
  unitType: string; // 🌟 NEW: Core measurement vector type parameter
  currentVolumeMlGrams: number;
  alertThreshold: number;
  purchasePrice: number; 
  retailPrice: number;   
}

interface UpdateProductInput {
  productName?: string;
  sku?: string;
  unitType?: string; // 🌟 NEW: Support updating measurement metrics
  alertThreshold?: number;
  purchasePrice?: number; 
  retailPrice?: number;   
}

// Helper to calculate exact stock status using dynamic field thresholds
const determineAlertLevel = (currentVolume: number, threshold: number): "critical_empty" | "low_stock" | "good" => {
  if (currentVolume <= threshold) return "critical_empty";
  if (currentVolume <= threshold * 1.5) return "low_stock";
  return "good";
};

// =========================================================================
// 🔄 READ: FETCH INVENTORY DATASET WITH MULTI-TENANT FILTER MATRICES
// =========================================================================
export async function getInventoryList(filters?: InventoryFilters) {
  try {
    const session = await getSalonSession();
    if (!session) return { success: false, error: "Session expired. Please log in again." };

    const tenantIdStr = String(session.tenantId);
    const outletIdStr = session.outletId ? String(session.outletId) : null;

    if (!outletIdStr) {
      return { success: false, error: "Invalid outlet assignment framework context." };
    }

    // Explicitly select price metrics along with newly integrated unit vector types
    const products = await db
      .select({
        id: salonProductsStock.id,
        productName: salonProductsStock.productName,
        sku: salonProductsStock.sku,
        unitType: salonProductsStock.unitType, // 🌟 NEW: Track dynamic unit identifiers
        currentVolumeMlGrams: salonProductsStock.currentVolumeMlGrams,
        alertThreshold: salonProductsStock.alertThreshold,
        alertLevel: salonProductsStock.alertLevel,
        purchasePrice: salonProductsStock.purchasePrice, 
        retailPrice: salonProductsStock.retailPrice,     
      })
      .from(salonProductsStock)
      .where(
        and(
          eq(salonProductsStock.tenantId, tenantIdStr),
          eq(salonProductsStock.outletId, outletIdStr)
        )
      )
      .orderBy(salonProductsStock.productName);

    let filtered = products;

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase().trim();
      filtered = filtered.filter(
        (p) =>
          p.productName.toLowerCase().includes(searchLower) ||
          p.sku?.toLowerCase().includes(searchLower)
      );
    }

    if (filters?.alertLevel && filters.alertLevel !== "all") {
      filtered = filtered.filter((p) => p.alertLevel === filters.alertLevel);
    }

    return { success: true, data: filtered, count: filtered.length };
  } catch (error: any) {
    console.error("❌ Get Inventory Critical Failure:", error.message);
    return { success: false, error: "Internal processing error while parsing product lists." };
  }
}

// =========================================================================
// ➕ CREATE: ADD NEW STOCK ITEM WITH FINANCIAL & MULTI-VECTOR DATA
// =========================================================================
export async function addInventoryItem(payload: NewProductInput) {
  try {
    const session = await getSalonSession();
    if (!session) return { success: false, error: "Session authentication context expired." };

    const tenantIdStr = String(session.tenantId);
    const outletIdStr = session.outletId ? String(session.outletId) : null;

    if (!outletIdStr) {
      return { success: false, error: "Invalid outlet mapping target." };
    }

    const alertLevel = determineAlertLevel(payload.currentVolumeMlGrams, payload.alertThreshold);

    const [newProduct] = await db
      .insert(salonProductsStock)
      .values({
        tenantId: tenantIdStr,
        outletId: outletIdStr,
        productName: payload.productName.trim(),
        sku: payload.sku?.trim() || null,
        unitType: payload.unitType || "ml", // 🌟 NEW: Save clean multi-vector unit indicators
        currentVolumeMlGrams: payload.currentVolumeMlGrams,
        alertThreshold: payload.alertThreshold,
        alertLevel,
        purchasePrice: String(payload.purchasePrice || 0), 
        retailPrice: String(payload.retailPrice || 0),     
      })
      .returning({ id: salonProductsStock.id, productName: salonProductsStock.productName });

    revalidatePath("/glam/inventory");
    return { success: true, message: "Product logged inside inventory matrix successfully.", data: newProduct };
  } catch (error: any) {
    console.error("❌ Add Inventory Matrix Failure:", error.message);
    if (error.message?.includes("unique constraint") || error.message?.includes("duplicate key")) {
      return { success: false, error: "A salon product utilizing this identical SKU track already exists." };
    }
    return { success: false, error: "Failed to persist new inventory record entries." };
  }
}

// =========================================================================
// 📝 UPDATE: MODIFY METADATA CONFIGURATIONS, UNITS AND PRICING
// =========================================================================
export async function updateInventoryItem(productId: number, payload: UpdateProductInput) {
  try {
    const session = await getSalonSession();
    if (!session) return { success: false, error: "Session validation token expired." };

    const tenantIdStr = String(session.tenantId);
    const outletIdStr = session.outletId ? String(session.outletId) : null;

    if (!outletIdStr) {
      return { success: false, error: "Invalid outlet authorization scope." };
    }

    const updateData: any = {};
    if (payload.productName) updateData.productName = payload.productName.trim();
    if (payload.sku !== undefined) updateData.sku = payload.sku?.trim() || null;
    if (payload.unitType) updateData.unitType = payload.unitType; // 🌟 NEW: Track dynamic unit changes
    if (payload.alertThreshold !== undefined) updateData.alertThreshold = payload.alertThreshold;
    if (payload.purchasePrice !== undefined) updateData.purchasePrice = String(payload.purchasePrice);
    if (payload.retailPrice !== undefined) updateData.retailPrice = String(payload.retailPrice);

    if (Object.keys(updateData).length === 0) {
      return { success: false, error: "No field mutations provided for submission query." };
    }

    // If threshold changes or volumes exist, dynamically recalculate matrix tags
    if (payload.alertThreshold !== undefined) {
      const [existing] = await db
        .select()
        .from(salonProductsStock)
        .where(and(eq(salonProductsStock.id, productId), eq(salonProductsStock.tenantId, tenantIdStr)));
      
      if (existing) {
        updateData.alertLevel = determineAlertLevel(existing.currentVolumeMlGrams, payload.alertThreshold);
      }
    }

    await db
      .update(salonProductsStock)
      .set(updateData)
      .where(
        and(
          eq(salonProductsStock.id, productId),
          eq(salonProductsStock.tenantId, tenantIdStr),
          eq(salonProductsStock.outletId, outletIdStr)
        )
      );

    revalidatePath("/glam/inventory");
    return { success: true, message: "Inventory catalog details successfully updated." };
  } catch (error: any) {
    console.error("❌ Update Inventory Matrix Exception Fault:", error.message);
    return { success: false, error: "Failed to adjust target inventory parameters." };
  }
}

// =========================================================================
// 🗑️ DELETE: WIPE ITEM RECORDS OUT OF THE ACTIVE INSTANCE
// =========================================================================
export async function deleteInventoryItem(productId: number) {
  try {
    const session = await getSalonSession();
    if (!session) return { success: false, error: "Session context invalidated." };

    const tenantIdStr = String(session.tenantId);
    const outletIdStr = session.outletId ? String(session.outletId) : null;

    if (!outletIdStr) {
      return { success: false, error: "Access denied. Invalid target node." };
    }

    await db
      .delete(salonProductsStock)
      .where(
        and(
          eq(salonProductsStock.id, productId),
          eq(salonProductsStock.tenantId, tenantIdStr),
          eq(salonProductsStock.outletId, outletIdStr)
        )
      );

    revalidatePath("/glam/inventory");
    return { success: true, message: "Product record removed from inventory files cleanly." };
  } catch (error: any) {
    console.error("❌ Delete Inventory Processing Fault:", error.message);
    return { success: false, error: "Failed to clear product reference out of database records." };
  }
}

// =========================================================================
// ⚡ ADJUST: DIRECT RUNTIME STOCK LEVEL INCREMENT/DECREMENT MODES
// =========================================================================
export async function adjustStockLevel(productId: number, volumeDelta: number) {
  try {
    const session = await getSalonSession();
    if (!session) return { success: false, error: "Session expired." };

    const tenantIdStr = String(session.tenantId);
    const outletIdStr = session.outletId ? String(session.outletId) : null;

    if (!outletIdStr) return { success: false, error: "Invalid outlet mapping target identifier." };

    const productRows = await db
      .select()
      .from(salonProductsStock)
      .where(
        and(
          eq(salonProductsStock.id, productId),
          eq(salonProductsStock.tenantId, tenantIdStr),
          eq(salonProductsStock.outletId, outletIdStr)
        )
      );

    const product = productRows[0];
    if (!product) return { success: false, error: "Product reference target profile not found." };

    const newVolume = Math.max(0, product.currentVolumeMlGrams + volumeDelta);
    
    // Use the actual stored database alert threshold instead of a hardcoded fallback
    const alertLevel = determineAlertLevel(newVolume, product.alertThreshold);

    await db
      .update(salonProductsStock)
      .set({ currentVolumeMlGrams: newVolume, alertLevel })
      .where(eq(salonProductsStock.id, productId));

    revalidatePath("/glam/inventory");
    return { success: true, message: "Inventory counters updated successfully.", data: { newVolume, alertLevel } };
  } catch (error: any) {
    console.error("❌ Direct Stock Shift Error:", error.message);
    return { success: false, error: "Failed to apply volume adjustment deltas." };
  }
}

// =========================================================================
// ⚠️ READ: PARSE REORDER STACKS AND CRITICAL ALERT LOGS WITH UNITS
// =========================================================================
export async function getInventoryAlerts() {
  try {
    const session = await getSalonSession();
    if (!session) return { success: false, error: "Session token context signature missing." };

    const tenantIdStr = String(session.tenantId);
    const outletIdStr = session.outletId ? String(session.outletId) : null;

    if (!outletIdStr) return { success: false, error: "Outlet authorization mapping context broken." };

    const alerts = await db
      .select({
        id: salonProductsStock.id,
        productName: salonProductsStock.productName,
        currentVolumeMlGrams: salonProductsStock.currentVolumeMlGrams,
        unitType: salonProductsStock.unitType, // 🌟 NEW: Track units in active reorder alert panels
        alertThreshold: salonProductsStock.alertThreshold,
        alertLevel: salonProductsStock.alertLevel,
      })
      .from(salonProductsStock)
      .where(
        and(
          eq(salonProductsStock.tenantId, tenantIdStr),
          eq(salonProductsStock.outletId, outletIdStr),
          sql`${salonProductsStock.alertLevel} IN ('low_stock', 'critical_empty')`
        )
      )
      .orderBy(desc(salonProductsStock.alertLevel));

    const criticalCount = alerts.filter((a) => a.alertLevel === "critical_empty").length;
    const lowStockCount = alerts.filter((a) => a.alertLevel === "low_stock").length;

    return { success: true, data: { alerts, criticalCount, lowStockCount } };
  } catch (error: any) {
    console.error("❌ Parse Inventory Alerts Error:", error.message);
    return { success: false, error: "Failed to assemble active inventory warning matrices." };
  }
}

// =========================================================================
// 📊 READ: CONSUMPTION ANALYTICS LEDGER LOGS
// =========================================================================
export async function getConsumptionHistory(productId: number, days: number = 30) {
  try {
    const session = await getSalonSession();
    if (!session) return { success: false, error: "Session timeline tracking expired." };

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await db
      .select({
        id: salonProductConsumptionLogs.id,
        consumedVolume: salonProductConsumptionLogs.consumedVolume,
        loggedAt: salonProductConsumptionLogs.loggedAt,
      })
      .from(salonProductConsumptionLogs)
      .where(
        and(
          eq(salonProductConsumptionLogs.productId, productId),
          gte(salonProductConsumptionLogs.loggedAt, startDate)
        )
      )
      .orderBy(desc(salonProductConsumptionLogs.loggedAt));

    const totalConsumed = logs.reduce((sum, log) => sum + log.consumedVolume, 0);

    return { success: true, data: { logs, totalConsumed, period: days } };
  } catch (error: any) {
    console.error("❌ Consumption History Read Fault:", error.message);
    return { success: false, error: "Failed to compile background product consumption logs." };
  }
}

// =========================================================================
// ⚡ TRANSACTION: LOG CHAIR-SIDE PRODUCT CONSUMPTION DURING VISITS
// =========================================================================
export async function logProductConsumption(appointmentId: string, productId: number, consumedVolume: number) {
  try {
    const session = await getSalonSession();
    if (!session) return { success: false, error: "Session expired." };

    const tenantIdStr = String(session.tenantId);
    const outletIdStr = session.outletId ? String(session.outletId) : null;

    if (!outletIdStr) return { success: false, error: "Invalid workspace outlet node allocation." };

    const productRows = await db
      .select()
      .from(salonProductsStock)
      .where(
        and(
          eq(salonProductsStock.id, productId),
          eq(salonProductsStock.tenantId, tenantIdStr),
          eq(salonProductsStock.outletId, outletIdStr)
        )
      );

    const product = productRows[0];
    if (!product) return { success: false, error: "Product asset target reference profile not found." };

    const newVolume = Math.max(0, product.currentVolumeMlGrams - consumedVolume);
    
    // Use actual database product configuration threshold for status calculations
    const alertLevel = determineAlertLevel(newVolume, product.alertThreshold);

    // Run atomically inside an explicit isolation block to ensure accurate stock tallies
    await db.transaction(async (tx) => {
      await tx
        .insert(salonProductConsumptionLogs)
        .values({ appointmentId, productId, consumedVolume });

      await tx
        .update(salonProductsStock)
        .set({ currentVolumeMlGrams: newVolume, alertLevel })
        .where(eq(salonProductsStock.id, productId));
    });

    return { success: true, message: "Product consumption metrics successfully tracked in the database." };
  } catch (error: any) {
    console.error("❌ Log Consumption Transactional Crash:", error.message);
    return { success: false, error: "Failed to map visit metrics against row assets." };
  }
}

// =========================================================================
// 📦 TRANSACTION: RESTOCK ACTIVE PRODUCT INVENTORY
// =========================================================================
export async function restockInventory(productId: number, quantity: number, supplierCost?: number) {
  try {
    const session = await getSalonSession();
    if (!session) return { success: false, error: "Session authentication credentials timed out." };

    const tenantIdStr = String(session.tenantId);
    const outletIdStr = session.outletId ? String(session.outletId) : null;

    if (!outletIdStr) return { success: false, error: "Access denied. Invalid channel token parameters." };

    const productRows = await db
      .select()
      .from(salonProductsStock)
      .where(
        and(
          eq(salonProductsStock.id, productId),
          eq(salonProductsStock.tenantId, tenantIdStr),
          eq(salonProductsStock.outletId, outletIdStr)
        )
      );

    const product = productRows[0];
    if (!product) return { success: false, error: "Inventory node reference not found." };

    const newVolume = product.currentVolumeMlGrams + quantity;
    
    // Use actual database dynamic validation thresholds rather than a hardcoded fallback
    const alertLevel = determineAlertLevel(newVolume, product.alertThreshold);

    const updatePayload: any = { currentVolumeMlGrams: newVolume, alertLevel };
    
    // Optionally log/update updated purchase costs on restock pipelines if supplied
    if (supplierCost !== undefined && supplierCost > 0) {
      updatePayload.purchasePrice = String(supplierCost);
    }

    await db
      .update(salonProductsStock)
      .set(updatePayload)
      .where(eq(salonProductsStock.id, productId));

    revalidatePath("/glam/inventory");
    return { success: true, message: "Inventory restocked successfully.", data: { newVolume, alertLevel } };
  } catch (error: any) {
    console.error("❌ Supplier Stock Replenishment Error:", error.message);
    return { success: false, error: "Failed to execute restock operations on table arrays." };
  }
}