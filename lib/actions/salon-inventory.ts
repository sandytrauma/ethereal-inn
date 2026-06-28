// lib/actions/salon-inventory.ts
"use server";

import { db } from "@/db";
import { salonProductsStock, salonProductConsumptionLogs } from "@/db/glam-schema";
import { getSalonSession } from "@/lib/salon-token";
import { eq, and, gte, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

interface InventoryFilters {
  search?: string;
  alertLevel?: string;
  assetCategory?: "consumable" | "fixed_asset" | "all"; // 🌟 Add 'all' here
}

interface NewProductInput {
  productName: string;
  sku?: string;
  assetCategory: "consumable" | "fixed_asset";
  unitType: string; 
  currentVolumeMlGrams: number;
  alertThreshold: number;
  purchasePrice: number; 
  retailPrice: number;   
}

interface UpdateProductInput {
  productName?: string;
  sku?: string;
  assetCategory?: "consumable" | "fixed_asset";
  unitType?: string; 
  alertThreshold?: number;
  purchasePrice?: number; 
  retailPrice?: number;   
}

const determineAlertLevel = (currentVolume: number, threshold: number): "critical_empty" | "low_stock" | "good" => {
  if (currentVolume <= threshold) return "critical_empty";
  if (currentVolume <= threshold * 1.5) return "low_stock";
  return "good";
};

// Replace your existing getInventoryList in lib/actions/salon-inventory.ts
export async function getInventoryList() {
  const session = await getSalonSession();
  if (!session) return []; // Return empty array if no session

  try {
    // Fetch directly from DB
    const results = await db
      .select()
      .from(salonProductsStock)
      .where(and(
        eq(salonProductsStock.tenantId, String(session.tenantId)),
        eq(salonProductsStock.outletId, String(session.outletId))
      ));

    // Return the array directly so InventoryTable receives it as 'products'
    return results; 
  } catch (error) {
    console.error("DB Fetch Error:", error);
    return [];
  }
}

export async function addInventoryItem(payload: NewProductInput) {
  try {
    const session = await getSalonSession();
    if (!session) return { success: false, error: "Session authentication context expired." };

    const tenantIdStr = String(session.tenantId);
    const outletIdStr = session.outletId ? String(session.outletId) : null;

    if (!outletIdStr) return { success: false, error: "Invalid outlet mapping target." };

    const alertLevel = determineAlertLevel(payload.currentVolumeMlGrams, payload.alertThreshold);

    const [newProduct] = await db
      .insert(salonProductsStock)
     .values({
  tenantId: tenantIdStr,
  outletId: outletIdStr,
  productName: payload.productName.trim(),
  sku: payload.sku?.trim() || null,
  assetCategory: payload.assetCategory as "consumable" | "fixed_asset", // Cast to Enum
  unitType: payload.unitType as "ml" | "g" | "pcs" | "pkts" | "kg",     // Cast to Enum
  currentVolumeMlGrams: payload.currentVolumeMlGrams,
  alertThreshold: payload.alertThreshold,
  alertLevel: alertLevel,
  purchasePrice: String(payload.purchasePrice || 0),
  retailPrice: String(payload.retailPrice || 0),
})
      .returning({ id: salonProductsStock.id, productName: salonProductsStock.productName });

    revalidatePath("/glam/inventory");
    return { success: true, message: "Product logged successfully.", data: newProduct };
  } catch (error: any) {
    console.error("❌ Add Inventory Matrix Failure:", error.message);
    return { success: false, error: "Failed to persist new inventory record." };
  }
}

export async function updateInventoryItem(productId: number, payload: UpdateProductInput) {
  try {
    const session = await getSalonSession();
    if (!session) return { success: false, error: "Session validation token expired." };

    const [existing] = await db.select().from(salonProductsStock)
      .where(and(eq(salonProductsStock.id, productId), eq(salonProductsStock.tenantId, String(session.tenantId))));

    if (!existing) return { success: false, error: "Product record not found." };

    const updateData: any = { ...payload };
    if (payload.productName) updateData.productName = payload.productName.trim();
    if (payload.sku !== undefined) updateData.sku = payload.sku?.trim() || null;
    if (payload.purchasePrice !== undefined) updateData.purchasePrice = String(payload.purchasePrice);
    if (payload.retailPrice !== undefined) updateData.retailPrice = String(payload.retailPrice);

    const resolvedCategory = payload.assetCategory || existing.assetCategory;

    if (resolvedCategory === "fixed_asset") {
      updateData.alertLevel = "good";
      updateData.alertThreshold = 0;
    } else {
      const targetThreshold = payload.alertThreshold !== undefined ? payload.alertThreshold : existing.alertThreshold;
      updateData.alertLevel = determineAlertLevel(existing.currentVolumeMlGrams, targetThreshold);
    }

    await db.update(salonProductsStock).set(updateData)
      .where(and(eq(salonProductsStock.id, productId), eq(salonProductsStock.tenantId, String(session.tenantId))));

    revalidatePath("/glam/inventory");
    return { success: true, message: "Inventory updated." };
  } catch (error: any) {
    return { success: false, error: "Failed to adjust inventory parameters." };
  }
}

export async function deleteInventoryItem(productId: number) {
  try {
    const session = await getSalonSession();
    if (!session) return { success: false, error: "Session context invalidated." };

    await db.delete(salonProductsStock).where(eq(salonProductsStock.id, productId));
    revalidatePath("/glam/inventory");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Failed to delete product." };
  }
}

export async function adjustStockLevel(productId: number, volumeDelta: number) {
  try {
    const session = await getSalonSession();
    if (!session) return { success: false, error: "Session expired." };

    const [product] = await db.select().from(salonProductsStock).where(eq(salonProductsStock.id, productId));
    if (!product) return { success: false, error: "Product not found." };

    const newVolume = Math.max(0, product.currentVolumeMlGrams + volumeDelta);
    const alertLevel = determineAlertLevel(newVolume, product.alertThreshold);

    await db.update(salonProductsStock).set({ currentVolumeMlGrams: newVolume, alertLevel }).where(eq(salonProductsStock.id, productId));

    revalidatePath("/glam/inventory");
    return { success: true, data: { newVolume, alertLevel } };
  } catch (error: any) {
    return { success: false, error: "Failed to apply volume adjustment." };
  }
}

export async function getInventoryAlerts() {
  try {
    const session = await getSalonSession();
    if (!session) return { success: false, error: "Session missing." };

    const alerts = await db.select().from(salonProductsStock)
      .where(and(eq(salonProductsStock.tenantId, String(session.tenantId)), sql`${salonProductsStock.alertLevel} IN ('low_stock', 'critical_empty')`));

    const activeConsumableAlerts = alerts.filter((a) => a.assetCategory !== "fixed_asset");
    return { success: true, data: { alerts: activeConsumableAlerts } };
  } catch (error: any) {
    return { success: false, error: "Failed to assemble alerts." };
  }
}

export async function logProductConsumption(appointmentId: string, productId: number, consumedVolume: number) {
  try {
    const session = await getSalonSession();
    if (!session) return { success: false, error: "Session expired." };

    const [product] = await db.select().from(salonProductsStock).where(eq(salonProductsStock.id, productId));
    if (!product) return { success: false, error: "Product not found." };

    const newVolume = Math.max(0, product.currentVolumeMlGrams - consumedVolume);
    const alertLevel = determineAlertLevel(newVolume, product.alertThreshold);

    await db.transaction(async (tx) => {
      await tx.insert(salonProductConsumptionLogs).values({ appointmentId, productId, consumedVolume });
      await tx.update(salonProductsStock).set({ currentVolumeMlGrams: newVolume, alertLevel }).where(eq(salonProductsStock.id, productId));
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Failed to log consumption." };
  }
}

export async function restockInventory(productId: number, quantity: number, supplierCost?: number) {
  try {
    const session = await getSalonSession();
    if (!session) return { success: false, error: "Session expired." };

    const [product] = await db.select().from(salonProductsStock).where(eq(salonProductsStock.id, productId));
    if (!product) return { success: false, error: "Product not found." };

    const newVolume = product.currentVolumeMlGrams + quantity;
    const alertLevel = determineAlertLevel(newVolume, product.alertThreshold);

    const updatePayload: any = { currentVolumeMlGrams: newVolume, alertLevel };
    if (supplierCost && supplierCost > 0) updatePayload.purchasePrice = String(supplierCost);

    await db.update(salonProductsStock).set(updatePayload).where(eq(salonProductsStock.id, productId));
    revalidatePath("/glam/inventory");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Failed to restock." };
  }
}