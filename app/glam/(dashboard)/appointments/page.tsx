// app/glam/(dashboard)/appointments/page.tsx
import React from "react";
import { getSalonSession } from "@/lib/salon-token";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { salonAppointments, salonClients } from "@/db/glam-schema";
import { eq, and, gte, lte } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function AppointmentsManagementPage() {
  const session = await getSalonSession();
  if (!session) redirect("/glam/login?error=Session Expired");

  const tenantIdStr = String(session.tenantId);
  const outletIdStr = session.outletId ? String(session.outletId) : null;

  if (!outletIdStr) {
    redirect("/glam/login?error=Invalid physical branch anchor assignment.");
  }

  // Track today's full window boundary definitions
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  // 🌟 THE PRODUCTION FIX: Perform a flat join query to fetch appointment telemetry
  // This avoids invoking complex relation trees that break runtime execution compilation lines.
  const dailyAppointments = await db
    .select({
      id: salonAppointments.id,
      tokenNumber: salonAppointments.tokenNumber,
      startTime: salonAppointments.startTime,
      status: salonAppointments.status,
      clientName: salonClients.name, // Safely pulls structural profile attributes from database records
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

  // Generate business shifts hours for timeline slot mapping (9 AM to 8 PM)
  const operationalHours = Array.from({ length: 12 }, (_, i) => i + 9);

  return (
    <div className="space-y-6 text-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Appointments Matrix</h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage real-time digital booking lanes and chair distributions.</p>
        </div>
        <button className="px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition hover:opacity-90 cursor-pointer">
          + Reserve Time Slot
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Real-time Hours Runway Log Grid */}
        <div className="xl:col-span-3 bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-500 border-b border-slate-800/60 pb-3">
            Today's Timeline Grid ({startOfDay.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })})
          </div>

          <div className="divide-y divide-slate-800/60 font-mono">
            {operationalHours.map((hour) => {
              const displayTime = `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? "PM" : "AM"}`;
              
              // Filter database rows that fall inside this specific hour bucket layer safely
              const slotsInHour = dailyAppointments.filter((app) => {
                const appHour = new Date(app.startTime).getHours();
                return appHour === hour;
              });

              return (
                <div key={hour} className="py-4 flex flex-col sm:flex-row sm:items-center gap-4 group">
                  <div className="w-24 text-xs font-bold text-slate-500 group-hover:text-pink-400 transition">
                    {displayTime}
                  </div>
                  <div className="flex-1 min-h-[44px] flex items-center">
                    {slotsInHour.length === 0 ? (
                      <div className="text-[11px] text-slate-600 font-sans italic border border-dashed border-slate-800/40 w-full p-2.5 rounded-xl">
                        No active bookings recorded for this window.
                      </div>
                    ) : (
                      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 font-sans">
                        {slotsInHour.map((slot) => (
                          <div key={slot.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs transition border-l-2 border-l-pink-500">
                            <div>
                              <p className="font-bold text-slate-200">{slot.clientName || "Walk-In Customer"}</p>
                              <p className="text-[10px] font-mono text-slate-400 mt-0.5">{slot.tokenNumber}</p>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold bg-pink-950/40 border border-pink-800/40 text-pink-400">
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

        {/* Dynamic Summary Panel */}
        <div className="space-y-4">
          <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-2xl shadow-xl space-y-4">
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