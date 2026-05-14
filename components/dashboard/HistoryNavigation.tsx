"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft, Home, Building2 } from "lucide-react";

export default function HistoryNavigation() {
  return (
    <nav className="w-full max-w-7xl mx-auto px-4 pt-6 pb-2">
      <div className="flex items-center justify-between bg-white/5 backdrop-blur-xl border border-white/10 p-2 rounded-2xl md:rounded-full">
        
        {/* Back to Home Link */}
        <Link 
          href="/" 
          className="flex items-center gap-2 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-white/70 hover:text-amber-400 hover:bg-white/5 rounded-full transition-all group"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span>Back to Home</span>
        </Link>

        {/* Brand Identity / Quick Home Icon */}
        <div className="flex items-center gap-4 pr-2">
          <Link 
            href="/"
            className="p-2 text-white/50 hover:text-white transition-colors"
            title="Home"
          >
            <Home size={18} />
          </Link>
          
          {/* Your Property Context */}
          <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-white/10 text-amber-500 font-serif italic text-sm">
            <Building2 size={14} />
            <span>Etheral Inn Hospitality LLP</span>
          </div>
        </div>
      </div>
    </nav>
  );
}