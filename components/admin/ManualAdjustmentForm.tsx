"use client";

import React, { useState } from "react";
import { manualAdjustment } from "@/lib/actions/finance"; // Import your new action
import { AlertCircle, CheckCircle2, Calendar } from "lucide-react";

export default function ManualAdjustmentForm({ propertyId }: { propertyId: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = Object.fromEntries(new FormData(e.currentTarget));
    
    const result = await manualAdjustment(formData, propertyId);
    
    if (result.success) {
      setMessage({ type: 'success', text: "Financial record adjusted successfully." });
    } else {
      setMessage({ type: 'error', text: result.error || "Failed to adjust." });
    }
    setLoading(false);
  }

  return (
    <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-xl max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6 text-amber-500">
        <Calendar size={20} />
        <h2 className="text-sm font-black uppercase tracking-widest">Back-Dated Adjustment</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* CRITICAL: Date Selection */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Select Missed Date</label>
          <input 
            type="date" 
            name="selectedDate" 
            required
            className="bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-amber-500 outline-none transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Cash Revenue</label>
            <input type="number" name="cashRevenue" placeholder="0" className="input-style" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase px-1">UPI Revenue</label>
            <input type="number" name="upiRevenue" placeholder="0" className="input-style" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Adjustment Notes</label>
          <textarea 
            name="notes" 
            placeholder="Why is this being added manually?" 
            className="bg-white/5 border border-white/10 rounded-xl p-3 text-white h-24"
          />
        </div>

        <button 
          disabled={loading}
          className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-black font-black uppercase text-[11px] tracking-[0.2em] rounded-xl transition-all disabled:opacity-50"
        >
          {loading ? "Processing..." : "Save Record"}
        </button>
      </form>

      {message && (
        <div className={`mt-4 p-4 rounded-xl flex items-center gap-3 text-xs font-bold ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
          {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}
    </div>
  );
}