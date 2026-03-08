"use client";

import React, { useState, useActionState, useEffect } from "react";
import { loginUser } from "@/lib/actions/auth";
import { 
  Loader2, Lock, MessageCircle, MapPin, 
  X, ShieldCheck, Camera, Instagram, Facebook, Mail, Phone, ExternalLink, Globe,
  Shield, FileText, CreditCard 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Script from "next/script";

// --- GA4 CONFIGURATION ---
const GA_MEASUREMENT_ID = "G-XXXXXXXXXX"; // REPLACE WITH YOUR ACTUAL ID

// --- DATA ---
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
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800",
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=800"
  ]
};

const POLICY_CONTENT = {
  privacy: {
    title: "Privacy Policy",
    icon: <Shield className="text-amber-400" size={24} />,
    sections: [
      { h: "Data Security", p: "We use encryption to protect your contact info. Your data is stored only for booking and statutory purposes." },
      { h: "Cookies", p: "We use Google Analytics to track site traffic and improve our boutique experience." }
    ]
  },
  terms: {
    title: "Terms of Service",
    icon: <FileText className="text-amber-400" size={24} />,
    sections: [
      { h: "Guest ID", p: "Government-approved ID is mandatory for all guests upon check-in." },
      { h: "Property Care", p: "Guests are responsible for any damages. Ethereal Inn is a non-smoking property." }
    ]
  },
  refunds: {
    title: "Refund Policy",
    icon: <CreditCard className="text-amber-400" size={24} />,
    sections: [
      { h: "Cancellation Window", p: "Cancel 48 hours before check-in for a 100% refund. 24-48 hours incurs a 50% charge." },
      { h: "Processing", p: "Refunds take 5-7 business days to reflect in your bank account." }
    ]
  }
};

export default function LandingLoginPage() {
  const [showLogin, setShowLogin] = useState(false);
  const [currentHero, setCurrentHero] = useState(0);
  const [activeGalleryTab, setActiveGalleryTab] = useState<keyof typeof GALLERY_DATA>("Rooms");
  const [policyType, setPolicyType] = useState<keyof typeof POLICY_CONTENT | null>(null);
  const [state, formAction, isPending] = useActionState(loginUser, null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHero((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // GA4 Event Trigger
  const trackBookingClick = () => {
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag('event', 'generate_lead', {
        'event_category': 'Engagement',
        'event_label': 'WhatsApp Booking Click',
        'value': 1.0
      });
    }
  };

  return (
    <main className="min-h-screen bg-[#020617] text-slate-100 overflow-x-hidden font-sans selection:bg-amber-400 selection:text-slate-900">

      <script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Hotel",
      "name": "Ethereal Inn",
      "description": "A refined luxury boutique stay in Chhatarpur, South Delhi, offering premium rooms and fine dining near Chhatarpur Metro.",
      "url": "https://ethereal-inn.vercel.app/login",
      "telephone": "+919315371613",
      "image": [
        "https://images.unsplash.com/photo-1566073771259-6a8506099945",
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4"
      ],
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Chhatarpur",
        "addressLocality": "New Delhi",
        "addressRegion": "Delhi",
        "postalCode": "110074",
        "addressCountry": "IN"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 28.5020,
        "longitude": 77.1777
      },
      "priceRange": "₹2500 - ₹3500 per night",
      "amenityFeature": [
        { "@type": "LocationFeatureSpecification", "name": "Near Metro Station", "value": true },
        { "@type": "LocationFeatureSpecification", "name": "Fine Dining", "value": true },
        { "@type": "LocationFeatureSpecification", "name": "Free WiFi", "value": true }
      ]
    })
  }}
