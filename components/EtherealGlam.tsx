"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Sparkles, Scissors, Heart, MapPin, Instagram, Calendar, ArrowLeft, Zap } from 'lucide-react';
import DashboardBackground from './dashboard/DashboardBackground';

export default function EtherealGlam() {
  return (
    <div className="min-h-screen bg-transparent text-slate-200 font-sans selection:bg-rose-400 selection:text-white overflow-x-hidden relative">
      <DashboardBackground />
      
      <div className="absolute top-20 -left-10 w-64 h-64 bg-rose-500/10 blur-[100px] rounded-full animate-pulse" />
      <div className="absolute bottom-32 -right-10 w-80 h-80 bg-purple-500/05 blur-[120px] rounded-full" />

      {/* TOP NAVIGATION */}
      <nav className="fixed top-0 left-0 right-0 z-50 p-4 lg:p-6 bg-[#0a0a0a]/60 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/login" className="flex items-center gap-3 p-2 bg-white/5 rounded-full border border-white/10 group transition-all hover:bg-white/10">
            <div className="w-9 h-9 bg-amber-400 rounded-full flex items-center justify-center text-slate-950">
              <ArrowLeft size={18} strokeWidth={3} />
            </div>
            <div className="pr-2">
              <p className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-500 leading-none">Ethereal Inn Presents</p>
              <p className="text-[10px] font-bold text-white uppercase tracking-tighter mt-0.5">Hotel Portal</p>
            </div>
          </Link>
          <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center text-rose-400 border border-white/5">
             <Zap size={18} />
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-40">
        
        {/* HEADER */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl mb-6 shadow-2xl">
            <Sparkles size={14} className="text-rose-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-300">Opening Soon</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-serif font-bold italic text-white tracking-tighter uppercase leading-none">
            Ethereal <span className="text-rose-400">Glam</span>
          </h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.4em] mt-4">Luxury Indian Bridal & Couture</p>
        </motion.div>

        {/* HERO GRID: Fixed height alignment */}
        <div className="grid grid-cols-12 gap-4 lg:gap-6 md:h-[600px]">
          
          {/* MAIN BRIDAL PORTRAIT (Left) */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }}
            className="col-span-12 md:col-span-8 relative group rounded-[3rem] overflow-hidden border border-white/10 h-[400px] md:h-full bg-slate-900"
          >
            <img 
              src="https://images.unsplash.com/photo-1665960211264-5e0a7112bacd?q=80&w=1170&auto=format&fit=crop" 
              alt="Indian Bridal" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
            <div className="absolute bottom-10 left-10">
               <h2 className="text-white text-4xl font-serif italic font-bold">The Royal Bride</h2>
               <p className="text-rose-300 text-[10px] font-black uppercase tracking-widest mt-2">Gurugram's Luxury Makeover Destination</p>
            </div>
          </motion.div>

          {/* RIGHT COLUMN: Split 50/50 to avoid gaps */}
          <div className="col-span-12 md:col-span-4 flex flex-col gap-4 lg:gap-6 md:h-full">
            
            {/* COUTURE DETAIL (Top Right) */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }}
              className="relative h-[250px] md:h-1/2 rounded-[2.5rem] overflow-hidden border border-white/10 bg-slate-900 shadow-2xl"
            >
              <img 
                src="https://images.unsplash.com/photo-1756483510840-b0dda5f0dd0f?q=80&w=1110&auto=format&fit=crop" 
                alt="Indian Couture Detail" 
                className="w-full h-full object-cover"
              />
            </motion.div>

            {/* EXPERIENCE CARD (Bottom Right) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }}
              className="relative flex-grow md:h-1/2 rounded-[2.5rem] overflow-hidden border border-white/10 bg-white/5 backdrop-blur-3xl p-8 flex flex-col justify-center gap-4 transition-all hover:bg-white/10 shadow-2xl"
            >
               <div className="w-12 h-12 bg-rose-500/20 rounded-2xl flex items-center justify-center text-rose-400 shadow-xl shadow-rose-500/20">
                  <Heart size={24} />
               </div>
               <div>
                  <p className="text-white font-bold text-lg leading-tight">Signature Artistry</p>
                  <p className="text-slate-400 text-[11px] leading-relaxed mt-2 uppercase tracking-widest font-bold">
                    Bespoke Indian Couture & HD Bridal Glamour
                  </p>
               </div>
            </motion.div>
          </div>
        </div>

        {/* SERVICES */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
          <GlamCard icon={Scissors} label="Couture" />
          <GlamCard icon={Heart} label="Makeup" />
          <GlamCard icon={MapPin} label="Destination" />
          <div className="p-8 bg-white/5 backdrop-blur-2xl border border-white/5 rounded-[2rem] flex flex-col items-center justify-center transition-all hover:border-rose-500/30 group cursor-default">
             <p className="text-[12px] font-black text-rose-400 group-hover:scale-110 transition-all uppercase tracking-widest">2026</p>
             <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 mt-2">Launch Year</span>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="mt-24 pt-10 border-t border-white/5 text-center">
           <p className="text-[8px] uppercase tracking-[1em] font-black text-slate-700">A Venture of Ethereal Inn Hospitality LLP</p>
        </footer>
      </main>
    </div>
  );
}

function GlamCard({ icon: Icon, label }: { icon: any, label: string }) {
  return (
    <div className="p-8 bg-white/5 backdrop-blur-2xl border border-white/5 rounded-[2rem] flex flex-col items-center gap-4 transition-all hover:border-rose-500/30 group">
      <div className="p-3 bg-white/5 rounded-xl text-rose-400 group-hover:scale-110 transition-all">
        <Icon size={22} />
      </div>
      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-rose-300">{label}</span>
    </div>
  );
}