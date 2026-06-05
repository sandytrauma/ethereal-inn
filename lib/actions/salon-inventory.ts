"use server";

import { db } from "@/db";
import { salonProductsStock, salonProductConsumptionLogs } from "@/db/glam-schema";
import { getSalonSession } from "@/lib/salon-token";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getInventoryList(filters?: { search?: string; alertLevel?: string }) {
  try {
    const session = await getSalonSession();
    if (!session) return { success: false, error: "Session expired" };

    const tenantIdStr = String(session.tenantId);
    const outletIdStr = session.outletId ? String(session.outletId) : null;

    if (!outletIdStr) {
      return { success: false, error: "Invalid outlet assignment" };
    }

    let query = db
      .select({
        id: salonProductsStock.id,
        productName: salonProductsStock.productName,
        sku: salonProductsStock.sku,
        currentVolumeMlGrams: salonProductsStock.currentVolumeMlGrams,
        alertLevel: salonProductsStock.alertLevel,
      })
      .from(salonProductsStock)
      .where(
        and(
          eq(salonProductsStock.tenantId, tenantIdStr),
          eq(salonProductsStock.outletId, outletIdStr)
        )
      );

    const products = await query.orderBy(salonProductsStock.productName);

    let filtered = products;
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = products.filter(
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
    console.error("Get Inventory Error:", error.message);
    return { success: false, error: "Failed to fetch inventory" };
  }
}

export async function addInventoryItem(payload: {
  productName: string;
  sku?: string;
  currentVolumeMlGrams: number;
  alertThreshold: number;
}) {
  try {
    const session = await getSalonSession();
    if (!session) return { success: false, error: "Session expired" };

    const tenantIdStr = String(session.tenantId);
    const outletIdStr = session.outletId ? String(session.outletId) : null;

    if (!outletIdStr) {
      return { success: false, error: "Invalid outlet assignment" };
    }

    const alertLevel =
      payload.currentVolumeMlGrams <= payload.alertThreshold
        ? "critical_empty"
        : payload.currentVolumeMlGrams <= payload.alertThreshold * 1.5
          ? "low_stock"
          : "good";

    const [newProduct] = await db
      .insert(salonProductsStock)
      .values({
        tenantId: tenantIdStr,
        outletId: outletIdStr,
        productName: payload.productName.trim(),
        sku: payload.sku?.trim() || null,
        currentVolumeMlGrams: payload.currentVolumeMlGrams,
        alertLevel,
      })
      .returning({ id: salonProductsStock.id, productName: salonProductsStock.productName });

    revalidatePath("/glam/inventory");
    return { success: true, message: "Product added successfully", data: newProduct };
  } catch (error: any) {
    console.error("Add Inventory Error:", error.message);
    if (error.message?.includes("unique constraint")) {
      return { success: false, error: "Product with this SKU already exists" };
    }
    return { success: false, error: "Failed to add product" };
  }
}

export async function updateInventoryItem(
  productId: number,
  payload: {
    productName?: string;
    sku?: string;
    alertThreshold?: number;
  }
) {
  try {
    const session = await getSalonSession();
    if (!session) return { success: false, error: "Session expired" };

    const tenantIdStr = String(session.tenantId);
    const outletIdStr = session.outletId ? String(session.outletId) : null;

    if (!outletIdStr) {
      return { success: false, error: "Invalid outlet assignment" };
    }

    const updateData: any = {};
    if (payload.productName) updateData.productName = payload.productName.trim();
    if (payload.sku) updateData.sku = payload.sku.trim();

    if (Object.keys(updateData).length === 0) {
      return { success: false, error: "No fields to update" };
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
    return { success: true, message: "Product updated successfully" };
  } catch (error: any) {
    console.error("Update Inventory Error:", error.message);
    return { success: false, error: "Failed to update product" };
  }
}

export async function deleteInventoryItem(productId: number) {
  try {
    const session = await getSalonSession();
    if (!session) return { success: false, error: "Session expired" };

    const tenantIdStr = String(session.tenantId);
    const outletIdStr = session.outletId ? String(session.outletId) : null;

    if (!outletIdStr) {
      return { success: false, error: "Invalid outlet assignment" };
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
    return { success: true, message: "Product deleted successfully" };
  } catch (error: any) {
    console.error("Delete Inventory Error:", error.message);
    return { success: false, error: "Failed to delete product" };
  }
}

export async function adjustStockLevel(productId: number, volumeDelta: number) {
  try {
    const session = await getSalonSession();
    if (!session) return { success: false, error: "Session expired" };

    const tenantIdStr = String(session.tenantId);
    const outletIdStr = session.outletId ? String(session.outletId) : null;

    if (!outletIdStr) {
      return { success: false, error: "Invalid outlet assignment" };
    }

    const [product] = await db
      .select()
      .from(salonProductsStock)
      .where(
        and(
          eq(salonProductsStock.id, productId),
          eq(salonProductsStock.tenantId, tenantIdStr),
          eq(salonProductsStock.outletId, outletIdStr)
        )
      );

    if (!product) {
      return { success: false, error: "Product not found" };
    }

    const newVolume = Math.max(0, product.currentVolumeMlGrams + volumeDelta);
    const alertThreshold = 100;
    const alertLevel =
      newVolume <= alertThreshold
        ? "critical_empty"
        : newVolume <= alertThreshold * 1.5
          ? "low_stock"
          : "good";

    await db
      .update(salonProductsStock)
      .set({ currentVolumeMlGrams: newVolume, alertLevel })
      .where(eq(salonProductsStock.id, productId));

    revalidatePath("/glam/inventory");
    return { success: true, message: "Stock adjusted successfully", data: { newVolume, alertLevel } };
  } catch (error: any) {
    console.error("Adjust Stock Error:", error.message);
    return { success: false, error: "Failed to adjust stock" };
  }
}

export async function getInventoryAlerts() {
  try {
    const session = await getSalonSession();
    if (!session) return { success: false, error: "Session expired" };

    const tenantIdStr = String(session.tenantId);
    const outletIdStr = session.outletId ? String(session.outletId) : null;

    if (!outletIdStr) {
      return { success: false, error: "Invalid outlet assignment" };
    }

    const alerts = await db
      .select({
        id: salonProductsStock.id,
        productName: salonProductsStock.productName,
        currentVolumeMlGrams: salonProductsStock.currentVolumeMlGrams,
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
    console.error("Get Alerts Error:", error.message);
    return { success: false, error: "Failed to fetch alerts" };
  }
}

export async function getConsumptionHistory(
  productId: number,
  days: number = 30
) {
  try {
    const session = await getSalonSession();
    if (!session) return { success: false, error: "Session expired" };

    const tenantIdStr = String(session.tenantId);

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
    console.error("Get Consumption History Error:", error.message);
    return { success: false, error: "Failed to fetch consumption history" };
  }
}

export async function logProductConsumption(
  appointmentId: string,
  productId: number,
  consumedVolume: number
) {
  try {
    const session = await getSalonSession();
    if (!session) return { success: false, error: "Session expired" };

    const tenantIdStr = String(session.tenantId);
    const outletIdStr = session.outletId ? String(session.outletId) : null;

    if (!outletIdStr) {
      return { success: false, error: "Invalid outlet assignment" };
    }

    const [product] = await db
      .select()
      .from(salonProductsStock)
      .where(
        and(
          eq(salonProductsStock.id, productId),
          eq(salonProductsStock.tenantId, tenantIdStr),
          eq(salonProductsStock.outletId, outletIdStr)
        )
      );

    if (!product) {
      return { success: false, error: "Product not found" };
    }

    const newVolume = Math.max(0, product.currentVolumeMlGrams - consumedVolume);
    const alertThreshold = 100;
    const alertLevel =
      newVolume <= alertThreshold
        ? "critical_empty"
        : newVolume <= alertThreshold * 1.5
          ? "low_stock"
          : "good";

    await db.transaction(async (tx) => {
      await tx
        .insert(salonProductConsumptionLogs)
        .values({ appointmentId, productId, consumedVolume });

      await tx
        .update(salonProductsStock)
        .set({ currentVolumeMlGrams: newVolume, alertLevel })
        .where(eq(salonProductsStock.id, productId));
    });

    return { success: true, message: "Consumption logged" };
  } catch (error: any) {
    console.error("Log Consumption Error:", error.message);
    return { success: false, error: "Failed to log consumption" };
  }
}

export async function restockInventory(
  productId: number,
  quantity: number,
  supplierCost?: number
) {
  try {
    const session = await getSalonSession();
    if (!session) return { success: false, error: "Session expired" };

    const tenantIdStr = String(session.tenantId);
    const outletIdStr = session.outletId ? String(session.outletId) : null;

    if (!outletIdStr) {
      return { success: false, error: "Invalid outlet assignment" };
    }

    const [product] = await db
      .select()
      .from(salonProductsStock)
      .where(
        and(
          eq(salonProductsStock.id, productId),
          eq(salonProductsStock.tenantId, tenantIdStr),
          eq(salonProductsStock.outletId, outletIdStr)
        )
      );

    if (!product) {
      return { success: false, error: "Product not found" };
    }

    const newVolume = product.currentVolumeMlGrams + quantity;
    const alertThreshold = 100;
    const alertLevel =
      newVolume <= alertThreshold
        ? "critical_empty"
        : newVolume <= alertThreshold * 1.5
          ? "low_stock"
          : "good";

    await db
      .update(salonProductsStock)
      .set({ currentVolumeMlGrams: newVolume, alertLevel })
      .where(eq(salonProductsStock.id, productId));

    revalidatePath("/glam/inventory");
    return { success: true, message: "Inventory restocked successfully", data: { newVolume } };
  } catch (error: any) {
    console.error("Restock Error:", error.message);
    return { success: false, error: "Failed to restock inventory" };
  }
}
