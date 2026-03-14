"use client";

import React, { useState, useActionState, useEffect, useMemo } from "react";
import { loginUser } from "@/lib/actions/auth";
import { 
  Loader2, Lock, MessageCircle, MapPin, 
  X, ShieldCheck, Camera, Star, ExternalLink, 
  Shield, FileText, CreditCard, Quote, Phone, Mail
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Script from "next/script";
import { getGoogleReviews } from "@/lib/actions/reviews"; // Ensure this action exists

// --- GA4 CONFIGURATION ---
const GA_MEASUREMENT_ID = "G-XXXXXXXXXX";

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
    text: "The most serene stay in Chhatarpur. The attention to detail in the room decor is unmatched. Perfect for a quiet getaway while staying connected to the city.",
    profile_photo_url: "https://i.pravatar.cc/150?u=aditya"
  },
  {
    author_name: "Sarah Jenkins",
    rating: 5,
    relative_time_description: "1 month ago",
    text: "Ethereal Inn is a hidden gem. The staff was incredibly professional, and the proximity to the Metro made my business trip so much easier.",
    profile_photo_url: "https://i.pravatar.cc/150?u=sarah"
  },
  {
    author_name: "Vikram Malhotra",
    rating: 5,
    relative_time_description: "3 days ago",
    text: "Exquisite dining experience and ultra-comfortable beds. It truly feels like a boutique sanctuary. Highly recommended for premium stays.",
    profile_photo_url: "https://i.pravatar.cc/150?u=vikram"
  }
];

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
      { h: "Cookies", p: "We use Google Analytics to track site traffic." }
    ]
  },
  terms: {
    title: "Terms of Service",
    icon: <FileText className="text-amber-400" size={24} />,
    sections: [
      { h: "Guest ID", p: "Government-approved ID is mandatory upon check-in." },
      { h: "Property Care", p: "Ethereal Inn is a non-smoking property." }
    ]
  },
  refunds: {
    title: "Refund Policy",
    icon: <CreditCard className="text-amber-400" size={24} />,
    sections: [
      { h: "Cancellation Window", p: "Cancel 48 hours before check-in for a full refund." }
    ]
  }
};

// This is "+919315371613" encoded in Base64
const ENCODED_PHONE = "KzkxOTMxNTM3MTYxMw=="; 

const WHATSAPP_MESSAGE = encodeURIComponent(
  "Hi Ethereal Inn! I'd like to inquire about a booking. Please share availability for the upcoming dates."
);

/**
 * Decodes the phone number and opens WhatsApp dynamically.
 * This prevents the number from sitting in the DOM as a plain string.
 */
const handleBookingRedirect = (e: React.MouseEvent) => {
  e.preventDefault();
  
  // Decode on the fly
  const decodedPhone = atob(ENCODED_PHONE);
  const whatsappUrl = `https://wa.me/${decodedPhone.replace('+', '')}?text=${WHATSAPP_MESSAGE}`;
  
  // Trigger GA4 tracking
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag('event', 'generate_lead', { 'event_category': 'Engagement' });
  }

  // Redirect
  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
};

