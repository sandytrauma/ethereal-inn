"use client";

import React, { useTransition } from "react";
import { updateInquiryStatus } from "@/lib/actions/partner-inquiry";
import { useRouter } from "next/navigation";
import { AlertTriangle, Mail, Phone, Calendar, ArrowRightLeft } from "lucide-react";

interface Lead {
  id: number;
  hotelName: string;
  ownerName: string;
  email: string;
  phone: string;
  totalRooms: number;
  message: string | null;
  status: string;
  loggedAt: Date | string;
}

export default function InquiriesTableClient({ initialLeads }: { initialLeads: Lead[] }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleStatusCycle = async (leadId: number, currentStatus: string) => {
    // Strict pipeline step loop state machine sequence path configuration:
    // pending -> reviewing -> contacted -> approved -> back to pending
    let nextStatus: "pending" | "reviewing" | "contacted" | "approved" = "reviewing";
    
    if (currentStatus === "reviewing") nextStatus = "contacted";
    else if (currentStatus === "contacted") nextStatus = "approved";
    else if (currentStatus === "approved") nextStatus = "pending";

    startTransition(async () => {
      const result = await updateInquiryStatus(leadId, nextStatus);
      if (result.success) {
        router.refresh();
      } else {
        console.error("❌ Pipeline status cycle aborted:", result.error);
      }
    });
  };

  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "contacted":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "reviewing":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "pending":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20"; // 🌟 ADDED: High-visibility entry state
      default:
        return "bg-slate-800/40 text-slate-400 border-slate-700/60";
    }
  };

  if (!initialLeads || initialLeads.length === 0) {
    return (
      <div className="text-center py-12 text-xs text-slate-500 border border-slate-800/40 bg-slate-950/20 rounded-2xl flex flex-col items-center justify-center gap-2 select-none">
        <AlertTriangle size={18} className="text-slate-600 animate-pulse" />
        <span className="italic font-medium">No partner onboarding inquiries have been logged yet.</span>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-800/60 bg-slate-950/30">
      <table className="w-full border-collapse text-left min-w-[900px] text-xs font-medium text-slate-300">
        <thead>
          <tr className="border-b border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-900/20 select-none">
            <th className="px-6 py-4">Property / Hotel Name</th>
            <th className="px-4 py-4">Owner Name</th>
            <th className="px-4 py-4">Contact Metrics</th>
            <th className="px-4 py-4 text-center w-24">Rooms</th>
            <th className="px-6 py-4 max-w-xs">Prospectus Message</th>
            <th className="px-6 py-4 text-center w-32">Status Cycle</th>
            <th className="px-6 py-4 text-right w-28">Logged At</th>
          </tr>
        </thead>
        <tbody className={`divide-y divide-slate-800/40 transition-opacity duration-200 ${isPending ? "opacity-60" : "opacity-100"}`}>
          {initialLeads.map((lead) => (
            <tr key={`inquiry-row-${lead.id}`} className="hover:bg-slate-900/10 transition-colors duration-100 group">
              
              {/* Hotel Corporate Identifier Column */}
              <td className="px-6 py-4 font-black text-white uppercase tracking-tight group-hover:text-pink-400 transition-colors">
                {lead.hotelName}
              </td>
              
              {/* Lead Representative Identity Column */}
              <td className="px-4 py-4 text-slate-200 font-semibold">
                {lead.ownerName}
              </td>
              
              {/* Communication Routing Information Metrics Panel */}
              <td className="px-4 py-4 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                  <Mail size={11} className="text-slate-600 shrink-0" />
                  <span>{lead.email}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                  <Phone size={11} className="text-slate-600 shrink-0" />
                  <span>{lead.phone}</span>
                </div>
              </td>

              {/* Live Room Count Key Volume Metrics */}
              <td className="px-4 py-4 font-mono font-black text-center text-slate-100 bg-slate-900/10">
                {lead.totalRooms}
              </td>

              {/* Dynamic Note String Container (XSS Protected) */}
              <td className="px-6 py-4 text-slate-400 text-[11px] leading-relaxed max-w-xs whitespace-pre-wrap break-words font-normal">
                {lead.message ? (
                  lead.message
                ) : (
                  <span className="text-slate-600 italic">No custom parameters provided.</span>
                )}
              </td>

              {/* Interactive Status Switcher State Node Button */}
              <td className="px-6 py-4 text-center">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleStatusCycle(lead.id, lead.status)}
                  className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border flex items-center justify-center gap-1.5 mx-auto select-none transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 cursor-pointer ${getStatusBadgeStyles(lead.status)}`}
                  title="Click to cycle dashboard progression state loops"
                >
                  <span>{lead.status}</span>
                  <ArrowRightLeft size={10} className="text-slate-500 group-hover:text-slate-400 pointer-events-none" />
                </button>
              </td>

              {/* Structural Logged Timestamp Field */}
              <td className="px-6 py-4 text-right font-mono text-slate-500 text-[11px] select-none">
                <div className="flex items-center justify-end gap-1">
                  <Calendar size={11} className="text-slate-600" />
                  <span>
                    {new Date(lead.loggedAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric"
                    })}
                  </span>
                </div>
              </td>

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}