import React from "react";
import { getPartnerInquiriesList } from "@/lib/actions/partner-inquiry";
import InquiriesTableClient from "@/app/(admin)/pms-admin/onboarding/InquiriesTableClient";
import { Activity, Layers, Terminal } from "lucide-react";

export default async function SuperadminInquiryPanel() {
 const result = await getPartnerInquiriesList();
const leads = result.success ? result.data || [] : []; 
const pendingLeads = leads.filter((l) => l.status === "pending").length;
const totalKeys = leads.reduce((sum, l) => sum + l.totalRooms, 0);

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-150">
      
      {/* Aggregated Analytics Summaries Ribbon */}
      <div className="grid sm:grid-cols-3 gap-5 max-w-4xl mx-auto select-none">
        <div className="p-5 bg-slate-900/30 border border-slate-800 rounded-2xl flex items-center justify-between backdrop-blur-sm">
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Prospectus Logged</span>
            <h3 className="text-xl font-black text-slate-100 font-mono mt-1">{leads.length}</h3>
          </div>
          <div className="p-2 bg-slate-950 border border-slate-800 text-pink-400 rounded-xl">
            <Layers size={14} />
          </div>
        </div>

        <div className="p-5 bg-slate-900/30 border border-slate-800 rounded-2xl flex items-center justify-between backdrop-blur-sm">
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Pending Hoteliers</span>
            <h3 className="text-xl font-black text-amber-400 font-mono mt-1">{pendingLeads}</h3>
          </div>
          <div className="p-2 bg-slate-950 border border-slate-800 text-amber-400 rounded-xl">
            <Activity size={14} />
          </div>
        </div>

        <div className="p-5 bg-slate-900/30 border border-slate-800 rounded-2xl flex items-center justify-between backdrop-blur-sm">
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Accumulated Rooms</span>
            <h3 className="text-xl font-black text-blue-400 font-mono mt-1">{totalKeys.toLocaleString("en-IN")}</h3>
          </div>
          <div className="p-2 bg-slate-950 border border-slate-800 text-blue-400 rounded-xl">
            <Terminal size={14} />
          </div>
        </div>
      </div>

      {/* Main Inquiries Interactive Grid Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden w-full">
        <div className="mb-6 select-none border-b border-white/5 pb-4">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
            Inquiries Ledger Matrix
          </h2>
          <p className="text-[10px] text-slate-500 font-medium mt-1">
            Qualify corporate hotel profiles and cycle workflow progression states.
          </p>
        </div>

        <InquiriesTableClient initialLeads={leads} />
      </div>

    </div>
  );
}