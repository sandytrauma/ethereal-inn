"use client";

import React, { useRef, useState, useEffect } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';
import Link from 'next/link';
import { 
  Sparkles, Scissors, Heart, MapPin, Instagram, 
  Facebook, ArrowLeft, Zap, Droplets, Wand2, Camera, ShieldCheck 
} from 'lucide-react';
import DashboardBackground from './dashboard/DashboardBackground';

export default function EtherealGlam() {
  const containerRef = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [isMobile, setIsMobile] = useState(false);

  // 3D Physics Springs for that "Flowing" Lag
  const mainX = useSpring(mouseX, { stiffness: 150, damping: 30 });
  const mainY = useSpring(mouseY, { stiffness: 150, damping: 30 });
  const trailX = useSpring(mouseX, { stiffness: 60, damping: 25 });
  const trailY = useSpring(mouseY, { stiffness: 60, damping: 25 });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    if (!isMobile) {
      window.addEventListener('mousemove', handleMouseMove);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', checkMobile);
    };
  }, [mouseX, mouseY, isMobile]);

  return (
    <div ref={containerRef} className={`min-h-screen bg-transparent text-slate-200 font-sans selection:bg-rose-400 selection:text-white overflow-x-hidden relative ${!isMobile ? 'cursor-none' : 'cursor-default'}`}>
      
      {/* --- FULL PAGE BACKGROUND (Visibility Adjusted) --- */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <img 
          src="https://images.unsplash.com/photo-1665960211264-5e0a7112bacd?q=80&w=1170&auto=format&fit=crop" 
          className="w-full h-full object-cover scale-105 blur-[2px] opacity-50 saturate-[0.9]" 
          alt="Ethereal Background" 
        />
        <div className="absolute inset-0 bg-[#050505]/70" />
      </div>

      <DashboardBackground />

      {/* --- 3D FLUID WATER TRAIL (Desktop Only) --- */}
      {!isMobile && (
        <>
          <motion.div 
            style={{ x: trailX, y: trailY, translateX: '-50%', translateY: '-50%' }}
            animate={{ 
              borderRadius: ["40% 60% 70% 30% / 40% 40% 60% 50%", "60% 40% 30% 70% / 60% 30% 70% 40%", "40% 60% 70% 30% / 40% 40% 60% 50%"] 
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            className="fixed z-[65] w-24 h-20 pointer-events-none bg-white/[0.02] backdrop-blur-[1px] border border-white/10 shadow-[inset_-5px_-5px_10px_rgba(255,255,255,0.1)]"
          />

          <motion.div 
            style={{ 
              x: mainX, y: mainY, translateX: '-50%', translateY: '-50%',
              backdropFilter: 'blur(2px) contrast(130%) brightness(115%) saturate(130%) scale(1.2)',
              WebkitBackdropFilter: 'blur(2px) contrast(130%) brightness(115%) saturate(130%) scale(1.2)',
            }}
            animate={{ 
              borderRadius: ["50% 50% 50% 50% / 50% 50% 50% 50%", "45% 55% 45% 55% / 55% 45% 55% 45%", "50% 50% 50% 50% / 50% 50% 50% 50%"],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="fixed z-[70] w-48 h-36 pointer-events-none border-[0.5px] border-white/40 bg-gradient-to-br from-white/[0.08] to-transparent shadow-[inset_-12px_-12px_25px_rgba(255,255,255,0.1),inset_12px_12px_25px_rgba(0,0,0,0.2),0_20px_50px_rgba(0,0,0,0.4)] before:content-[''] before:absolute before:top-3 before:left-12 before:w-16 before:h-10 before:bg-gradient-to-b before:from-white/40 before:to-transparent before:rounded-[50%] before:blur-[8px]"
          />
        </>
      )}

      {/* --- PAGE CONTENT --- */}
      <nav className="fixed top-0 left-0 right-0 z-[80] p-4 lg:p-6 bg-[#0a0a0a]/60 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/login" className="flex items-center gap-3 p-2 bg-white/5 rounded-full border border-white/10 group cursor-pointer z-[90] relative">
            <div className="w-9 h-9 bg-amber-400 rounded-full flex items-center justify-center text-slate-950">
              <ArrowLeft size={18} strokeWidth={3} />
            </div>
            <div className="pr-2">
              <p className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-500 leading-none">Ethereal Inn Presents</p>
              <p className="text-[10px] font-bold text-white uppercase tracking-tighter mt-0.5">Hospitality Portal</p>
            </div>
          </Link>
          <Zap size={18} className="text-rose-400 animate-pulse" />
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-40">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-serif font-bold italic text-white tracking-tighter uppercase leading-none drop-shadow-2xl">
            Ethereal <span className="text-rose-400">Glam</span>
          </h1> <span className='text-rose-600 font-bold leading-none drop-shadow-2xl tracking-[0.4rem]'>Opening Soon</span>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.4em] mt-4">Luxury Indian Bridal & Couture</p>
        </div>

        {/* HERO GRID */}
        <div className="grid grid-cols-12 gap-6 md:h-[600px]">
          <div className="col-span-12 md:col-span-8 relative rounded-[3rem] overflow-hidden border border-white/10 bg-zinc-900 group shadow-6xl">
            <img src="https://images.unsplash.com/photo-1665960211264-5e0a7112bacd?q=80&w=1170&auto=format&fit=crop" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Hero Bridal" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
            <div className="absolute bottom-10 left-10">
               <span className="px-3 py-1 bg-rose-500/20 border border-rose-500/40 rounded-full text-[9px] font-black uppercase tracking-widest text-rose-400 mb-2 inline-block">Signature Procedure</span>
               <h3 className="text-2xl font-bold text-white uppercase italic">Radiance Infusion HD</h3>
            </div>
          </div>

          <div className="col-span-12 md:col-span-4 flex flex-col gap-6">
            <div className="h-1/2 rounded-[2.5rem] overflow-hidden border border-white/10 bg-zinc-900 shadow-6xl">
              <img src="https://images.unsplash.com/photo-1756483510840-b0dda5f0dd0f?q=80&w=1110&auto=format&fit=crop" className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" alt="Couture Detail" />
            </div>
            <div className="flex-grow rounded-[2.5rem] bg-white/5 backdrop-blur-3xl border border-white/10 p-8 flex flex-col justify-between shadow-2xl">
              <div>
                <Heart className="text-rose-400 mb-4 animate-pulse" />
                <p className="text-white font-bold text-lg leading-tight">Artistry & <br/>Procedure</p>
              </div>
              <div className="flex gap-4">
                <Instagram size={20} className="text-rose-300 hover:text-white transition-colors cursor-pointer z-20" />
                <Facebook size={20} className="text-rose-300 hover:text-white transition-colors cursor-pointer z-20" />
              </div>
            </div>
          </div>
        </div>

        {/* --- FEATURED PROCEDURES MARKETING SECTION --- */}
        <div className="mt-24 mb-12">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
            <div>
              <h2 className="text-3xl font-serif italic text-white mb-2 underline decoration-rose-500/30 underline-offset-8">Signature Procedures</h2>
              <p className="text-[9px] uppercase tracking-[0.4em] text-slate-500 font-black">Elite standards for the modern bride</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ProcedureFeature 
              icon={Droplets} 
              title="Airbrush HD" 
              desc="Micro-atomized pigment procedure for sweat-proof, weightless velvet skin finish."
              imgSrc="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=600&auto=format&fit=crop"
            />
            <ProcedureFeature 
              icon={Wand2} 
              title="Dermal Radiance" 
              desc="Pre-makeup medical grade hydration procedures for an inner-glow aesthetic."
              imgSrc="https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=600&auto=format&fit=crop"
            />
            <ProcedureFeature 
              icon={ShieldCheck} 
              title="Elite Hygiene" 
              desc="International grade sanitization and premium brand procedures exclusively."
              imgSrc="https://images.unsplash.com/photo-1596755389378-c31d21fd1273?q=80&w=600&auto=format&fit=crop"
            />
          </div>
        </div>

        {/*SERVICE CARDS WITH ICONS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
          <GlamCard icon={Scissors} label="Bridal Couture" />
          <GlamCard icon={Sparkles} label="HD Artistry" />
          <GlamCard icon={Camera} label="Portfolios" />
          <div className="p-8 bg-white/5 backdrop-blur-2xl border border-white/5 rounded-[2rem] flex flex-col items-center justify-center transition-all hover:border-rose-500/30 group">
              <div className="flex gap-2 mb-2">
                <Instagram size={14} className="text-rose-400 opacity-50" />
                <Facebook size={14} className="text-rose-400 opacity-50" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Coming Soon</span>
          </div>
        </div>

        <footer className="mt-20 pt-10 border-t border-white/5 text-center opacity-40">
            <p className="text-[8px] uppercase tracking-[1em] font-black text-slate-700">A unit of Ethereal Inn Hospitality LLP</p>
        </footer>
      </main>
    </div>
  );
}

function ProcedureFeature({ icon: Icon, title, desc, imgSrc }: { icon: any, title: string, desc: string, imgSrc: string }) {
  return (
    <div className="relative p-8 overflow-hidden bg-zinc-900 border border-white/5 rounded-[2.5rem] transition-all hover:border-rose-500/20 group">
      {/* Background Image with Overlay */}
      <img 
        src={imgSrc} 
        alt={title} 
        className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-40 group-hover:scale-110 transition-all duration-700 pointer-events-none" 
      />
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-950/80 to-transparent" />
      
      {/* Content */}
      <div className="relative z-10">
        <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-400 mb-6 group-hover:scale-110 transition-transform duration-500">
          <Icon size={24} />
        </div>
        <h3 className="text-lg font-bold text-white mb-3 tracking-tight">{title}</h3>
        <p className="text-slate-400 text-xs leading-relaxed font-medium group-hover:text-slate-200 transition-colors">
          {desc}
        </p>
      </div>
    </div>
  );
}

function GlamCard({ icon: Icon, label }: { icon: any, label: string }) {
  return (
    <div className="p-8 bg-white/5 backdrop-blur-2xl border border-white/5 rounded-[2rem] flex flex-col items-center gap-4 transition-all hover:border-rose-500/30 group">
      <div className="p-3 bg-white/5 rounded-xl text-rose-400 group-hover:scale-110 transition-all duration-500">
        <Icon size={24} />
      </div>
      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-rose-300 transition-colors">
        {label}
      </span>
    </div>
  );
}