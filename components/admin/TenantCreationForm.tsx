"use client";

import React, { useState, useTransition } from "react";
import { registerNewTenant } from "@/lib/actions/saas-actions";
import { useRouter } from "next/navigation";
import { Loader2, Plus, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function TenantCreationForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus(null);
    
    // 🌟 THE FIX: Capture a solid, direct DOM reference to the HTML element 
    // before stepping inside any async server action threads!
    const activeFormEl = e.currentTarget;
    const formData = new FormData(activeFormEl);

    startTransition(async () => {
      const res = await registerNewTenant(formData);
      
      if (res.success) {
        setStatus({ success: true, message: "Tenant business profile initialized successfully!" });
        
        // Safely reference the captured DOM element node wrapper without event recycling exceptions
        activeFormEl.reset(); 
        
        // 🌟 UX FIX: Tell Next.js to cleanly sync its server components directory layout caches
        router.refresh(); 
      } else {
        setStatus({ success: false, message: res.error || "Provisioning transaction rejected." });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 font-sans selection:bg-amber-400 selection:text-black">
      <AnimatePresence mode="wait">
        {status && (
          <div className={`text-[10px] font-black uppercase tracking-wider p-4 rounded-xl border flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200 ${
            status.success 
              ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-400" 
              : "bg-red-500/5 border-red-500/10 text-red-400"
          }`}>
            <div className="mt-0.5 flex-shrink-0">
              {status.success ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
            </div>
            <p className="leading-relaxed font-black">{status.message}</p>
          </div>
        )}
      </AnimatePresence>

      <div>
        <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 ml-1">Partner / Brand Name</label>
        <input 
          type="text" 
          name="name" 
          required 
          disabled={isPending}
          placeholder="e.g. Apex Luxury Hotels" 
          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-xs text-white outline-none focus:border-amber-400 font-bold transition-all disabled:opacity-40 placeholder:text-slate-800" 
        />
      </div>

      <div>
        <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 ml-1">Admin Login Email</label>
        <input 
          type="email" 
          name="email" 
          required 
          disabled={isPending}
          placeholder="partner@ethereal.inn" 
          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-xs text-white outline-none focus:border-amber-400 font-bold transition-all disabled:opacity-40 placeholder:text-slate-800" 
        />
      </div>

      <div>
        <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 ml-1">Temporary Account Password</label>
        <input 
          type="password" 
          name="password" 
          required 
          disabled={isPending}
          placeholder="••••••••••••" 
          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-xs text-white outline-none focus:border-amber-400 font-bold transition-all disabled:opacity-40 placeholder:text-slate-800" 
        />
      </div>

      <button 
        type="submit" 
        disabled={isPending} 
        className="w-full mt-4 bg-amber-400 hover:bg-amber-300 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black text-[10px] uppercase tracking-[0.2em] py-5 rounded-xl transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
      >
        {isPending ? (
          <Loader2 className="animate-spin text-slate-950" size={16} />
        ) : (
          <>
            <Plus size={14} strokeWidth={3} /> 
            Register New Tenant Account
          </>
        )}
      </button>
    </form>
  );
}