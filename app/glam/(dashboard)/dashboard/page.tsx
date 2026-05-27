// app/glam/(dashboard)/dashboard/page.tsx
import React from "react";
import { getSalonSession } from "@/lib/salon-token";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { salonOutlets, salonAuthUsers, salonAppointments, salonQueueTokens } from "@/db/glam-schema"; 
import { eq, and, sql, gte, lte } from "drizzle-orm";
import CheckoutControlTerminal from "@/components/CheckoutControlTerminal";

export const dynamic = "force-dynamic";

export default async function SalonMainDashboard() {
  // 1. Verify safe crypto server session identity context
  const session = await getSalonSession();
  if (!session) {
    redirect("/glam/login?error=Session expired");
  }

  const tenantIdStr = String(session.tenantId);
  const outletIdStr = session.outletId ? String(session.outletId) : null;

  if (!outletIdStr) {
    redirect("/glam/login?error=Invalid physical branch anchor assignment.");
  }

  // 2. Fetch the current operating branch metadata fields
  const activeOutlet = await db.query.salonOutlets.findFirst({
    where: and(
      eq(salonOutlets.id, outletIdStr),
      eq(salonOutlets.tenantId, tenantIdStr)
    )
  });

  // 3. Define time envelopes for live day tracking (00:00:00 to 23:59:59)
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  // 4. LIVE TELEMETRY COMPUTATIONS USING INDEPENDENT DIRECT TARGETED SELECTS

  // A. Today's Gross Sales Sum from totalAmount decimal fields
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

  // B. Active Waiting/Scheduled Queue Counter running today (Read from standalone queue table)
  const [queueCountResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(salonQueueTokens)
    .where(
      and(
        eq(salonQueueTokens.tenantId, tenantIdStr),
        eq(salonQueueTokens.outletId, outletIdStr),
        eq(salonQueueTokens.status, "waiting")
      )
    );

  // C. Total Booked Slots Overall for Today (Read from appointments calendar log)
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

  // D. Count Active Stylists/Staff on Floor
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

  // E. Pull Live runway appointments that require interactive workflow handling
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
        sql`${salonAppointments.status} IN ('scheduled', 'active_service')`,
        gte(salonAppointments.startTime, startOfDay),
        lte(salonAppointments.startTime, endOfDay)
      )
    )
    .orderBy(salonAppointments.startTime);

  return (
    <div className="space-y-8 text-slate-100">
      
      {/* 🌟 OUTLET CONTEXT CONTAINER BANNER WITH DAY CLOSURE TELEMETRY */}
      <div className="p-6 bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xl">
        <div className="space-y-1">
          <div className="text-[10px] uppercase font-black tracking-widest text-pink-500">Live Branch Operational Context</div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100">
            {activeOutlet ? activeOutlet.name : "System Master Framework Matrix"}
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            {activeOutlet ? activeOutlet.address : "Analyzing isolated system parameters."}
          </p>
        </div>
        <div className="flex items-center gap-3">
<CheckoutControlTerminal actionType="close_day" totalEarnings={totalSalesGross} />
          <span className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-emerald-400 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Sync Active
          </span>
        </div>
      </div>

      {/* 📊 DYNAMIC LIVE TELEMETRY STAT CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl shadow-lg space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Gross Earnings</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black tracking-tight text-emerald-400">₹{totalSalesGross.toLocaleString("en-IN")}</span>
            <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">REALTIME</span>
          </div>
        </div>

        <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl shadow-lg space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Waiting Queue</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black tracking-tight text-pink-400">{queueCountResult?.count ?? 0} Clients</span>
            <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">LIVE RUNWAY</span>
          </div>
        </div>

        <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl shadow-lg space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Daily Bookings</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black tracking-tight text-indigo-400">{slotsResult?.count ?? 0} Slots</span>
            <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">CAPACITY</span>
          </div>
        </div>

        <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl shadow-lg space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stylists on Floor</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black tracking-tight text-amber-400">{staffCountResult?.count ?? 0} Present</span>
            <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">ROSTER</span>
          </div>
        </div>
      </div>

      {/* 🚀 REAL RUNWAY MONITOR TABLE WITH BUILT-IN CHECKOUT TRIGGERS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 bg-slate-900/40 border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between">
          <div className="w-full">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-md font-bold text-slate-200 tracking-wide">Live Sequence Runway Monitor</h3>
                <p className="text-xs text-slate-500 mt-0.5">Manage live walk-ins and checkout ongoing billing items.</p>
              </div>
              <a href="/glam/queue" className="text-xs px-3 py-1.5 bg-pink-950/30 hover:bg-pink-900/40 border border-pink-800/40 rounded-xl text-pink-400 font-semibold transition cursor-pointer">
                Manage Queue Fullscreen →
              </a>
            </div>

            <div className="overflow-x-auto">
              {activeQueueRunway.length === 0 ? (
                <div className="text-center py-12 text-xs font-medium text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/60">
                  📭 No active bookings or treatment tickets currently on the floor.
                </div>
              ) : (
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="pb-3 font-semibold">Token Code</th>
                      <th className="pb-3 font-semibold">Price</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold text-right">Register Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-sm">
                    {activeQueueRunway.map((row) => (
                      <tr key={row.id} className="group hover:bg-slate-900/20 transition">
                        <td className="py-3.5 font-mono font-bold text-pink-400 text-xs">
                          {row.tokenNumber}
                        </td>
                        <td className="py-3.5 font-semibold text-slate-300 font-mono text-xs">
                          ₹{parseFloat(row.totalAmount).toLocaleString("en-IN")}
                        </td>
                        <td className="py-3.5">
                          <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${
                            row.status === "active_service" 
                              ? "bg-pink-500/10 text-pink-400 border-pink-500/30 animate-pulse" 
                              : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          }`}>
                            {row.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          {row.status === "active_service" ? (
<CheckoutControlTerminal actionType="settle_ticket" ticketId={row.id} />                          ) : (
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
          
          <div className="mt-4 pt-4 border-t border-slate-800/50 flex justify-between items-center text-xs text-slate-500">
            <span>Automated operational tracking system active</span>
            <span className="font-mono text-[10px] text-pink-500/80">Refreshed Live</span>
          </div>
        </div>

        {/* QUICK COMMAND TERMINAL */}
        <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-md font-bold text-slate-200 tracking-wide">Rapid Command Terminal</h3>
              <p className="text-xs text-slate-500 mt-0.5">Quick access triggers for store operations.</p>
            </div>

            <div className="space-y-2.5">
              <button className="w-full p-3 bg-gradient-to-r from-pink-600/20 to-rose-600/20 hover:from-pink-600/30 hover:to-rose-600/30 border border-pink-800/40 rounded-xl text-xs font-bold uppercase tracking-wider text-pink-300 transition cursor-pointer text-left flex justify-between items-center">
                <span>🎟️ Issue New Walk-in Token</span>
                <span className="text-[10px] bg-pink-900/40 px-2 py-0.5 rounded border border-pink-700/40">F2 Key</span>
              </button>
              <button className="w-full p-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-300 transition cursor-pointer text-left flex justify-between items-center">
                <span>📅 Book Appointment Slot</span>
                <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded border border-slate-700/30">F3 Key</span>
              </button>
            </div>
          </div>

          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
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