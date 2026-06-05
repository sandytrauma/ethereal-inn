import React from "react";
import { getSalonSession } from "@/lib/salon-token";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { salonProductsStock, salonProductConsumptionLogs } from "@/db/glam-schema";
import { eq, and, desc } from "drizzle-orm";
import InventoryDashboard from "@/components/InventoryDashboard";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const session = await getSalonSession();
  if (!session) redirect("/glam/login?error=Session Expired");

  const tenantIdStr = String(session.tenantId);
  const outletIdStr = session.outletId ? String(session.outletId) : null;

  if (!outletIdStr) {
    redirect("/glam/login?error=Invalid physical branch anchor assignment.");
  }

  const products = await db
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
    )
    .orderBy(salonProductsStock.productName);

  const alerts = products.filter((p) => p.alertLevel === "critical_empty" || p.alertLevel === "low_stock");

  const recentConsumption = await db
    .select({
      consumedVolume: salonProductConsumptionLogs.consumedVolume,
      loggedAt: salonProductConsumptionLogs.loggedAt,
    })
    .from(salonProductConsumptionLogs)
    .orderBy(desc(salonProductConsumptionLogs.loggedAt))
    .limit(100);

  const totalConsumedToday = recentConsumption
    .filter((log) => {
      const logDate = new Date(log.loggedAt).toISOString().split("T")[0];
      const today = new Date().toISOString().split("T")[0];
      return logDate === today;
    })
    .reduce((sum, log) => sum + log.consumedVolume, 0);

  return (
    <div className="space-y-8 text-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Track product inflow and outflow across your salon operations.
          </p>
        </div>
      </div>

      <InventoryDashboard
        products={products}
        alerts={alerts}
        totalConsumedToday={totalConsumedToday}
      />
    </div>
  );
}
