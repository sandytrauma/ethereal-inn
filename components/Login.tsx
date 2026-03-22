"use client";

import React, { useState, useActionState, useEffect, useTransition } from "react";
import { loginUser } from "@/lib/actions/auth";
import { createInquiryAction } from "@/lib/actions/inquiry";
import {
  Loader2,
  MessageCircle,
  MapPin,
  X,
  ShieldCheck,
  Camera,
  Star,
  ExternalLink,
  CheckCircle2,
  ChefHat,
  UtensilsCrossed,
  LayoutDashboard,
  ArrowRight,
  Users,
  Utensils,
  BedDouble,
  Target,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Script from "next/script";
import { getGoogleReviews } from "@/lib/actions/reviews";

// --- CONFIGURATION ---
const GA_MEASUREMENT_ID = "G-XXXXXXXXXX";
const POS_APP_URL = "https://pos-cloud-jade.vercel.app/"; 

interface Review {
  author_name: string;
  rating: number;
  relative_time_description: string;
  text: string;
  profile_photo_url: string;
}

const MOCK_REVIEWS: Review[] = [
  {
    author_name: "Aditya Sharma",
    rating: 5,
    relative_time_description: "2 weeks ago",
    text: "The most serene stay in Chhatarpur. The attention to detail in the room decor is unmatched.",
    profile_photo_url: "https://i.pravatar.cc/150?u=aditya",
  },
  {
    author_name: "Sarah Jenkins",
    rating: 5,
    relative_time_description: "1 month ago",
    text: "Ethereal Inn is a hidden gem. Urban Ambrosia provides the best cloud kitchen experience in Delhi.",
    profile_photo_url: "https://i.pravatar.cc/150?u=sarah",
  },
  {
    author_name: "Vikram Malhotra",
    rating: 5,
    relative_time_description: "3 days ago",
    text: "Exquisite dining experience and ultra-comfortable beds. Highly recommended.",
    profile_photo_url: "https://i.pravatar.cc/150?u=vikram",
  },
];

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=2000",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=2000",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=2000",
];

const GALLERY_DATA = {
  Rooms: [
    "https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=800",
    "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=800",
  ],
  Culinary: [
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=800",
    "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=800",
  ],
  Dining: [
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800",
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=800",
  ],
};

const POLICY_CONTENT = {
  privacy: {
    title: "Privacy Policy",
    sections: [
      { h: "Data Security", p: "We use encryption to protect your contact info. Your data is stored only for booking and statutory purposes." },
      { h: "Cookies", p: "We use Google Analytics to track site traffic." },
    ],
  },
  terms: {
    title: "Terms of Service",
    sections: [
      { h: "Guest ID", p: "Government-approved ID is mandatory upon check-in." },
      { h: "Property Care", p: "Ethereal Inn is a non-smoking property." },
    ],
  },
  refunds: {
    title: "Refund Policy",
    sections: [
      { h: "Cancellation Window", p: "Cancel 48 hours before check-in for a full refund." },
    ],
  },
};

const ENCODED_PHONE = "KzkxOTMxNTM3MTYxMw==";
const WHATSAPP_MESSAGE = encodeURIComponent("Hi Ethereal Inn & Urban Ambrosia! I'd like to inquire about a booking or meal service.");

