import React from "react";
import { getSalonSession } from "@/lib/salon-token";
import { redirect } from "next/navigation";
import { headers } from "next/headers"; 
import Link from "next/link"; // 🌟 Added for safe fast-routing loops
import { db } from "@/db";
import { 
  salonOutlets, 
  salonAuthUsers, 
  salonAppointments, 
  salonQueueTokens, 
  salonClients
} from "@/db/glam-schema";
import { eq, and, sql, gte, lte } from "drizzle-orm";
import { getTodayDateRange } from "@/lib/date-utils";
import CheckoutControlTerminal from "@/components/CheckoutControlTerminal";
import CommandTerminalActions from "@/components/CommandTerminalActions";

// 🌟 Navigation Icon Palette for Finger-Friendly Layouts
import { LayoutDashboard, CalendarDays, Users2, PackageCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SalonMainDashboard() {
  const session = await getSalonSession();
  if (!session) {
    redirect("/glam/login?error=Session expired");
  }

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
  // CORE METRICS ENGINE & DATA QUERIES
  // =========================================================================
  const { startOfDay, endOfDay } = getTodayDateRange();

  const [activeOutlet] = await db
    .select()
    .from(salonOutlets)
    .where(and(eq(salonOutlets.id, outletIdStr), eq(salonOutlets.tenantId, tenantIdStr)))
    .limit(1);

  const salesRows = await db
    .select({ amount: salonAppointments.totalAmount })
    .from(salonAppointments)
    .where(
      and(
        eq(salonAppointments.tenantId, tenantIdStr),
        eq(salonAppointments.outletId, outletIdStr),
        eq(salonAppointments.status, "completed"),
        gte(salonAppointments.startTime, startOfDay),
        lte(salonAppointments.startTime, endOfDay)
      )
    );
  const totalSalesGross = salesRows.reduce((sum, row) => sum + parseFloat(row.amount || "0"), 0);

  const [queueCountResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(salonQueueTokens)
    .where(
      and(
        eq(salonQueueTokens.tenantId, tenantIdStr),
        eq(salonQueueTokens.outletId, outletIdStr),
        eq(salonQueueTokens.status, "waiting"),
        gte(salonQueueTokens.createdAt, startOfDay),
        lte(salonQueueTokens.createdAt, endOfDay)
      )
    );

  const [slotsResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(salonAppointments)
    .where(
      and(
        eq(salonAppointments.tenantId, tenantIdStr),
        eq(salonAppointments.outletId, outletIdStr),
        gte(salonAppointments.startTime, startOfDay),
        lte(salonAppointments.startTime, endOfDay)
      )
    );

  const [staffCountResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(salonAuthUsers)
    .where(
      and(
        eq(salonAuthUsers.tenantId, tenantIdStr),
        eq(salonAuthUsers.outletId, outletIdStr),
        eq(salonAuthUsers.isActive, true)
      )
    );

  const activeQueueRunway = await db
    .select({
      id: salonAppointments.id,
      tokenNumber: salonAppointments.tokenNumber,
      status: salonAppointments.status,
      startTime: salonAppointments.startTime,
      totalAmount: salonAppointments.totalAmount
    })
    .from(salonAppointments)
    .where(
      and(
        eq(salonAppointments.tenantId, tenantIdStr),
        eq(salonAppointments.outletId, outletIdStr),
        sql`${salonAppointments.status} IN ('scheduled', 'active_service', 'completed')`,
        gte(salonAppointments.startTime, startOfDay),
        lte(salonAppointments.startTime, endOfDay)
      )
    )
    .orderBy(salonAppointments.startTime);

  const accessibleClients = await db
    .select({ id: salonClients.id, name: salonClients.name })
    .from(salonClients)
    .where(eq(salonClients.tenantId, tenantIdStr))
    .orderBy(salonClients.name);

  return (
    <div className="space-y-6 pb-24 md:pb-8 text-slate-100 max-w-[1600px] mx-auto px-1 sm:px-4">

      {/* =========================================================================
          🌟 THUMB-READY INTERACTIVE NAVIGATION LAYOUTS
         ========================================================================= */}
      {/* A. Top Desktop Action Nav Strip */}
      <div className="hidden md:flex items-center gap-2 bg-slate-900/60 p-2 border border-slate-800/80 rounded-2xl w-fit select-none">
        <Link href="/glam/dashboard" className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-xl text-xs font-bold shadow-md transition">
          <LayoutDashboard size={14} /> Dashboard
        </Link>
        <Link href="/glam/appointments" className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-xl text-xs font-semibold transition">
          <CalendarDays size={14} /> Appointments
        </Link>
        <Link href="/glam/queue" className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-xl text-xs font-semibold transition">
          <Users2 size={14} /> Sequence Runway
        </Link>
        <Link href="/glam/inventory" className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-xl text-xs font-semibold transition">
          <PackageCheck size={14} /> Stock Inventory
        </Link>
      </div>

      {/* B. Sticky Bottom Phone Navigation Bar (Ergonomic Thumb Arcs Optimized) */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 h-16 bg-slate-950/90 border border-slate-800 backdrop-blur-xl rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.7)] z-[99] flex items-center justify-around px-2 select-none">
        <Link href="/glam/dashboard" className="flex flex-col items-center justify-center gap-1 flex-1 text-pink-500 py-1">
          <LayoutDashboard size={20} strokeWidth={2.5} />
          <span className="text-[9px] font-black tracking-tight uppercase">Hub</span>
        </Link>
        <Link href="/glam/appointments" className="flex flex-col items-center justify-center gap-1 flex-1 text-slate-500 active:text-pink-400 py-1">
          <CalendarDays size={20} />
          <span className="text-[9px] font-bold tracking-tight uppercase">Slots</span>
        </Link>
        <Link href="/glam/queue" className="flex flex-col items-center justify-center gap-1 flex-1 text-slate-500 active:text-pink-400 py-1">
          <Users2 size={20} />
          <span className="text-[9px] font-bold tracking-tight uppercase">Queue</span>
        </Link>
        <Link href="/glam/inventory" className="flex flex-col items-center justify-center gap-1 flex-1 text-slate-500 active:text-pink-400 py-1">
          <PackageCheck size={20} />
          <span className="text-[9px] font-bold tracking-tight uppercase">Stock</span>
        </Link>
      </div>

      {/* Live Context Header Wrapper */}
      <div className="p-6 bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xl">
        <div className="space-y-1">
          <div className="text-[10px] uppercase font-black tracking-widest text-pink-500">Live Branch Operational Context</div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100">
            {activeOutlet ? activeOutlet.name : "System Master Framework Matrix"}
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            {activeOutlet ? activeOutlet.address : "Analyzing isolated system parameters."}
          </p>

          {/* 🌟 NEW BRAND INTERLOCK: Direct quick-access client promotion site pointer */}
          {session.slug && (
            <div className="pt-2">
              <Link 
                href={`/glam/brand/${session.slug}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-pink-400 hover:text-pink-300 underline underline-offset-4 transition"
              >
                🌐 View Live Public Brand Page & Invite Clients →
              </Link>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <CheckoutControlTerminal actionType="close_day" totalEarnings={totalSalesGross} />
          <span className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-emerald-400 flex items-center gap-2 select-none">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Sync Active
          </span>
        </div>
      </div>

      {/* Metric Grid Allocation Panels */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 bg-slate-900/50 border border-slate-800 rounded-2xl shadow-lg space-y-1 sm:space-y-2">
          <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Gross</p>
          <div className="flex items-baseline justify-between">
            <span className="text-lg sm:text-2xl font-black tracking-tight text-emerald-400">₹{totalSalesGross.toLocaleString("en-IN")}</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 bg-slate-900/50 border border-slate-800 rounded-2xl shadow-lg space-y-1 sm:space-y-2">
          <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Queue</p>
          <div className="flex items-baseline justify-between">
            <span className="text-lg sm:text-2xl font-black tracking-tight text-pink-400">{queueCountResult?.count ?? 0} In Line</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 bg-slate-900/50 border border-slate-800 rounded-2xl shadow-lg space-y-1 sm:space-y-2">
          <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Bookings</p>
          <div className="flex items-baseline justify-between">
            <span className="text-lg sm:text-2xl font-black tracking-tight text-indigo-400">{slotsResult?.count ?? 0} Slots</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 bg-slate-900/50 border border-slate-800 rounded-2xl shadow-lg space-y-1 sm:space-y-2">
          <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Roster</p>
          <div className="flex items-baseline justify-between">
            <span className="text-lg sm:text-2xl font-black tracking-tight text-amber-400">{staffCountResult?.count ?? 0} Floor</span>
          </div>
        </div>
      </div>

      {/* Main Structural Layout Runway Splits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-4 sm:p-6 bg-slate-900/40 border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between">
          <div className="w-full">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-3">
              <div>
                <h3 className="text-md font-bold text-slate-200 tracking-wide">Live Sequence Runway Monitor</h3>
                <p className="text-xs text-slate-500 mt-0.5">Manage live walk-ins and checkout ongoing billing items.</p>
              </div>
              <a href="/glam/queue" className="text-center text-xs px-4 py-2.5 bg-pink-950/30 hover:bg-pink-900/40 border border-pink-800/40 rounded-xl text-pink-400 font-bold transition select-none">
                Manage Queue Fullscreen →
              </a>
            </div>

            <div className="overflow-x-auto">
              {activeQueueRunway.length === 0 ? (
                <div className="text-center py-12 text-xs font-medium text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/60 select-none">
                  📭 No active bookings or treatment tickets currently on the floor.
                </div>
              ) : (
                <table className="w-full border-collapse text-left min-w-[500px]">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 select-none">
                      <th className="pb-3 font-semibold">Token Code</th>
                      <th className="pb-3 font-semibold">Price</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold text-right">Register Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-sm">
                    {activeQueueRunway.map((row) => (
                      <tr key={row.id} className="group hover:bg-slate-900/20 transition">
                        <td className="py-3.5 font-mono font-bold text-pink-400 text-xs">{row.tokenNumber}</td>
                        <td className="py-3.5 font-semibold text-slate-300 font-mono text-xs">
                          {row.totalAmount ? `₹${parseFloat(row.totalAmount).toLocaleString("en-IN")}` : "₹0.00"}
                        </td>
                        <td className="py-3.5">
                          <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider select-none ${
                            row.status === "active_service" 
                              ? "bg-pink-500/10 text-pink-400 border-pink-500/30 animate-pulse" 
                              : row.status === "completed"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          }`}>
                            {row.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-3.5 text-right font-medium text-xs">
                          {row.status === "active_service" || row.status === "scheduled" ? (
                            <CheckoutControlTerminal actionType="settle_ticket" ticketId={row.id} />
                          ) : row.status === "completed" ? (
                            <span className="text-[11px] text-emerald-400 font-bold flex items-center justify-end gap-1 select-none">✓ Paid</span>
                          ) : (
                            <span className="text-[10px] text-slate-600 font-medium italic select-none">Awaiting Chair</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-slate-800/50 flex justify-between items-center text-xs text-slate-500 select-none">
            <span>Automated operational tracking system active</span>
            <span className="font-mono text-[10px] text-pink-500/80">
              Terminal: {edgeSubdomainSlug ? `${edgeSubdomainSlug}.etherealinn.com` : "Global Core Node"}
            </span>
          </div>
        </div>

        {/* Command Panel Split Trigger */}
        <div className="p-4 sm:p-6 bg-slate-900/40 border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-md font-bold text-slate-200 tracking-wide">Rapid Command Terminal</h3>
              <p className="text-xs text-slate-500 mt-0.5">Quick access triggers for store operations.</p>
            </div>
            <CommandTerminalActions clientsList={accessibleClients} />
          </div>

          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2 select-none">
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Tenant Subscription Context</div>
            <div className="text-xs text-slate-300 font-medium">
              Staff Operator: <span className="text-pink-400 font-bold">{session.name}</span>
            </div>
            <div className="text-[11px] font-mono text-slate-600 truncate">
              Branch Ref: ID {session.outletId}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}