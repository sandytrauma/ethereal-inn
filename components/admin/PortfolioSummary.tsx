import { db } from "@/db";
import { sql } from "drizzle-orm";
import React from "react";

// Define the interface for the breakdown rows
interface PropertyBreakdown {
  id: string;
  name: string;
  city: string;
  revenue: string;
}

export default async function PortfolioSummary() {
  try {
    // 🌟 ARCHITECTURAL FIX: Use fully schema-qualified SQL identifiers.
    // This bypasses Drizzle's object resolution and prevents 'syntax error'
    // by ensuring Postgres always receives a valid table and column name.
    
 const [revResult, unitResult, leadResult, taskResult, propertyBreakdown] = await Promise.all([
      db.execute(sql`SELECT coalesce(sum("total_collection"::numeric), 0) as "total" FROM "public"."financial_records"`),
      db.execute(sql`SELECT count(*) as "count" FROM "public"."properties"`),
      db.execute(sql`SELECT count(*) as "count" FROM "public"."partner_inquiries"`),
      db.execute(sql`SELECT count(*) as "count" FROM "public"."tasks" WHERE "status" != 'completed'`),
      db.execute(sql`
        SELECT p."id", p."name", p."city", coalesce(sum(f."total_collection"::numeric), 0) as "revenue" 
        FROM "public"."properties" p 
        LEFT JOIN "public"."financial_records" f ON p."id" = f."property_id" 
        GROUP BY p."id", p."name", p."city"
      `)
      
    ]);
    // Safely map results using .rows and explicit casting
    const summary = {
      revenue: (revResult.rows[0] as any)?.total || "0",
      units: (unitResult.rows[0] as any)?.count || 0,
      leads: (leadResult.rows[0] as any)?.count || 0,
      activeTasks: (taskResult.rows[0] as any)?.count || 0,
    };

    // Explicit mapping to satisfy TypeScript and data sanitization
    const breakdown: PropertyBreakdown[] = propertyBreakdown.rows.map((row: any) => ({
      id: String(row.id),
      name: String(row.name),
      city: String(row.city),
      revenue: String(row.revenue),
    }));

    return (
      <div className="space-y-8 w-full max-w-7xl mx-auto font-sans selection:bg-amber-400/30">
        {/* GLOBAL HUD */}
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

        {/* FLEET LEDGER */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {breakdown.length > 0 ? (
            breakdown.map((prop, idx) => (
              <div key={prop.id || idx} className="p-8 bg-zinc-900/40 rounded-[2.5rem] border border-white/5 flex justify-between items-center hover:border-[#c5a059]/30 transition-all backdrop-blur-sm group">
                <div>
                  <h3 className="text-xl font-serif italic text-white group-hover:text-[#c5a059] transition-colors">{prop.name}</h3>
                  <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mt-1">{prop.city}</p>
                </div>
                <div className="text-right">
                  <p className="text-[#c5a059] text-2xl font-bold font-mono">₹{Number(prop.revenue).toLocaleString("en-IN")}</p>
                  <p className="text-[9px] text-zinc-600 uppercase font-black tracking-tighter mt-0.5">Outcome Contributed</p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 py-16 text-center bg-zinc-900/20 border border-dashed border-white/5 rounded-[2.5rem]">
               <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">No Properties Configured</p>
            </div>
          )}
        </div>
      </div>
    );
  } catch (error: any) {
    console.error("Critical Failure in PortfolioSummary:", error);
    return (
      <div className="p-12 bg-zinc-950 rounded-[3rem] border border-red-500/20 text-center font-sans">
        <h3 className="text-red-500 font-black uppercase text-xs tracking-widest">Data Synchronization Disrupted</h3>
        <p className="text-zinc-500 text-[10px] mt-2 font-mono">{error.message}</p>
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