export default function LandingLoginPage() {
  const [showLogin, setShowLogin] = useState(false);
  const [currentHero, setCurrentHero] = useState(0);
  const [activeGalleryTab, setActiveGalleryTab] = useState<keyof typeof GALLERY_DATA>("Rooms");
  const [policyType, setPolicyType] = useState<keyof typeof POLICY_CONTENT | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [state, formAction, isPending] = useActionState(loginUser, null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHero((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 6000);
    
   async function loadReviews() {
  try {
    const data = await getGoogleReviews();
    // Use real reviews if available and count > 0, otherwise use mocks
    setReviews(data && data.length > 0 ? data : MOCK_REVIEWS);
  } catch (e) {
    console.error("API Error: Falling back to Mock Reviews");
    setReviews(MOCK_REVIEWS);
  } finally {
    setLoadingReviews(false);
  }
}

    loadReviews();
    return () => clearInterval(timer);
  }, []);

  const trackBookingClick = () => {
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag('event', 'generate_lead', { 'event_category': 'Engagement' });
    }
  };

  return (
    <main className="min-h-screen bg-[#020617] text-slate-100 overflow-x-hidden font-sans selection:bg-amber-400 selection:text-slate-900">
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
            alt="Ethereal Inn"
            initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 0.65, scale: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 2 }} className="absolute inset-0 w-full h-full object-cover z-0"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-[#020617]/80 z-[1]" />
        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8">
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-7xl md:text-[10rem] font-black tracking-tighter text-white leading-[0.85]">
            Ethereal <br className="md:hidden" /><span className="text-amber-400">Inn.</span>
          </motion.h1>
          <div className="pt-6">
          <button 
      onClick={handleBookingRedirect}
      className="w-full md:w-auto inline-flex items-center justify-center gap-4 bg-emerald-500 text-slate-950 font-black px-12 py-6 rounded-3xl md:rounded-full hover:bg-emerald-400 transition-all shadow-2xl shadow-emerald-500/20 active:scale-95 uppercase tracking-widest text-sm"
    >
      <MessageCircle size={24} /> Book Instant
    </button>
          </div>
        </div>
      </section>

      {/* 2. COLLECTION SECTION */}
      <section className="max-w-6xl mx-auto py-24 px-4">
        <div className="flex flex-col items-center text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-black text-white flex items-center gap-4">
            <Camera className="text-amber-400" /> The Collection
          </h2>
          <div className="flex bg-slate-900/50 p-2 rounded-2xl border border-white/5 mt-10">
            {Object.keys(GALLERY_DATA).map((tab) => (
              <button key={tab} onClick={() => setActiveGalleryTab(tab as any)} className={`px-10 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeGalleryTab === tab ? 'bg-amber-400 text-slate-950' : 'text-slate-500'}`}>
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {GALLERY_DATA[activeGalleryTab].map((img) => (
            <div key={img} className="rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl group">
              <img src={img} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            </div>
          ))}
        </div>
      </section>

      {/* --- MARQUEE REVIEWS SECTION --- */}
     {/* --- MARQUEE REVIEWS SECTION --- */}
<section className="py-24 border-t border-white/5 overflow-hidden">
  <div className="flex flex-col items-center mb-16 px-4">
    <h2 className="text-5xl md:text-8xl font-black tracking-tighter text-white uppercase italic leading-none text-center">
      Voices.
    </h2>
    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-4">
      {reviews === MOCK_REVIEWS ? "Guest Testimonials" : "Verified Google Guest Reviews"}
    </p>
  </div>

  {loadingReviews ? (
    <div className="flex justify-center gap-6 px-4 animate-pulse">
      {[1, 2, 3].map(i => <div key={i} className="h-64 w-80 bg-white/5 rounded-[3rem]" />)}
    </div>
  ) : (
    <div className="relative flex overflow-x-hidden group">
      <motion.div 
        animate={{ x: ["0%", "-50%"] }} 
        transition={{ 
          ease: "linear", 
          duration: 35, // Slightly faster for better energy
          repeat: Infinity 
        }}
        // PAUSE ON HOVER LOGIC
        whileHover={{ animationPlayState: "paused" }}
        className="flex gap-6 whitespace-nowrap"
      >
        {/* We triple the array if it's short to ensure no white space on large screens */}
        {[...reviews, ...reviews, ...reviews].map((review, i) => (
          <ReviewCard key={i} review={review} />
        ))}
      </motion.div>
      
      {/* Side gradients to fade the reviews out at the edges */}
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#020617] to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#020617] to-transparent z-10 pointer-events-none" />
    </div>
  )}
</section>

      {/* 3. LOCATION & MAP */}
      <section className="max-w-6xl mx-auto py-24 px-4 border-t border-white/5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 text-amber-400 px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest">
              <MapPin size={16} /> Locate Ethereal
            </div>
            <h2 className="text-5xl md:text-7xl font-black text-white leading-tight">Chhatarpur's <br /><span className="text-slate-500">Hidden Gem.</span></h2>
            <a href="https://goo.gl/maps/example" className="inline-flex items-center gap-3 bg-white/5 hover:bg-white/10 text-white font-black px-8 py-5 rounded-2xl border border-white/10 transition-all uppercase text-xs tracking-widest">
              Navigate <ExternalLink size={18} className="text-amber-400" />
            </a>
          </div>
          <div className="h-[450px] w-full bg-slate-900 rounded-[4rem] overflow-hidden border border-white/10 shadow-3xl">
            <iframe src="https://maps.google.com/maps?q=Chhatarpur%20Metro%20Station&t=&z=13&ie=UTF8&iwloc=&output=embed" width="100%" height="100%" style={{ border: 0, filter: 'grayscale(1) invert(1) opacity(0.5)' }}></iframe>
          </div>
        </div>
      </section>

      {/* 4. FOOTER */}
      <footer className="bg-slate-950 pt-24 pb-12 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col items-center text-center">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-10">Ethereal <span className="text-amber-400">Inn.</span></h2>
          <div className="flex flex-wrap justify-center gap-8 mb-12 text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">
            <button onClick={() => setPolicyType("privacy")} className="hover:text-amber-400 transition-colors">Privacy</button>
            <button onClick={() => setPolicyType("terms")} className="hover:text-amber-400 transition-colors">Terms</button>
            <button onClick={() => setPolicyType("refunds")} className="hover:text-amber-400 transition-colors">Refunds</button>
            <button onClick={() => setShowLogin(true)} className="flex items-center gap-2 text-white border-b border-white/10 pb-1">STAFF LOGIN</button>
          </div>
        </div>
      </footer>

      {/* 5. MODALS */}
      <AnimatePresence>
        {policyType && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-lg bg-[#020617] border border-white/10 rounded-[3rem] p-12 relative">
              <button onClick={() => setPolicyType(null)} className="absolute top-8 right-8 text-slate-500"><X size={24} /></button>
              <h3 className="text-2xl font-black text-white uppercase mb-8">{POLICY_CONTENT[policyType].title}</h3>
              <div className="space-y-6 text-slate-400 text-sm">{POLICY_CONTENT[policyType].sections.map((s, i) => <div key={i}><strong>{s.h}:</strong> {s.p}</div>)}</div>
            </motion.div>
          </motion.div>
        )}

        {showLogin && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 backdrop-blur-2xl p-6">
            <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="w-full max-w-md bg-[#020617] border border-white/10 rounded-[3.5rem] p-10 relative">
              <button onClick={() => setShowLogin(false)} className="absolute top-10 right-10 text-slate-600"><X size={32} /></button>
              <h3 className="text-3xl font-black text-white uppercase text-center mb-10 italic">Staff Gate</h3>
              <form action={formAction} className="space-y-5">
                <input name="email" type="email" placeholder="Email" className="w-full bg-slate-900 border border-white/5 rounded-[1.8rem] p-6 text-white outline-none focus:border-amber-400" />
                <input name="password" type="password" placeholder="Key" className="w-full bg-slate-900 border border-white/5 rounded-[1.8rem] p-6 text-white outline-none focus:border-amber-400" />
                <button className="w-full bg-amber-400 text-slate-950 font-black py-7 rounded-[2rem] uppercase tracking-widest text-sm">{isPending ? <Loader2 className="animate-spin mx-auto" /> : "Authenticate"}</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="bg-white/5 border border-white/10 p-10 rounded-[3rem] w-[350px] whitespace-normal group hover:border-amber-400/30 transition-all flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-6">
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => <Star key={i} size={12} className={i < review.rating ? "fill-amber-400 text-amber-400" : "text-slate-700"} />)}
          </div>
          <Quote className="text-white/5 group-hover:text-amber-400/10 transition-colors" size={32} />
        </div>
        <p className="text-slate-300 text-sm leading-relaxed italic mb-8 italic">"{review.text}"</p>
      </div>
      <div className="flex items-center gap-4">
        <img src={review.profile_photo_url} className="w-10 h-10 rounded-full grayscale group-hover:grayscale-0 transition-all" alt="" />
        <div>
          <h4 className="text-white font-black text-xs uppercase tracking-tighter">{review.author_name}</h4>
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{review.relative_time_description}</span>
        </div>
      </div>
    </div>
  );
}