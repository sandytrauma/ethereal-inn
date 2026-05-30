// app/glam/(dashboard)/queue/page.tsx
import React from "react";
import { getSalonSession } from "@/lib/salon-token";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { salonQueueTokens } from "@/db/glam-schema";
import { eq, and, sql, gte, lte } from "drizzle-orm";
import QueueActionControls from "@/components/QueueActionControls"; 

export const dynamic = "force-dynamic";

export default async function LiveQueueSequencePage() {
  const session = await getSalonSession();
  if (!session) redirect("/glam/login?error=Session Expired");

  const tenantIdStr = String(session.tenantId);
  const outletIdStr = session.outletId ? String(session.outletId) : null;

  // =========================================================================
  // 📅 TIMEZONE PERIMETER ALIGNMENT (ISO MIDNIGHT BOUND ENVELOPE)
  // =========================================================================
  // Isolates the line view to prevent yesterday's open tickets from clashing today
  const todayLocalDateStr = new Date().toISOString().split("T")[0]; // Accurate local "YYYY-MM-DD"
  const startOfDay = new Date(`${todayLocalDateStr}T00:00:00.000Z`);
  const endOfDay = new Date(`${todayLocalDateStr}T23:59:59.999Z`);

  // Retrieve active walk-in tokens from your live database configuration layer
  const rawTokensList = outletIdStr
    ? await db
        .select()
        .from(salonQueueTokens)
        .where(
          and(
            eq(salonQueueTokens.tenantId, tenantIdStr),
            eq(salonQueueTokens.outletId, outletIdStr),
            sql`${salonQueueTokens.status} IN ('waiting', 'serving')`,
            // 🌟 THE PRODUCTION FIX: Force bounds strictly within today's operational layout
            gte(salonQueueTokens.createdAt, startOfDay),
            lte(salonQueueTokens.createdAt, endOfDay)
          )
        )
        .orderBy(salonQueueTokens.tokenNumber)
    : [];

  const servingTokens = rawTokensList.filter(t => t.status === "serving");
  const waitingTokens = rawTokensList.filter(t => t.status === "waiting");

  return (
    <div className="space-y-6 text-slate-100">
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
        <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl shadow-xl space-y-4">
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
        <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl shadow-xl space-y-4">
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
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-slate-500 font-bold text-xs select-none">#{index + 1}</span>
                    <div>
                      <span className="font-mono font-black text-amber-400 text-sm select-none">TKN-{String(token.tokenNumber).padStart(3, "0")}</span>
                      <span className="ml-3 font-semibold text-slate-300">{token.clientName || "Walk-In Guest"}</span>
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