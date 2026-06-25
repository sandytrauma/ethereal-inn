// app/(admin)/pms-admin/onboarding/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { decrypt } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { partnerInquiries, properties } from "@/db/micro-schema";
import { desc, eq, not, sql } from "drizzle-orm";
import TenantCreationForm from "@/components/admin/TenantCreationForm";
import TenantDeleteButton from "@/components/admin/TenantDeleteButton";
import InquiriesTableClient from "./InquiriesTableClient";
import Link from "next/link";
import { ArrowLeft, Zap } from "lucide-react";
import Footer from "@/components/layout/Footer";

export default async function AdminOnboardingPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  const session = token ? await decrypt(token).catch(() => null) : null;

  const isMasterAdmin = session && Number((session as any).userId || (session as any).id) === 1;

  if (!session || !isMasterAdmin) {
    redirect("/"); 
  }

  // =========================================================================
  // 🌟 ARCHITECTURAL FIX: Explicitly qualified count and group by
  // Using explicit strings in sql`` prevents the syntax error 42601
  // =========================================================================
  const activeTenants = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      allocatedBranches: sql<number>`count("properties"."id")`,
    })
    .from(users)
    .leftJoin(properties, eq(users.id, properties.ownerId))
    .where(not(eq(users.id, 1)))
    .groupBy(users.id, users.name, users.email);

  const leads = await db
    .select()
    .from(partnerInquiries)
    .orderBy(desc(partnerInquiries.loggedAt));

  return (
    <main className="min-h-screen bg-slate-950 p-6 md:p-12 flex flex-col items-center gap-8 font-sans selection:bg-amber-400 selection:text-black">

      <nav className="fixed top-0 left-0 right-0 z-[80] p-4 lg:p-6 bg-[#0a0a0a]/60 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 p-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 group cursor-pointer transition-all duration-300 z-[90] relative">
            <div className="w-9 h-9 bg-amber-400 rounded-full flex items-center justify-center text-slate-950 transform group-hover:-translate-x-0.5 transition-transform">
              <ArrowLeft size={18} strokeWidth={3} />
            </div>
            <div className="pr-3">
              <p className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-500 leading-none">Ethereal Inn SuperAdmin</p>
              <p className="text-[10px] font-bold text-white uppercase tracking-tighter mt-0.5 group-hover:text-pink-400 transition-colors">Return to Operational Dashboard</p>
            </div>
          </Link>

          <Zap size={18} className="text-rose-400 animate-pulse" />
        </div>
      </nav>

      <div className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden mt-24">
        <div className="mb-6 select-none border-b border-white/5 pb-4">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-pink-400 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-ping" />
            Incoming Hotelier Onboarding Inquiries
          </h2>
          <p className="text-[10px] text-slate-500 font-medium mt-1">
            Review corporate application footprints, key properties sizes, and cycle pipeline stage states.
          </p>
        </div>

        <InquiriesTableClient initialLeads={leads} />
      </div>

      {/* 1. Onboarding Provision Form */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black text-white uppercase tracking-tight italic">Provision New Tenant</h1>
          <p className="text-amber-400 text-[9px] uppercase tracking-[0.3em] font-black mt-1.5 flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
            Internal Super-Admin Provisioning
          </p>
        </div>
        <TenantCreationForm />
      </div>

      {/* 2. Live Monitoring Sandbox & Deletion Controller */}
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6 border-b border-white/5 pb-4">
          Active Cluster Sandbox Nodes
        </h2>
        
        {activeTenants.length === 0 ? (
          <p className="text-slate-600 text-xs font-medium italic py-4">No active external partner clusters deployed.</p>
        ) : (
          <div className="divide-y divide-slate-800/40">
            {activeTenants.map((tenant) => (
              <div key={`tenant-node-${tenant.id}`} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4 group">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-black text-white leading-none group-hover:text-amber-400 transition-colors uppercase tracking-tight">
                    {tenant.name}
                  </h3>
                  <p className="text-slate-500 text-[11px] font-medium mt-1.5 truncate">{tenant.email}</p>
                  
                  <div className="flex items-center gap-3 mt-3">
                    <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                      Number(tenant.allocatedBranches) > 0 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {tenant.allocatedBranches} Active Branches
                    </span>
                    <span className="text-[8px] font-mono text-slate-600 uppercase">Node ID: #{tenant.id}</span>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <TenantDeleteButton tenantId={tenant.id} branchCount={Number(tenant.allocatedBranches)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer/>
    </main>
  );
}