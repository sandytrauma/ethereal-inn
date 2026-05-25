"use client";

import React, { useState } from "react";
import { manualAdjustment } from "@/lib/actions/finance"; 
import { AlertCircle, CheckCircle2, Calendar, Loader2 } from "lucide-react";
import { AnimatePresence } from "framer-motion";

export default function ManualAdjustmentForm({ propertyId }: { propertyId: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const formEl = e.currentTarget;
    const rawFormData = new FormData(formEl);
    
    // Parse isolated string numbers defensively
    const cash = Number(rawFormData.get("cashRevenue") || 0);
    const upi = Number(rawFormData.get("upiRevenue") || 0);
    
    // =========================================================================
    // 🌟 THE ARCHITECTURAL FIX: INJECT CALCULATED ATTRIBUTES
    // Compute totals client-side to satisfy backend schema contracts explicitly.
    // =========================================================================
    const totalCollection = cash + upi;
    const netCash = totalCollection; // Adjust formulas if you introduce petty expenses here later

    const payload = {
      selectedDate: String(rawFormData.get("selectedDate")),
      cashRevenue: cash.toString(),
      upiRevenue: upi.toString(),
      notes: String(rawFormData.get("notes") || ""),
      totalCollection: totalCollection.toString(),
      netCash: netCash.toString(),
    };

    try {
      const result = await manualAdjustment(payload, propertyId);
      
      if (result.success) {
        setMessage({ type: 'success', text: "Historical financial record adjusted successfully." });
        formEl.reset(); // Wipe inputs cleanly on successful sync pass
      } else {
        setMessage({ type: 'error', text: result.error || "Failed to finalize back-dated adjustment." });
      }
    } catch (err) {
      console.error("Adjustment form submission failure:", err);
      setMessage({ type: 'error', text: "Internal transmission layer error intercepted." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-slate-900/40 border border-white/5 p-6 md:p-8 rounded-[2.5rem] backdrop-blur-xl max-w-2xl mx-auto shadow-2xl relative font-sans selection:bg-amber-400 selection:text-black">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent" />
      
      <div className="flex items-center gap-3 mb-6 text-amber-400">
        <Calendar size={18} />
        <h2 className="text-xs font-black uppercase tracking-[0.25em] italic">Back-Dated Adjustment Ledger</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Date Selection */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Select Missed Date</label>
          <input 
            type="date" 
            name="selectedDate" 
            required
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white font-bold focus:border-amber-500 outline-none transition-all shadow-inner text-sm cursor-pointer"
          />
        </div>

        {/* Input Revenue Blocks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Cash Revenue</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">₹</span>
              <input 
                type="number" 
                name="cashRevenue" 
                placeholder="0" 
                min="0"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 pl-8 focus:border-amber-500 outline-none text-white font-bold transition-all placeholder:text-slate-800 text-sm"
              />
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">UPI Revenue</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">₹</span>
              <input 
                type="number" 
                name="upiRevenue" 
                placeholder="0" 
                min="0"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 pl-8 focus:border-amber-500 outline-none text-white font-bold transition-all placeholder:text-slate-800 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Adjustment Notes */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Adjustment Audit Notes</label>
          <textarea 
            name="notes" 
            required
            placeholder="Please detail the specific reason for this manual audit trail injection..." 
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 focus:border-amber-500 outline-none text-sm text-white h-24 resize-none transition-all placeholder:text-slate-800 font-medium"
          />
        </div>

        {/* Form Submission Button */}
        <button 
          disabled={loading}
          className="w-full mt-2 py-5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black uppercase text-[11px] tracking-[0.25em] rounded-2xl transition-all disabled:opacity-40 flex items-center justify-center gap-2 active:scale-[0.98] shadow-xl shadow-amber-400/10 cursor-pointer"
        >
          {loading ? (
            <Loader2 className="animate-spin h-4 w-4" />
          ) : (
            "Commit Audit Adjustment Entry"
          )}
        </button>
      </form>

      {/* Real-time Toast Notifications Status Panel */}
      <AnimatePresence>
        {message && (
          <div className={`mt-5 p-4 rounded-xl flex items-start gap-3 text-xs font-bold uppercase tracking-wide border ${
            message.type === 'success' 
              ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400' 
              : 'bg-rose-500/5 border-rose-500/10 text-rose-400'
          }`}>
            <div className="mt-0.5 flex-shrink-0">
              {message.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            </div>
            <p className="leading-relaxed font-black">{message.text}</p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}