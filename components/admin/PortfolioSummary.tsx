import { db } from "@/db";
import { properties } from "@/db/micro-schema";
import { financialRecords, inquiries, tasks } from "@/db/schema";
import { sql, eq } from "drizzle-orm";
import React from "react";

/**
 * PORTFOLIO SUMMARY: THE CONSOLIDATED OUTCOME
 * This component aggregates data from parent tables via propertyId.
 */
export default async function PortfolioSummary() {
  // 1. Fetch Global Stats with absolute safety
  const statsQuery = await db.select({
    revenue: sql<string>`coalesce(sum(${financialRecords.totalCollection}), '0')`,
    units: sql<number>`count(distinct ${properties.id})`,
    leads: sql<number>`count(distinct ${inquiries.id})`,
    activeTasks: sql<number>`count(distinct ${tasks.id}) filter (where ${tasks.status} != 'completed')`,
  })
  .from(properties)
  .leftJoin(financialRecords, eq(properties.id, financialRecords.propertyId))
  .leftJoin(inquiries, eq(properties.id, inquiries.propertyId))
  .leftJoin(tasks, eq(properties.id, tasks.propertyId));

  const summary = statsQuery[0];

  // 2. Fetch Property Breakdown for the fleet list
  const propertyBreakdown = await db.select({
    id: properties.id,
    name: properties.name,
    city: properties.city,
    revenue: sql<string>`coalesce(sum(${financialRecords.totalCollection}), '0')`,
  })
  .from(properties)
  .leftJoin(financialRecords, eq(properties.id, financialRecords.propertyId))
  .groupBy(properties.id, properties.name, properties.city);

  return (
    <div className="space-y-8 w-full max-w-7xl mx-auto">
      {/* GLOBAL HUD: THE TOTAL SUM */}
      <div className="p-12 bg-zinc-950 rounded-[3rem] border border-[#c5a059]/20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#c5a059]/5 blur-3xl rounded-full" />
        
        <h2 className="text-[#c5a059] text-[10px] font-black uppercase tracking-[0.5em] mb-12">
          Global Portfolio Outcome
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          <StatBox label="Total Revenue" value={`₹${Number(summary.revenue).toLocaleString()}`} />
          <StatBox label="Sanctuaries" value={String(summary.units)} />
          <StatBox label="Global Leads" value={String(summary.leads)} />
          <StatBox label="Active Tasks" value={String(summary.activeTasks)} />
        </div>
      </div>

      {/* PROPERTY BREAKDOWN: THE FLEET LEDGER */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {propertyBreakdown.map((prop) => (
          <div 
            key={prop.id} 
            className="p-8 bg-zinc-900/40 rounded-[2.5rem] border border-white/5 flex justify-between items-center hover:border-[#c5a059]/30 transition-all group"
          >
            <div>
              <h3 className="text-xl font-serif italic text-white group-hover:text-[#c5a059] transition-colors">
                {prop.name}
              </h3>
              <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mt-1">
                {prop.city}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[#c5a059] text-2xl font-bold font-mono">
                ₹{Number(prop.revenue).toLocaleString()}
              </p>
              <p className="text-[9px] text-zinc-600 uppercase font-black tracking-tighter">
                Outcome Contributed
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Internal Helper to prevent 'ReactNode' errors by ensuring values are strings
 */
function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest">{label}</p>
      <p className="text-4xl font-serif italic text-white">{value}</p>
    </div>
  );
}