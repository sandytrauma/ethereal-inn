"use client";

import React, { useEffect, useState } from "react";
import { ShieldCheck, Globe, Clock } from "lucide-react";

export default function Footer() {
  const [time, setTime] = useState<string>("");

  // Live clock for operational tracking
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-IN", { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit', 
        hour12: true 
      }));
    };
    
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="w-full border-t border-slate-200/60 bg-blue/50 backdrop-blur-md py-6 px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        
        {/* Branding & Status */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              System Online
            </span>
          </div>
          <div className="h-4 w-[1px] bg-slate-200" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 italic">
            Ethereal Core v1.0.6
          </p>
        </div>

        {/* Live Metrics */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 text-slate-500">
            <Clock size={14} className="text-blue-500" />
            <span className="text-[11px] font-mono font-bold tracking-tighter">
              {time || "00:00:00 AM"}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-slate-500">
            <ShieldCheck size={14} className="text-indigo-500" />
            <span className="text-[10px] font-black uppercase tracking-tight">
              Encrypted Session
            </span>
          </div>
        </div>

        {/* Ownership */}
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
            © 2026 Etherealinn Hospitality LLP
          </p>
          <p className="text-[9px] font-medium text-slate-400 uppercase tracking-tighter">
            Managed by Etherealinn Hospitality LLP
          </p>
        </div>
      </div>
    </footer>
  );
}