import React from "react";
import { getSalonSession } from "@/lib/salon-token";
import { redirect } from "next/navigation";
import { headers } from "next/headers"; 
import Link from "next/link"; 
import { db } from "@/db";
import { salonProductsStock, salonProductConsumptionLogs } from "@/db/glam-schema";
import { eq, and, desc } from "drizzle-orm";
import InventoryDashboard from "@/components/InventoryDashboard";

import { LayoutDashboard, CalendarDays, Users2, PackageCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const session = await getSalonSession();
  if (!session) redirect("/glam/login?error=Session Expired");

  const tenantIdStr = String(session.tenantId);
  const outletIdStr = session.outletId ? String(session.outletId) : null;

  if (!outletIdStr) {
    redirect("/glam/login?error=Invalid physical branch anchor assignment.");
  }

  const headersList = await headers();
  const edgeSubdomainSlug = headersList.get("x-tenant-subdomain");

  if (edgeSubdomainSlug && edgeSubdomainSlug !== "www" && !edgeSubdomainSlug.includes("localhost")) {
    const sessionSlugNormalized = session.slug ? String(session.slug).toLowerCase().trim() : null;
    const edgeSlugNormalized = edgeSubdomainSlug.toLowerCase().trim();

    if (!sessionSlugNormalized || sessionSlugNormalized !== edgeSlugNormalized) {
      return (
        <div className="p-8 text-center text-red-400 bg-slate-950/40 border border-red-900/50 rounded-2xl max-w-xl mx-auto mt-12 space-y-2">
          <h3 className="text-lg font-bold">⚠️ Cross-Tenant Security Restriction</h3>
          <p className="text-xs text-slate-400">
            Your authenticated operator credentials map to a different workspace routing slug partition. 
            Active Portal Node: <span className="text-amber-400 font-mono">{edgeSubdomainSlug}.etherealinn.com</span>
          </p>
        </div>
      );
    }
  }

  // =========================================================================
  // DATA ENGINE & SCOPED STOCK QUERIES - FULL DATA FETCHING
  // =========================================================================
  const products = await db
    .select({
      id: salonProductsStock.id,
      productName: salonProductsStock.productName,
      sku: salonProductsStock.sku,
      currentVolumeMlGrams: salonProductsStock.currentVolumeMlGrams,
      alertLevel: salonProductsStock.alertLevel,
      // 🌟 ADDED MISSING COLUMNS
      assetCategory: salonProductsStock.assetCategory,
      unitType: salonProductsStock.unitType,
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

  const alerts = products.filter((p) => p.alertLevel === "critical_empty" || p.alertLevel === "low_stock");

  const recentConsumption = await db
    .select({
      consumedVolume: salonProductConsumptionLogs.consumedVolume,
      loggedAt: salonProductConsumptionLogs.loggedAt,
    })
    .from(salonProductConsumptionLogs)
    .innerJoin(salonProductsStock, eq(salonProductConsumptionLogs.productId, salonProductsStock.id))
    .where(
      and(
        eq(salonProductsStock.tenantId, tenantIdStr),
        eq(salonProductsStock.outletId, outletIdStr)
      )
    )
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
    <div className="space-y-6 pb-24 md:pb-8 text-slate-100 max-w-[1600px] mx-auto px-1 sm:px-4">

      <div className="hidden md:flex items-center gap-2 bg-slate-900/60 p-2 border border-slate-800/80 rounded-2xl w-fit select-none">
        <Link href="/glam/dashboard" className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-xl text-xs font-semibold transition">
          <LayoutDashboard size={14} /> Dashboard
        </Link>
        <Link href="/glam/appointments" className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-xl text-xs font-semibold transition">
          <CalendarDays size={14} /> Appointments
        </Link>
        <Link href="/glam/queue" className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-xl text-xs font-semibold transition">
          <Users2 size={14} /> Sequence Runway
        </Link>
        <Link href="/glam/inventory" className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-xl text-xs font-bold shadow-md transition">
          <PackageCheck size={14} /> Stock Inventory
        </Link>
      </div>

      <div className="md:hidden fixed bottom-4 left-4 right-4 h-16 bg-slate-950/90 border border-slate-800 backdrop-blur-xl rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.7)] z-[99] flex items-center justify-around px-2 select-none">
        <Link href="/glam/dashboard" className="flex flex-col items-center justify-center gap-1 flex-1 text-slate-500 active:text-pink-400 py-1">
          <LayoutDashboard size={20} />
          <span className="text-[9px] font-bold tracking-tight uppercase">Hub</span>
        </Link>
        <Link href="/glam/appointments" className="flex flex-col items-center justify-center gap-1 flex-1 text-slate-500 active:text-pink-400 py-1">
          <CalendarDays size={20} />
          <span className="text-[9px] font-bold tracking-tight uppercase">Slots</span>
        </Link>
        <Link href="/glam/queue" className="flex flex-col items-center justify-center gap-1 flex-1 text-slate-500 active:text-pink-400 py-1">
          <Users2 size={20} />
          <span className="text-[9px] font-bold tracking-tight uppercase">Queue</span>
        </Link>
        <Link href="/glam/inventory" className="flex flex-col items-center justify-center gap-1 flex-1 text-pink-500 py-1">
          <PackageCheck size={20} strokeWidth={2.5} />
          <span className="text-[9px] font-black tracking-tight uppercase">Stock</span>
        </Link>
      </div>

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