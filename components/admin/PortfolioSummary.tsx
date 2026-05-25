import { db } from "@/db";
import { properties } from "@/db/micro-schema";
import { financialRecords, inquiries, tasks } from "@/db/schema";
import { sql, eq, ne, and } from "drizzle-orm";
import React from "react";

export default async function PortfolioSummary() {
  try {
    // =========================================================================
    // 🌟 THE ARCHITECTURAL FIX: ISOLATED PARALLEL SUBQUERIES
    // Breaks apart chained leftJoins to eliminate Cartesian Product multiplication!
    // =========================================================================
    const [revResult, unitResult, leadResult, taskResult, propertyBreakdown] = await Promise.all([
      // 1. Compile Total Revenue Matrix cleanly
      db.select({
        total: sql<string>`coalesce(sum(cast(${financialRecords.totalCollection} as numeric)), '0')`
      }).from(financialRecords),

      // 2. Count Active Asset Locations
      db.select({
        count: sql<number>`count(${properties.id})`
      }).from(properties),

      // 3. Count Global Guest Leads Context
      db.select({
        count: sql<number>`count(${inquiries.id})`
      }).from(inquiries),

      // 4. Count Global Pending Tasks
      db.select({
        count: sql<number>`count(${tasks.id})`
      }).from(tasks).where(ne(tasks.status, "completed")),

      // 5. Build Pristine Fleet Ledger (Group-by is safe here as there is only ONE leftJoin)
      db.select({
        id: properties.id,
        name: properties.name,
        city: properties.city,
        revenue: sql<string>`coalesce(sum(cast(${financialRecords.totalCollection} as numeric)), '0')`,
      })
      .from(properties)
      .leftJoin(financialRecords, eq(properties.id, financialRecords.propertyId))
      .groupBy(properties.id, properties.name, properties.city)
    ]);

    const summary = {
      revenue: revResult[0]?.total || "0",
      units: unitResult[0]?.count || 0,
      leads: leadResult[0]?.count || 0,
      activeTasks: taskResult[0]?.count || 0,
    };

    return (
      <div className="space-y-8 w-full max-w-7xl mx-auto font-sans selection:bg-amber-400/30">
        {/* GLOBAL HUD: THE TOTAL SUM */}
        <div className="p-12 bg-zinc-950 rounded-[3rem] border border-[#c5a059]/20 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#c5a059]/5 blur-3xl rounded-full pointer-events-none" />
          
          <h2 className="text-[#c5a059] text-[10px] font-black uppercase tracking-[0.5em] mb-12">
            Global Portfolio Outcome
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
            <StatBox label="Total Revenue" value={`₹${Number(summary.revenue).toLocaleString("en-IN")}`} />
            <StatBox label="Sanctuaries" value={String(summary.units)} />
            <StatBox label="Global Leads" value={String(summary.leads)} />
            <StatBox label="Active Tasks" value={String(summary.activeTasks)} />
          </div>
        </div>

        {/* PROPERTY BREAKDOWN: THE FLEET LEDGER */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {propertyBreakdown && propertyBreakdown.length > 0 ? (
            propertyBreakdown.map((prop, idx) => {
              const safePropKey = prop.id ? `fleet-prop-${prop.id}` : `fleet-idx-${idx}`;
              
              return (
                <div 
                  key={safePropKey} 
                  className="p-8 bg-zinc-900/40 rounded-[2.5rem] border border-white/5 flex justify-between items-center hover:border-[#c5a059]/30 transition-all group backdrop-blur-sm"
                >
                  <div>
                    <h3 className="text-xl font-serif italic text-white group-hover:text-[#c5a059] transition-colors">
                      {prop.name || "Isolated Partition"}
                    </h3>
                    <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mt-1">
                      {prop.city || "Delhi"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#c5a059] text-2xl font-bold font-mono">
                      ₹{Number(prop.revenue).toLocaleString("en-IN")}
                    </p>
                    <p className="text-[9px] text-zinc-600 uppercase font-black tracking-tighter mt-0.5">
                      Outcome Contributed
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-2 py-16 text-center bg-zinc-900/20 border border-dashed border-white/5 rounded-[2.5rem]">
               <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">No Properties Configured</p>
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error("Critical Failure in PortfolioSummary Rendering Engine:", error);
    return (
      <div className="p-12 bg-zinc-950 rounded-[3rem] border border-red-500/20 text-center font-sans">
        <h3 className="text-red-500 font-black uppercase text-xs tracking-widest">Data Synchronization Disrupted</h3>
        <p className="text-zinc-500 text-[11px] font-medium mt-2">Failed to compile cross-tenant system metrics totals charts.</p>
      </div>
    );
  }
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1 text-left">
      <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest">{label}</p>
      <p className="text-4xl font-serif italic text-white tracking-tight">{value}</p>
    </div>
  );
}