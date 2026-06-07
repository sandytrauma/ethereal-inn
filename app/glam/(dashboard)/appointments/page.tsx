// app/glam/(dashboard)/appointments/page.tsx
import React from "react";
import { getSalonSession } from "@/lib/salon-token";
import { redirect } from "next/navigation";
import { headers } from "next/headers"; 
import Link from "next/link"; // 🌟 Added for client-side routing transitions
import { db } from "@/db";
import { salonAppointments, salonClients } from "@/db/glam-schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { getTodayDateRange } from "@/lib/date-utils";
import ReserveSlotModal from "@/components/ReserveSlotModal";

// 🌟 Mobile Ergonomic Navigation Icons
import { LayoutDashboard, CalendarDays, Users2, PackageCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AppointmentsManagementPage() {
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
  // CORE TIMELINE GRID ENGINE & DATA QUERIES
  // =========================================================================
  const { localDateStr, startOfDay, endOfDay } = getTodayDateRange();

  const dailyAppointments = await db
    .select({
      id: salonAppointments.id,
      tokenNumber: salonAppointments.tokenNumber,
      startTime: salonAppointments.startTime,
      status: salonAppointments.status,
      clientName: salonClients.name, 
    })
    .from(salonAppointments)
    .leftJoin(salonClients, eq(salonAppointments.clientId, salonClients.id))
    .where(
      and(
        eq(salonAppointments.tenantId, tenantIdStr),
        eq(salonAppointments.outletId, outletIdStr),
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

  // Generate business shifts hours for timeline slot mapping (9 AM to 8 PM)
  const operationalHours = Array.from({ length: 12 }, (_, i) => i + 9);

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
        <Link href="/glam/appointments" className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-xl text-xs font-bold shadow-md transition">
          <CalendarDays size={14} /> Appointments
        </Link>
        <Link href="/glam/queue" className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-xl text-xs font-semibold transition">
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
        <Link href="/glam/appointments" className="flex flex-col items-center justify-center gap-1 flex-1 text-pink-500 py-1">
          <CalendarDays size={20} strokeWidth={2.5} />
          <span className="text-[9px] font-black tracking-tight uppercase">Slots</span>
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

      {/* Title Matrix Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Appointments Matrix</h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage real-time digital booking lanes and chair distributions.</p>
        </div>

        <ReserveSlotModal
          clientsList={accessibleClients}
          operationalHours={operationalHours}
          targetDate={localDateStr}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Real-time Hours Runway Log Grid */}
        <div className="xl:col-span-3 bg-slate-900/40 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-500 border-b border-slate-800/60 pb-3 select-none">
            Today's Timeline Grid ({startOfDay.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })})
          </div>

          <div className="divide-y divide-slate-800/60 font-mono">
            {operationalHours.map((hour) => {
              const displayTime = `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? "PM" : "AM"}`;
              
              const slotsInHour = dailyAppointments.filter((app) => {
                const appHour = new Date(app.startTime).getHours();
                return appHour === hour;
              });

              return (
                <div key={hour} className="py-4 flex flex-col sm:flex-row sm:items-baseline sm:gap-4 group">
                  <div className="w-24 text-xs font-bold text-slate-500 group-hover:text-pink-400 transition select-none mb-2 sm:mb-0">
                    {displayTime}
                  </div>
                  <div className="flex-1 min-h-[44px] flex items-center w-full">
                    {slotsInHour.length === 0 ? (
                      <div className="text-[11px] text-slate-600 font-sans italic border border-dashed border-slate-800/40 w-full p-2.5 rounded-xl select-none">
                        No active bookings recorded for this window.
                      </div>
                    ) : (
                      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 font-sans">
                        {slotsInHour.map((slot) => (
                          <div key={slot.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs transition border-l-2 border-l-pink-500">
                            <div className="truncate pr-2">
                              <p className="font-bold text-slate-200 truncate">{slot.clientName || "Walk-In Customer"}</p>
                              <p className="text-[10px] font-mono text-slate-400 mt-0.5">{slot.tokenNumber}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold select-none flex-shrink-0 ${
                              slot.status === "completed" 
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : "bg-pink-500/10 text-pink-400 border border-pink-500/30 animate-pulse"
                            }`}>
                              {slot.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Capacity Telemetry Summary Panel */}
        <div className="space-y-4">
          <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-2xl shadow-xl space-y-4 select-none">
            <h3 className="text-xs uppercase font-bold tracking-widest text-slate-400">Capacity Telemetry</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2.5 bg-slate-950 border border-slate-800/60 rounded-xl">
                <span className="text-slate-500">Total Bookings Today</span>
                <span className="font-mono font-bold text-pink-400">{dailyAppointments.length} Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}