/>
      
      {/* 0. ANALYTICS SCRIPTS */}
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>

      {/* 1. HERO SECTION */}
      <section className="relative h-[95vh] flex flex-col justify-center px-6 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.img 
            key={currentHero}
            src={HERO_IMAGES[currentHero]}
            alt="Ethereal Inn Boutique Hotel"
            initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 0.35, scale: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 2 }} className="absolute inset-0 w-full h-full object-cover z-0"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-[#020617]/80 z-[1]" />

        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            className="text-7xl md:text-[10rem] font-black tracking-tighter text-white leading-[0.85]"
          >
            Ethereal <br className="md:hidden" /><span className="text-amber-400">Inn.</span>
          </motion.h1>
          <p className="max-w-xl mx-auto text-slate-400 text-lg md:text-2xl font-medium px-4">Chhatarpur's most refined boutique experience.</p>
          <div className="pt-6">
            <a 
              href="https://wa.me/919315371613" 
              onClick={trackBookingClick}
              className="w-full md:w-auto inline-flex items-center justify-center gap-4 bg-emerald-500 text-slate-950 font-black px-12 py-6 rounded-3xl md:rounded-full hover:bg-emerald-400 transition-all shadow-2xl shadow-emerald-500/20 active:scale-95 uppercase tracking-widest text-sm"
            >
              <MessageCircle size={24} /> Book Instant
            </a>
          </div>
        </div>
      </section>

      {/* 2. EXPLORE SECTION */}
      <section className="max-w-6xl mx-auto py-24 px-4">
        <div className="flex flex-col items-center text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-black text-white flex items-center gap-4">
            <Camera className="text-amber-400" /> The Collection
          </h2>
          <div className="w-full overflow-x-auto no-scrollbar mt-10 px-2">
            <div className="flex bg-slate-900/50 p-2 rounded-2xl border border-white/5 backdrop-blur-xl w-max mx-auto shadow-inner">
              {Object.keys(GALLERY_DATA).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveGalleryTab(tab as any)}
                  className={`px-10 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap ${
                    activeGalleryTab === tab ? 'bg-amber-400 text-slate-950' : 'text-slate-500 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
          <AnimatePresence mode="popLayout">
            {GALLERY_DATA[activeGalleryTab].map((img) => (
              <motion.div
                key={img}
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="relative aspect-[4/5] md:aspect-[16/10] rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl group"
              >
                <img src={img} alt="Property" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/80 via-transparent to-transparent opacity-60" />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* 3. LOCATION & MAP */}
      {/* 3. LOCATION & MAP SECTION */}
<section className="max-w-6xl mx-auto py-24 px-4 border-t border-white/5">
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
    <div className="space-y-8 text-center lg:text-left">
      <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 text-amber-400 px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest">
        <MapPin size={16} /> Locate Ethereal
      </div>
      <h2 className="text-5xl md:text-7xl font-black text-white leading-tight">
        Chhatarpur's <br /><span className="text-slate-500">Hidden Gem.</span>
      </h2>
      <p className="text-slate-400 text-xl leading-relaxed max-w-lg mx-auto lg:mx-0">
        Steps from Chhatarpur Metro. Luxury and privacy in South Delhi.
      </p>
      <a 
        href="https://goo.gl/maps/example" 
        target="_blank" 
        rel="noopener noreferrer"
        className="inline-flex items-center gap-3 bg-white/5 hover:bg-white/10 text-white font-black px-8 py-5 rounded-2xl border border-white/10 transition-all active:scale-95 uppercase text-xs tracking-widest"
      >
        Navigate with Google <ExternalLink size={18} className="text-amber-400" />
      </a>
    </div>

    {/* MAP CONTAINER WITH UPDATED IFRAME */}
    <div className="h-[450px] w-full bg-slate-900 rounded-[4rem] overflow-hidden border border-white/10 shadow-3xl relative group">
      <iframe 
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3505.748281134!2d77.1752044!3d28.5021356!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d1e156ca5f03d%3A0x69f6498664684534!2sChhattarpur!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
        width="100%" 
        height="100%" 
        style={{ border: 0, filter: 'grayscale(1) invert(1) opacity(0.7)' }} 
        allowFullScreen 
        loading="lazy" 
        referrerPolicy="no-referrer-when-downgrade"
        title="Ethereal Inn Chhatarpur Location"
        className="pointer-events-auto transition-opacity duration-500 group-hover:opacity-100"
      ></iframe>
      
      {/* Visual Overlay to maintain the Dark UI Aesthetic */}
      <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/10 rounded-[4rem]" />
    </div>
  </div>
</section>

      {/* 4. FOOTER & POLICIES */}
      <footer className="bg-slate-950 pt-24 pb-12 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col items-center text-center">
          <div className="mb-16 space-y-6">
            <h2 className="text-4xl md:text-6xl font-black text-white">Ethereal <span className="text-amber-400">Inn.</span></h2>
            <div className="flex flex-wrap justify-center gap-6 text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">
              <span className="flex items-center gap-2"><Phone size={12} className="text-amber-400"/> +91 93153 71613</span>
              <span className="flex items-center gap-2"><Mail size={12} className="text-amber-400"/> info@etherealinn.com</span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-8 mb-12 text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">
            <button onClick={() => setPolicyType("privacy")} className="hover:text-amber-400 transition-colors">Privacy</button>
            <button onClick={() => setPolicyType("terms")} className="hover:text-amber-400 transition-colors">Terms</button>
            <button onClick={() => setPolicyType("refunds")} className="hover:text-amber-400 transition-colors">Refunds</button>
          </div>

          <div className="w-full max-w-sm space-y-8">
            <div className="p-1 bg-white/5 rounded-[2.5rem] border border-white/5 shadow-2xl">
              <button onClick={() => setShowLogin(true)} className="w-full flex items-center justify-center gap-4 bg-slate-900 text-white font-black py-6 rounded-[2.2rem] active:scale-95 transition-all hover:bg-slate-800">
                <ShieldCheck size={20} className="text-amber-400" /> STAFF ACCESS
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* 5. MODALS (Policy & Login) */}
      <AnimatePresence>
        {policyType && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="w-full max-w-lg bg-[#020617] border border-white/10 rounded-[3rem] p-8 md:p-12 relative">
              <button onClick={() => setPolicyType(null)} className="absolute top-8 right-8 text-slate-500 hover:text-white"><X size={24} /></button>
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-white/5 rounded-2xl">{POLICY_CONTENT[policyType].icon}</div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">{POLICY_CONTENT[policyType].title}</h3>
              </div>
              <div className="space-y-8">{POLICY_CONTENT[policyType].sections.map((sec, i) => (
                <div key={i} className="space-y-2">
                  <h4 className="text-amber-400 text-xs font-black uppercase tracking-[0.2em]">{sec.h}</h4>
                  <p className="text-slate-400 leading-relaxed text-sm">{sec.p}</p>
                </div>
              ))}</div>
            </motion.div>
          </motion.div>
        )}

        {showLogin && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-slate-950/95 backdrop-blur-2xl">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="w-full max-w-md bg-[#020617] border-t md:border border-white/10 rounded-t-[3.5rem] md:rounded-[4rem] p-10 relative">
              <button onClick={() => setShowLogin(false)} className="absolute top-10 right-10 text-slate-600"><X size={32} /></button>
              <div className="text-center mb-10">
                <div className="w-20 h-20 bg-amber-400 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-2xl"><Lock size={36} className="text-slate-950" /></div>
                <h3 className="text-3xl font-black text-white uppercase tracking-tight">Staff Gate</h3>
              </div>
              <form action={formAction} className="space-y-5">
                <input name="email" type="email" placeholder="Staff Email" className="w-full bg-slate-900 border border-white/5 rounded-[1.8rem] p-6 text-white outline-none focus:border-amber-400" required />
                <input name="password" type="password" placeholder="Access Key" className="w-full bg-slate-900 border border-white/5 rounded-[1.8rem] p-6 text-white outline-none focus:border-amber-400" required />
                <button disabled={isPending} className="w-full bg-amber-400 text-slate-950 font-black py-7 rounded-[2rem] shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all text-sm uppercase tracking-widest">
                  {isPending ? <Loader2 className="animate-spin" /> : <>AUTHENTICATE <ShieldCheck size={18} /></>}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}