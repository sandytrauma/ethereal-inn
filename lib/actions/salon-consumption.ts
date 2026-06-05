"use server";

import { db } from "@/db";
import {
  salonAppointments,
  salonProductsStock,
  appointmentServicesBridge,
  serviceProductsBridge,
  salonProductConsumptionLogs,
} from "@/db/glam-schema";
import { getSalonSession } from "@/lib/salon-token";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getServiceProducts(serviceId: number) {
  try {
    const session = await getSalonSession();
    if (!session) return { success: false, error: "Session expired" };

    const tenantIdStr = String(session.tenantId);

    const products = await db
      .select({
        id: serviceProductsBridge.id,
        productId: serviceProductsBridge.productId,
        productName: salonProductsStock.productName,
        defaultUsageVolume: serviceProductsBridge.defaultUsageVolume,
      })
      .from(serviceProductsBridge)
      .leftJoin(salonProductsStock, eq(serviceProductsBridge.productId, salonProductsStock.id))
      .where(
        and(
          eq(serviceProductsBridge.tenantId, tenantIdStr),
          eq(serviceProductsBridge.serviceId, serviceId)
        )
      );

    return { success: true, data: products };
  } catch (error: any) {
    console.error("Get Service Products Error:", error.message);
    return { success: false, error: "Failed to fetch service products" };
  }
}

export async function linkProductToService(
  serviceId: number,
  productId: number,
  defaultUsageVolume: number
) {
  try {
    const session = await getSalonSession();
    if (!session) return { success: false, error: "Session expired" };

    const tenantIdStr = String(session.tenantId);

    await db.insert(serviceProductsBridge).values({
      tenantId: tenantIdStr,
      serviceId,
      productId,
      defaultUsageVolume,
    });

    return { success: true, message: "Product linked to service" };
  } catch (error: any) {
    console.error("Link Product Error:", error.message);
    return { success: false, error: "Failed to link product" };
  }
}

export async function unlinkProductFromService(linkId: number) {
  try {
    const session = await getSalonSession();
    if (!session) return { success: false, error: "Session expired" };

    await db.delete(serviceProductsBridge).where(eq(serviceProductsBridge.id, linkId));

    return { success: true, message: "Product unlinked from service" };
  } catch (error: any) {
    console.error("Unlink Product Error:", error.message);
    return { success: false, error: "Failed to unlink product" };
  }
}

export async function checkoutWithProductConsumption(
  appointmentId: string,
  consumedProducts: Array<{
    productId: number;
    volume: number;
  }>
) {
  try {
    const session = await getSalonSession();
    if (!session) return { success: false, error: "Session expired" };

    const tenantIdStr = String(session.tenantId);
    const outletIdStr = session.outletId ? String(session.outletId) : null;

    if (!outletIdStr) {
      return { success: false, error: "Invalid outlet assignment" };
    }

    const [appointment] = await db
      .select()
      .from(salonAppointments)
      .where(
        and(
          eq(salonAppointments.id, appointmentId),
          eq(salonAppointments.tenantId, tenantIdStr),
          eq(salonAppointments.outletId, outletIdStr)
        )
      );

    if (!appointment) {
      return { success: false, error: "Appointment not found" };
    }

    await db.transaction(async (tx) => {
      // 1. Mark appointment as completed
      await tx
        .update(salonAppointments)
        .set({ status: "completed" })
        .where(eq(salonAppointments.id, appointmentId));

      // 2. Process each consumed product
      for (const consumed of consumedProducts) {
        if (consumed.volume <= 0) continue;

        const [product] = await tx
          .select()
          .from(salonProductsStock)
          .where(
            and(
              eq(salonProductsStock.id, consumed.productId),
              eq(salonProductsStock.tenantId, tenantIdStr),
              eq(salonProductsStock.outletId, outletIdStr)
            )
          );

        if (!product) continue;

        // Deduct from inventory
        const newVolume = Math.max(0, product.currentVolumeMlGrams - consumed.volume);
        const alertThreshold = 100;
        const alertLevel =
          newVolume <= alertThreshold
            ? "critical_empty"
            : newVolume <= alertThreshold * 1.5
              ? "low_stock"
              : "good";

        await tx
          .update(salonProductsStock)
          .set({ currentVolumeMlGrams: newVolume, alertLevel })
          .where(eq(salonProductsStock.id, consumed.productId));

        // Log consumption
        await tx.insert(salonProductConsumptionLogs).values({
          appointmentId,
          productId: consumed.productId,
          consumedVolume: consumed.volume,
        });
      }
    });

    revalidatePath("/glam/dashboard");
    revalidatePath("/glam/appointments");
    revalidatePath("/glam/inventory");

    return {
      success: true,
      message: `Appointment completed. ${consumedProducts.length} products deducted from inventory.`,
    };
  } catch (error: any) {
    console.error("Checkout Error:", error.message);
    return { success: false, error: "Failed to process checkout" };
  }
}