export default function LandingLoginPage() {
  const [showLogin, setShowLogin] = useState(false);
  const [showPOS, setShowPOS] = useState(false);
  const [showInquiry, setShowInquiry] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [currentHero, setCurrentHero] = useState(0);
  const [activeGalleryTab, setActiveGalleryTab] = useState<keyof typeof GALLERY_DATA>("Rooms");
  const [policyType, setPolicyType] = useState<keyof typeof POLICY_CONTENT | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isPendingInquiry, startTransition] = useTransition();
  const [inquirySuccess, setInquirySuccess] = useState(false);
  const [state, formAction, isPending] = useActionState(loginUser, null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentHero((prev) => (prev + 1) % HERO_IMAGES.length), 6000);
    async function loadReviews() {
      try {
        const data = await getGoogleReviews();
        setReviews(data && data.length > 0 ? data : MOCK_REVIEWS);
      } catch (e) {
        setReviews(MOCK_REVIEWS);
      }
    }
    loadReviews();
    return () => clearInterval(timer);
  }, []);

  // Sync Body Scroll Lock
  useEffect(() => {
    const shouldLock = showAbout || showInquiry || showLogin || showPOS || policyType;
    document.body.style.overflow = shouldLock ? "hidden" : "unset";
  }, [showAbout, showInquiry, showLogin, showPOS, policyType]);

  const handleBookingRedirect = (e: React.MouseEvent) => {
    e.preventDefault();
    const decodedPhone = atob(ENCODED_PHONE);
    const whatsappUrl = `https://wa.me/${decodedPhone.replace("+", "")}?text=${WHATSAPP_MESSAGE}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  async function handleInquirySubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createInquiryAction(formData);
      if (res.success) {
        setInquirySuccess(true);
        setTimeout(() => { setShowInquiry(false); setInquirySuccess(false); }, 2500);
      }
    });
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-slate-100 overflow-x-hidden font-sans selection:bg-[#c5a059] selection:text-black">
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
      
      {/* --- NAVIGATION --- */}
      <nav className="fixed top-0 w-full z-[100] flex justify-between items-center px-6 md:px-12 py-6 backdrop-blur-md border-b border-white/5 bg-black/20">
        <div className="flex flex-col">
          <span className="text-[10px] tracking-[0.4em] uppercase text-gray-500 font-bold">The Collective</span>
          <span className="text-xl md:text-2xl font-serif font-bold italic text-[#c5a059]">Ethereal Inn</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setShowAbout(true)} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#c5a059] transition-colors mr-4 hidden sm:block">
            Our Story
          </button>
          <button onClick={() => setShowPOS(true)} className="hidden md:flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all">
            <LayoutDashboard size={14} className="text-[#c5a059]" /> Open POS
          </button>
          <button onClick={() => setShowLogin(true)} className="bg-[#c5a059] text-black px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform">
            Staff Gate
          </button>
        </div>
      </nav>

      {/* --- HERO --- */}
      <section className="relative h-[100dvh] flex flex-col justify-center px-4 md:px-6 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentHero}
            src={HERO_IMAGES[currentHero]}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 0.4, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            className="absolute inset-0 w-full h-full object-cover z-0"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-[#0a0a0a]/80 z-[1]" />
        
        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl sm:text-7xl md:text-8xl lg:text-[10rem] font-serif font-bold tracking-tighter text-white leading-[0.85] uppercase italic"
          >
            Ethereal <br className="hidden md:block" />
            <span style={{ background: `linear-gradient(to right, #fbf2cf 0%, #c5a059 50%, #fbf2cf 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                INN
            </span>
          </motion.h1>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6 px-4">
            <button onClick={() => setShowInquiry(true)} className="w-full sm:w-auto bg-white/5 backdrop-blur-md border border-white/10 text-white font-black px-12 py-5 rounded-2xl md:rounded-full hover:bg-[#c5a059] hover:text-black transition-all uppercase tracking-widest text-[11px]">
              Direct Inquiry
            </button>
            <button onClick={handleBookingRedirect} className="w-full sm:w-auto inline-flex items-center justify-center gap-4 bg-emerald-500 text-slate-950 font-black px-12 py-5 rounded-2xl md:rounded-full hover:bg-emerald-400 transition-all uppercase tracking-widest text-[11px]">
              <MessageCircle size={18} /> Book Instant
            </button>
          </div>
        </div>
      </section>

      {/* --- CULINARY SHOWCASE --- */}
      <section className="max-w-7xl mx-auto py-32 px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="relative group">
                <div className="absolute -inset-4 bg-[#c5a059]/10 rounded-[4rem] blur-2xl group-hover:bg-[#c5a059]/20 transition-all"></div>
                <img src={GALLERY_DATA.Culinary[0]} className="relative rounded-[3rem] border border-white/10 shadow-2xl grayscale hover:grayscale-0 transition-all duration-1000" alt="Urban Ambrosia" />
                <div className="absolute bottom-10 right-10 bg-black/80 backdrop-blur-xl p-8 rounded-3xl border border-[#c5a059]/30 max-w-xs hidden md:block">
                    <UtensilsCrossed className="text-[#c5a059] mb-4" size={32} />
                    <h4 className="text-white font-serif text-xl font-bold mb-2">Cloud-First Dining</h4>
                    <p className="text-gray-500 text-xs">Premium delivery optimized for temperature and celestial presentation.</p>
                </div>
            </div>
            
            <div className="space-y-8 text-center lg:text-left">
                <h2 className="text-5xl md:text-7xl font-serif font-bold italic leading-none text-white">
                   Urban <span className="text-[#c5a059]">Ambrosia.</span>
                </h2>
                <p className="text-gray-400 text-lg leading-relaxed font-light">
                    A premium culinary brand under the Ethereal Inn umbrella. We blend traditional Indian soul with modern presentation to create the <span className="text-white font-bold italic uppercase tracking-widest">Food of Modern Gods.</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                    <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                        <CheckCircle2 className="text-[#c5a059] mb-3 mx-auto lg:mx-0" size={24} />
                        <p className="text-white text-sm font-bold mt-1">Sattvic Quality</p>
                    </div>
                    <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                        <ChefHat className="text-[#c5a059] mb-3 mx-auto lg:mx-0" size={24} />
                        <p className="text-white text-sm font-bold mt-1">Urban Fusion</p>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* --- COLLECTION GALLERY --- */}
      <section className="max-w-6xl mx-auto py-20 px-4">
        <div className="flex flex-col items-center text-center mb-12">
          <h2 className="text-4xl md:text-6xl font-serif font-bold text-white flex items-center gap-4 uppercase italic">
            <Camera className="text-[#c5a059]" /> Collection
          </h2>
          <div className="mt-10 w-full max-w-md">
            <div className="flex bg-white/5 backdrop-blur-2xl p-1.5 rounded-full border border-white/10">
              {Object.keys(GALLERY_DATA).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveGalleryTab(tab as any)}
                  className={`flex-1 px-4 py-3 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-500 ${
                    activeGalleryTab === tab ? "bg-[#c5a059] text-black shadow-lg" : "text-slate-500 hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {GALLERY_DATA[activeGalleryTab].map((img, i) => (
            <motion.div 
              layout 
              key={img + i}
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="aspect-[4/3] rounded-[2.5rem] md:rounded-[4rem] overflow-hidden border border-white/10 group relative"
            >
              <img src={img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s]" alt="Space" />
            </motion.div>
          ))}
        </div>
      </section>

      {/* --- REVIEWS MARQUEE --- */}
      <section className="py-24 border-t border-white/5 overflow-hidden">
        <div className="flex flex-col items-center mb-16 text-center">
          <h2 className="text-5xl md:text-8xl font-serif font-bold tracking-tighter text-white uppercase italic leading-none">Voices.</h2>
        </div>
        <div className="relative flex overflow-x-hidden">
          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{ ease: "linear", duration: 35, repeat: Infinity }}
            className="flex gap-6 whitespace-nowrap"
          >
            {[...reviews, ...reviews].map((review, i) => (
              <ReviewCard key={i} review={review} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* --- MAP SECTION --- */}
      <section className="max-w-6xl mx-auto py-24 px-4 border-t border-white/5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 text-[#c5a059] px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest">
              <MapPin size={16} /> Chhatarpur, Delhi
            </div>
            <h2 className="text-5xl md:text-7xl font-serif font-bold text-white leading-tight uppercase italic">Delhi's <br /><span className="text-slate-500">Boutique.</span></h2>
            <button onClick={handleBookingRedirect} className="inline-flex items-center gap-3 bg-white/5 hover:bg-[#c5a059] hover:text-black text-white font-black px-10 py-5 rounded-2xl border border-white/10 transition-all uppercase text-xs tracking-widest">
              Get Directions <ExternalLink size={18} />
            </button>
          </div>
          <div className="h-[400px] w-full bg-zinc-900 rounded-[3rem] overflow-hidden border border-white/10 grayscale invert opacity-60">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14021.571401569436!2d77.172404!3d28.503619!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d1e1766a2e9b9%3A0x6b77292215c326e0!2sChhatarpur%2C%20New%20Delhi%2C%20Delhi!5e0!3m2!1sen!2sin!4v1711111111111"
              width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" title="Location Map"
            />
          </div>
        </div>
      </section>

      {/* --- MAIN FOOTER --- */}
      <footer className="bg-black pt-24 pb-12 px-6 border-t border-white/5 text-center">
        <h2 className="text-4xl md:text-6xl font-serif font-bold text-white mb-10 uppercase italic">Ethereal <span className="text-[#c5a059]">Inn.</span></h2>
        <div className="flex flex-wrap justify-center gap-12 mb-12 text-[10px] font-black uppercase tracking-[0.4em] text-slate-600">
          <button onClick={() => setPolicyType("privacy")} className="hover:text-[#c5a059]">Privacy</button>
          <button onClick={() => setPolicyType("terms")} className="hover:text-[#c5a059]">Terms</button>
          <button onClick={() => setPolicyType("refunds")} className="hover:text-[#c5a059]">Refunds</button>
        </div>
        <p className="text-[9px] text-gray-700 uppercase tracking-widest">© 2026 Ethereal Inn Collective | Urban Ambrosia Culinary</p>
      </footer>

      {/* --- MODALS & OVERLAYS --- */}
      <AnimatePresence>
        {/* --- ABOUT STORY MODAL --- */}
        {showAbout && (
          <motion.div 
            initial={{ x: "100%", opacity: 0 }} 
            animate={{ x: 0, opacity: 1 }} 
            exit={{ x: "100%", opacity: 0 }} 
            transition={{ type: "spring", damping: 30, stiffness: 200 }}
            className="fixed inset-0 z-[1000] bg-[#0a0a0a] text-white overflow-y-auto overflow-x-hidden selection:bg-[#c5a059] selection:text-black font-sans"
          >
            {/* Modal Exit Trigger */}
            <button 
              onClick={() => setShowAbout(false)} 
              className="fixed top-8 right-8 z-[1010] bg-white/5 hover:bg-[#c5a059] hover:text-black p-5 rounded-full text-white backdrop-blur-xl transition-all border border-white/10 group shadow-2xl"
            >
              <X size={24} className="group-hover:rotate-90 transition-transform" />
            </button>
            
            <div className="relative w-full flex flex-col items-center">
              {/* Story Hero */}
              <section className="relative h-[80dvh] w-full flex items-center justify-center px-6 overflow-hidden">
                <motion.div 
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 20, ease: "linear" }}
                  className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2000')] bg-cover bg-center opacity-30 grayscale" 
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-transparent to-[#0a0a0a]" />
                <div className="relative z-10 text-center max-w-4xl">
                  <motion.span 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[#c5a059] text-[10px] font-black uppercase tracking-[0.6em] mb-6 block"
                  >
                    The Collective Legacy
                  </motion.span>
                  <motion.h1 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-6xl md:text-[9rem] font-serif font-bold italic leading-[0.9] text-white uppercase"
                  >
                    Crafting <span className="text-gray-500">Silence</span> <br /> & <span className="text-[#c5a059]">Flavor.</span>
                  </motion.h1>
                </div>
              </section>

              {/* Boutique: Ethereal Inn Section */}
              <section className="max-w-7xl mx-auto py-32 px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                <div className="order-2 lg:order-1 relative">
                    <div className="absolute -top-10 -left-10 w-40 h-40 border-l border-t border-[#c5a059]/30 hidden md:block" />
                    <img 
                      src="https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=1200" 
                      alt="Boutique Stay" 
                      className="rounded-[3rem] grayscale hover:grayscale-0 transition-all duration-700 shadow-2xl"
                    />
                </div>
                <div className="order-1 lg:order-2 space-y-8">
                    <div className="flex items-center gap-4 text-[#c5a059]">
                        <BedDouble size={32} />
                        <h2 className="text-xs font-black uppercase tracking-widest">The Boutique Sanctuary</h2>
                    </div>
                    <h3 className="text-4xl md:text-5xl font-serif font-bold italic">Ethereal Inn.</h3>
                    <p className="text-gray-400 text-lg leading-relaxed">
                        Located in Delhi, Ethereal Inn was envisioned as an escape from the urban cacophony. We don't just provide rooms; we provide <span className="text-white italic">curated stillness.</span> 
                    </p>
                    <div className="flex gap-6 border-l border-[#c5a059] pl-6">
                        <div>
                            <h4 className="font-bold text-white uppercase text-xs tracking-widest mb-1">Architecture of Comfort</h4>
                            <p className="text-gray-500 text-sm">Minimalist design meets warm hospitality, focusing on tactile luxury and acoustic privacy.</p>
                        </div>
                    </div>
                </div>
              </section>

              {/* Culinary: Urban Ambrosia Section */}
              <section className="w-full bg-white/5 py-40">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    <div className="space-y-8">
                        <div className="flex items-center gap-4 text-[#c5a059]">
                            <Utensils size={32} />
                            <h2 className="text-xs font-black uppercase tracking-widest">The Culinary Brand</h2>
                        </div>
                        <h3 className="text-4xl md:text-5xl font-serif font-bold italic text-white">Urban <span className="text-[#c5a059]">Ambrosia.</span></h3>
                        <p className="text-gray-300 text-lg leading-relaxed">
                            Born as a premium cloud kitchen venture, Urban Ambrosia serves as the soul of our collective, delivering restaurant-grade warmth and texture to your doorstep.
                        </p>
                        <div className="grid grid-cols-2 gap-8 pt-6">
                            <div>
                                <h4 className="text-[#c5a059] font-black text-[10px] uppercase mb-2">The Philosophy</h4>
                                <p className="text-gray-400 text-xs leading-relaxed">Using "Ambrosia" as our benchmark for every recipe.</p>
                            </div>
                            <div>
                                <h4 className="text-[#c5a059] font-black text-[10px] uppercase mb-2">The Standard</h4>
                                <p className="text-gray-400 text-xs leading-relaxed">Pioneering delivery tech for optimal heat retention.</p>
                            </div>
                        </div>
                    </div>
                    <div className="relative group">
                        <img 
                            src="https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1200" 
                            alt="Culinary Excellence" 
                            className="relative rounded-[4rem] border border-white/10 shadow-3xl grayscale group-hover:grayscale-0 transition-all duration-700"
                        />
                    </div>
                </div>
              </section>

              {/* Leadership Grid */}
              <section className="max-w-7xl mx-auto py-32 px-6 w-full border-t border-white/5">
                <div className="flex flex-col items-center mb-16 text-center">
                  <Users className="text-[#c5a059] mb-4" size={32} />
                  <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">Founding Board</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { name: "Sandeep Kumar Chaudhry", role: "Managing Partner", desc: "Expert in operational excellence and leadership." },
                    { name: "Shyam Kumar Chaudhry", role: "Founder", desc: "Architect of the brand's identity and service standards." },
                    { name: "Deepak Tyagi", role: "Strategic Partner", desc: "Guiding financial growth and market positioning." },
                    { name: "Tushar Kumar Chaudhry", role: "Operations Lead", desc: "Master of guest experience and daily rhythm." }
                  ].map((leader, i) => (
                    <div key={i} className="bg-white/5 p-10 rounded-[3rem] border border-white/5 hover:border-[#c5a059]/30 transition-all group flex flex-col justify-between h-full">
                      <div>
                        <h4 className="text-white font-serif text-xl font-bold italic mb-2 group-hover:text-[#c5a059] transition-colors">{leader.name}</h4>
                        <p className="text-[#c5a059] text-[9px] font-black uppercase tracking-widest mb-6">{leader.role}</p>
                      </div>
                      <p className="text-gray-500 text-xs leading-relaxed">{leader.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Pillars / Values */}
              <section className="max-w-7xl mx-auto pb-40 px-6 w-full">
                <motion.div 
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-20 grid grid-cols-1 lg:grid-cols-3 gap-12 items-center border-t border-white/10 pt-32"
                >
                    <div className="lg:col-span-1">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-[#c5a059] mb-4">Official Mission</h3>
                        <h4 className="text-4xl font-serif font-bold italic leading-tight text-white">Elevating the <br />Standard of <br />Presence.</h4>
                    </div>
                    <div className="lg:col-span-2 bg-[#c5a059] p-12 md:p-20 rounded-[4rem] text-black">
                        <p className="text-xl md:text-4xl leading-relaxed font-bold italic">
                            "To build a hospitality ecosystem where technology meets tranquility, redefining the essence of modern presence."
                        </p>
                    </div>
                </motion.div>
                
                <div className="mt-32 text-center">
                   <Sparkles className="text-[#c5a059] mb-8 mx-auto" size={48} />
                   <h4 className="text-5xl md:text-7xl font-serif font-bold italic mb-12 uppercase tracking-tighter text-white">Join the <span className="text-[#c5a059]">Collective.</span></h4>
                   <button onClick={() => setShowAbout(false)} className="group inline-flex items-center gap-4 text-[#c5a059] font-black uppercase text-[11px] tracking-[0.4em]">
                    Return to Sanctuary <ArrowRight className="group-hover:translate-x-2 transition-transform" size={16} />
                  </button>
                </div>
              </section>
            </div>
          </motion.div>
        )}

        {/* --- INQUIRY / LOGIN / POLICIES MODALS --- */}
        {(showInquiry || showLogin || policyType) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-lg bg-zinc-900 rounded-[3rem] p-10 relative border border-white/5">
              <button onClick={() => { setShowInquiry(false); setShowLogin(false); setPolicyType(null); }} className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
              
              {showInquiry && (
                <form onSubmit={handleInquirySubmit} className="space-y-4">
                  <h3 className="text-2xl font-serif font-bold text-white uppercase italic mb-6">Inquiry <span className="text-[#c5a059]">Desk</span></h3>
                  {inquirySuccess ? (
                    <div className="text-center py-10 text-emerald-400 font-black uppercase tracking-widest animate-pulse">Message Sent</div>
                  ) : (
                    <>
                      <input required name="name" placeholder="Name" className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-[#c5a059]" />
                      <input required name="phone" placeholder="WhatsApp Number" className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-[#c5a059]" />
                      <button className="w-full bg-[#c5a059] text-black font-black py-5 rounded-2xl uppercase text-[11px] tracking-widest hover:scale-[1.02] transition-transform">
                        {isPendingInquiry ? <Loader2 className="animate-spin mx-auto" /> : "Send Request"}
                      </button>
                    </>
                  )}
                </form>
              )}

              {showLogin && (
                <form action={formAction} className="space-y-4">
                  <h3 className="text-2xl font-serif font-bold text-white uppercase italic mb-6">Staff Access</h3>
                  <input name="email" type="email" placeholder="Email" required className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-[#c5a059]" />
                  <input name="password" type="password" placeholder="Passkey" required className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-[#c5a059]" />
                  <button disabled={isPending} className="w-full bg-white text-black font-black py-5 rounded-2xl uppercase text-[11px] tracking-widest flex justify-center items-center">
                    {isPending ? <Loader2 className="animate-spin" /> : "Verify"}
                  </button>
                </form>
              )}

              {policyType && (
                <div className="space-y-6">
                  <h3 className="text-xl font-serif font-bold text-white uppercase italic">{POLICY_CONTENT[policyType].title}</h3>
                  {POLICY_CONTENT[policyType].sections.map((s, i) => (
                    <div key={i} className="space-y-2">
                      <p className="text-[10px] text-[#c5a059] uppercase font-black">{s.h}</p>
                      <p className="text-gray-400 text-sm leading-relaxed">{s.p}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* --- POS TERMINAL OVERLAY --- */}
        {showPOS && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[2000] bg-black flex flex-col">
            <div className="p-4 bg-zinc-900 flex justify-between items-center border-b border-white/10">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">POS Terminal Alpha</span>
              <button onClick={() => setShowPOS(false)} className="bg-red-500/10 text-red-500 p-2 rounded-full hover:bg-red-500 hover:text-white transition-all"><X size={20} /></button>
            </div>
            <iframe src={POS_APP_URL} className="flex-1 w-full border-none" title="POS" />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="bg-white/5 border border-white/10 p-10 rounded-[3rem] w-[350px] md:w-[450px] whitespace-normal flex flex-col justify-between hover:border-[#c5a059]/30 transition-all duration-500">
      <div>
        <div className="flex gap-1 mb-6">
          {[...Array(5)].map((_, idx) => (
            <Star key={idx} size={12} className={idx < review.rating ? "fill-[#c5a059] text-[#c5a059]" : "text-zinc-700"} />
          ))}
        </div>
        <p className="text-slate-300 text-sm italic leading-relaxed">"{review.text}"</p>
      </div>
      <div className="flex items-center gap-4 mt-8 pt-6 border-t border-white/5">
        <img src={review.profile_photo_url} className="w-10 h-10 rounded-full grayscale" alt="" />
        <div>
          <h4 className="text-white font-black text-[10px] uppercase">{review.author_name}</h4>
          <span className="text-[9px] text-zinc-500 uppercase">{review.relative_time_description}</span>
        </div>
      </div>
    </div>
  );
}