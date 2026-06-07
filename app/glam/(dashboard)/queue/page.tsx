// app/glam/(dashboard)/queue/page.tsx
import React from "react";
import { getSalonSession } from "@/lib/salon-token";
import { redirect } from "next/navigation";
import { headers } from "next/headers"; 
import Link from "next/link"; // 🌟 Added for unified fast-routing steps
import { db } from "@/db";
import { salonQueueTokens } from "@/db/glam-schema";
import { eq, and, sql, gte, lte } from "drizzle-orm";
import QueueActionControls from "@/components/QueueActionControls"; 

// 🌟 Mobile Ergonomic Navigation Icons
import { LayoutDashboard, CalendarDays, Users2, PackageCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LiveQueueSequencePage() {
  const session = await getSalonSession();
  if (!session) redirect("/glam/login?error=Session Expired");

  const tenantIdStr = String(session.tenantId);
  const outletIdStr = session.outletId ? String(session.outletId) : null;

  if (!outletIdStr) {
    redirect("/glam/login?error=Invalid physical branch anchor assignment.");
  }

  // =========================================================================
  // 🛡️ NATIVE COLUMN SLUG MULTI-TENANT SECURITY GATEWAY (ZERO-DB LOOKUP)
  // =========================================================================
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
  // 📅 TIMEZONE PERIMETER ALIGNMENT (ISO MIDNIGHT BOUND ENVELOPE)
  // =========================================================================
  const todayLocalDateStr = new Date().toISOString().split("T")[0]; 
  const startOfDay = new Date(`${todayLocalDateStr}T00:00:00.000Z`);
  const endOfDay = new Date(`${todayLocalDateStr}T23:59:59.999Z`);

  // Retrieve active walk-in tokens from your live database configuration layer
  const rawTokensList = await db
    .select()
    .from(salonQueueTokens)
    .where(
      and(
        eq(salonQueueTokens.tenantId, tenantIdStr),
        eq(salonQueueTokens.outletId, outletIdStr),
        sql`${salonQueueTokens.status} IN ('waiting', 'serving')`,
        gte(salonQueueTokens.createdAt, startOfDay),
        lte(salonQueueTokens.createdAt, endOfDay)
      )
    )
    .orderBy(salonQueueTokens.tokenNumber);

  const servingTokens = rawTokensList.filter(t => t.status === "serving");
  const waitingTokens = rawTokensList.filter(t => t.status === "waiting");

  return (
    <div className="space-y-6 pb-24 md:pb-8 text-slate-100 max-w-[1600px] mx-auto px-1 sm:px-4">

      {/* =========================================================================
          🌟 THUMB-READY NAVIGATION ROUTERS
         ========================================================================= */}
      {/* A. Desktop Action Bar Strip */}
      <div className="hidden md:flex items-center gap-2 bg-slate-900/60 p-2 border border-slate-800/80 rounded-2xl w-fit select-none">
        <Link href="/glam/dashboard" className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-xl text-xs font-semibold transition">
          <LayoutDashboard size={14} /> Dashboard
        </Link>
        <Link href="/glam/appointments" className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-xl text-xs font-semibold transition">
          <CalendarDays size={14} /> Appointments
        </Link>
        <Link href="/glam/queue" className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-xl text-xs font-bold shadow-md transition">
          <Users2 size={14} /> Sequence Runway
        </Link>
        <Link href="/glam/inventory" className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-xl text-xs font-semibold transition">
          <PackageCheck size={14} /> Stock Inventory
        </Link>
      </div>

      {/* B. Sticky Mobile Tab Dock (Optimized for Floor Terminals) */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 h-16 bg-slate-950/90 border border-slate-800 backdrop-blur-xl rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.7)] z-[99] flex items-center justify-around px-2 select-none">
        <Link href="/glam/dashboard" className="flex flex-col items-center justify-center gap-1 flex-1 text-slate-500 active:text-pink-400 py-1">
          <LayoutDashboard size={20} />
          <span className="text-[9px] font-bold tracking-tight uppercase">Hub</span>
        </Link>
        <Link href="/glam/appointments" className="flex flex-col items-center justify-center gap-1 flex-1 text-slate-500 active:text-pink-400 py-1">
          <CalendarDays size={20} />
          <span className="text-[9px] font-bold tracking-tight uppercase">Slots</span>
        </Link>
        <Link href="/glam/queue" className="flex flex-col items-center justify-center gap-1 flex-1 text-pink-500 py-1">
          <Users2 size={20} strokeWidth={2.5} />
          <span className="text-[9px] font-black tracking-tight uppercase">Queue</span>
        </Link>
        <Link href="/glam/inventory" className="flex flex-col items-center justify-center gap-1 flex-1 text-slate-500 active:text-pink-400 py-1">
          <PackageCheck size={20} />
          <span className="text-[9px] font-bold tracking-tight uppercase">Stock</span>
        </Link>
      </div>

      {/* Header Context Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Sequence Runway Console</h1>
          <p className="text-xs text-slate-400 mt-0.5">Control live flow pipelines for walk-in client volumes.</p>
        </div>
        
        <QueueActionControls mode="dispense" />
      </div>

      {/* Two-Column Flow Layout: Active Chairs vs. Waiting Line */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CHAIR ZONE PANEL */}
        <div className="p-4 sm:p-6 bg-slate-900/40 border border-slate-800 rounded-2xl shadow-xl space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800/80 pb-3 select-none">
            <h2 className="text-xs uppercase font-black tracking-widest text-pink-400">⚡ In Service Chairs</h2>
            <span className="text-[10px] bg-pink-950/50 border border-pink-800/60 px-2 py-0.5 text-pink-300 font-mono font-bold rounded">
              {servingTokens.length} Occupied
            </span>
          </div>

          {servingTokens.length === 0 ? (
            <div className="text-center py-16 text-xs text-slate-500 font-medium bg-slate-950/40 rounded-xl border border-slate-800/60 italic select-none">
              No clients are currently clocked into service slots on the floor.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {servingTokens.map(token => (
                <div key={token.id} className="p-4 bg-slate-950 border border-slate-800/80 rounded-xl relative overflow-hidden group border-t-2 border-t-pink-500">
                  <div className="font-mono text-lg font-black text-pink-400 select-none">
                    TKN-{String(token.tokenNumber).padStart(3, "0")}
                  </div>
                  <p className="text-sm font-bold text-slate-200 mt-1 truncate">{token.clientName || "Walk-In Guest"}</p>
                  <div className="mt-4 flex justify-end">
                    <QueueActionControls mode="complete" targetId={token.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RUNWAY LINE PANEL */}
        <div className="p-4 sm:p-6 bg-slate-900/40 border border-slate-800 rounded-2xl shadow-xl space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800/80 pb-3 select-none">
            <h2 className="text-xs uppercase font-black tracking-widest text-amber-400">⏳ Waiting Buffer Runway</h2>
            <span className="text-[10px] bg-amber-950/50 border border-amber-800/60 px-2 py-0.5 text-amber-300 font-mono font-bold rounded">
              {waitingTokens.length} In Line
            </span>
          </div>

          {waitingTokens.length === 0 ? (
            <div className="text-center py-16 text-xs text-slate-500 font-medium bg-slate-950/40 rounded-xl border border-slate-800/60 italic select-none">
              The waiting queue runway is completely clear.
            </div>
          ) : (
            <div className="space-y-2">
              {waitingTokens.map((token, index) => (
                <div key={token.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="font-mono text-slate-500 font-bold text-xs select-none">#{index + 1}</span>
                    <div className="truncate pr-2">
                      <span className="font-mono font-black text-amber-400 text-sm select-none">TKN-{String(token.tokenNumber).padStart(3, "0")}</span>
                      <span className="ml-3 font-semibold text-slate-300 block sm:inline truncate">{token.clientName || "Walk-In Guest"}</span>
                    </div>
                  </div>
                  <QueueActionControls mode="call" targetId={token.id} />
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}