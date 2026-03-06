"use client";

import React, { useState, useActionState, useEffect } from "react";
import { loginUser } from "@/lib/actions/auth";
import { 
  Loader2, Lock, MessageCircle, MapPin, 
  X, ShieldCheck, ChevronLeft, ChevronRight, Camera
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=2000",
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=2000",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=2000"
];

const GALLERY_DATA = {
  Rooms: [
    "https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=800",
    "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=800"
  ],
  Amenities: [
    "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800",
    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=800"
  ],
  Dining: [
    "https://images.unsplash.com/photo-1550966841-3ee29648b3d0?q=80&w=800"
  ]
};

export default function LandingLoginPage() {
  const [showLogin, setShowLogin] = useState(false);
  const [currentHero, setCurrentHero] = useState(0);
  const [activeGalleryTab, setActiveGalleryTab] = useState<keyof typeof GALLERY_DATA>("Rooms");
  const [state, formAction, isPending] = useActionState(loginUser, null);

  // Auto-slide Hero
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHero((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 overflow-x-hidden font-sans">
      
      {/* SECTION 1: SLIDING HERO */}
      <section className="relative h-screen flex flex-col justify-center px-6 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.img 
            key={currentHero}
            src={HERO_IMAGES[currentHero]}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 0.4, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0 w-full h-full object-cover z-0"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-[#020617]/60 z-[1]" />

        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8">
          <motion.h1 
            initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="text-7xl md:text-9xl font-black tracking-tighter text-white"
          >
            Ethereal <span className="text-amber-400">Inn.</span>
          </motion.h1>
          <p className="max-w-2xl mx-auto text-slate-300 text-xl font-medium leading-relaxed">
            Chhatarpur's most exclusive boutique stay. Luxury rooms, curated dining, and unmatched tranquility.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <a href="https://wa.me/919315371613" className="group w-full sm:w-auto flex items-center justify-center gap-3 bg-emerald-500 text-slate-950 font-black px-12 py-6 rounded-full hover:bg-emerald-400 transition-all shadow-2xl shadow-emerald-500/20 active:scale-95">
              <MessageCircle size={24} className="group-hover:rotate-12 transition-transform" /> 
              Instant WhatsApp Booking
            </a>
            <button onClick={() => setShowLogin(true)} className="w-full sm:w-auto flex items-center justify-center gap-3 bg-white/5 backdrop-blur-xl border border-white/10 text-white font-bold px-10 py-6 rounded-full hover:bg-white/10 transition-all active:scale-95">
              <ShieldCheck size={20} /> Staff Access
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 2: TABBED GALLERY */}
      <section className="max-w-6xl mx-auto py-24 px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <h2 className="text-4xl font-black text-white flex items-center gap-3">
              <Camera className="text-amber-400" /> Explore the Inn
            </h2>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2">A visual journey through our property</p>
          </div>
          
          <div className="flex bg-slate-900/50 p-1.5 rounded-[2rem] border border-white/5 backdrop-blur-sm">
            {Object.keys(GALLERY_DATA).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveGalleryTab(tab as any)}
                className={`px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                  activeGalleryTab === tab ? 'bg-amber-400 text-slate-950' : 'text-slate-500 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {GALLERY_DATA[activeGalleryTab].map((img, idx) => (
              <motion.div
                key={img}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: idx * 0.1 }}
                className="relative aspect-[16/10] rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl group"
              >
                <img src={img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Inn Gallery" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* LOGIN MODAL (Unchanged Logic) */}
      <AnimatePresence>
        {showLogin && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-3xl">
            <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }} className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-[3rem] p-10 relative">
              <button onClick={() => setShowLogin(false)} className="absolute top-8 right-8 text-slate-500 hover:text-white"><X size={28} /></button>
              <div className="text-center mb-8 space-y-2">
                <div className="mx-auto w-16 h-16 bg-amber-400 rounded-2xl flex items-center justify-center shadow-2xl shadow-amber-400/20 mb-4"><Lock className="text-slate-950" size={32} /></div>
                <h3 className="text-2xl font-black text-white">Staff Login</h3>
                <p className="text-slate-500 text-[10px] uppercase tracking-widest font-black">Authorized Personnel Only</p>
              </div>
              <form action={formAction} className="space-y-4">
                <input name="email" type="email" placeholder="Email" className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 text-white outline-none focus:border-amber-400 transition-all" required />
                <input name="password" type="password" placeholder="Password" className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 text-white outline-none focus:border-amber-400 transition-all" required />
                {state?.error && <p className="text-rose-500 text-center text-xs font-bold bg-rose-500/10 py-3 rounded-xl">{state.error}</p>}
                <button disabled={isPending} className="w-full bg-amber-400 text-slate-950 font-black py-5 rounded-[1.5rem] shadow-xl shadow-amber-400/20 disabled:opacity-50 flex items-center justify-center gap-2">
                  {isPending ? <Loader2 className="animate-spin" /> : "Verify Identity"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}