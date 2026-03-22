"use client";

import React, { useState, useActionState, useEffect, useMemo, useTransition } from "react";
import { loginUser } from "@/lib/actions/auth";
import { createInquiryAction } from "@/lib/actions/inquiry";
import {
  Loader2,
  Lock,
  MessageCircle,
  MapPin,
  X,
  ShieldCheck,
  Camera,
  Star,
  ExternalLink,
  Shield,
  FileText,
  CreditCard,
  Quote,
  Phone,
  Mail,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Script from "next/script";
import { getGoogleReviews } from "@/lib/actions/reviews";

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
    profile_photo_url: "https://i.pravatar.cc/150?u=aditya",
  },
  {
    author_name: "Sarah Jenkins",
    rating: 5,
    relative_time_description: "1 month ago",
    text: "Ethereal Inn is a hidden gem. The staff was incredibly professional, and the proximity to the Metro made my business trip so much easier.",
    profile_photo_url: "https://i.pravatar.cc/150?u=sarah",
  },
  {
    author_name: "Vikram Malhotra",
    rating: 5,
    relative_time_description: "3 days ago",
    text: "Exquisite dining experience and ultra-comfortable beds. It truly feels like a boutique sanctuary. Highly recommended for premium stays.",
    profile_photo_url: "https://i.pravatar.cc/150?u=vikram",
  },
];

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=2000",
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=2000",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=2000",
];

const GALLERY_DATA = {
  Rooms: [
    "https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=800",
    "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=800",
  ],
  Amenities: [
    "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800",
    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=800",
  ],
  Dining: [
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800",
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=800",
  ],
};

const POLICY_CONTENT = {
  privacy: {
    title: "Privacy Policy",
    icon: <Shield className="text-amber-400" size={24} />,
    sections: [
      { h: "Data Security", p: "We use encryption to protect your contact info. Your data is stored only for booking and statutory purposes." },
      { h: "Cookies", p: "We use Google Analytics to track site traffic." },
    ],
  },
  terms: {
    title: "Terms of Service",
    icon: <FileText className="text-amber-400" size={24} />,
    sections: [
      { h: "Guest ID", p: "Government-approved ID is mandatory upon check-in." },
      { h: "Property Care", p: "Ethereal Inn is a non-smoking property." },
    ],
  },
  refunds: {
    title: "Refund Policy",
    icon: <CreditCard className="text-amber-400" size={24} />,
    sections: [
      { h: "Cancellation Window", p: "Cancel 48 hours before check-in for a full refund." },
    ],
  },
};

const ENCODED_PHONE = "KzkxOTMxNTM3MTYxMw==";
const WHATSAPP_MESSAGE = encodeURIComponent("Hi Ethereal Inn! I'd like to inquire about a booking. Please share availability for the upcoming dates.");

const handleBookingRedirect = (e: React.MouseEvent) => {
  e.preventDefault();
  const decodedPhone = atob(ENCODED_PHONE);
  const whatsappUrl = `https://wa.me/${decodedPhone.replace("+", "")}?text=${WHATSAPP_MESSAGE}`;
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", "generate_lead", { event_category: "Engagement" });
  }
  window.open(whatsappUrl, "_blank", "noopener,noreferrer");
};

export default function LandingLoginPage() {
  const [showLogin, setShowLogin] = useState(false);
  const [showInquiry, setShowInquiry] = useState(false);
  const [currentHero, setCurrentHero] = useState(0);
  const [activeGalleryTab, setActiveGalleryTab] = useState<keyof typeof GALLERY_DATA>("Rooms");
  const [policyType, setPolicyType] = useState<keyof typeof POLICY_CONTENT | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
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
      } finally {
        setLoadingReviews(false);
      }
    }
    loadReviews();
    return () => clearInterval(timer);
  }, []);

  async function handleInquirySubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const checkIn = formData.get("checkIn");
    const checkOut = formData.get("checkOut");
    const note = formData.get("note") || "None";
    formData.append("message", `Stay: ${checkIn} to ${checkOut}. Note: ${note}`);

    startTransition(async () => {
      const res = await createInquiryAction(formData);
      if (res.success) {
        setInquirySuccess(true);
        setTimeout(() => { setShowInquiry(false); setInquirySuccess(false); }, 2500);
      }
    });
  }

  return (
    <main className="min-h-screen bg-[#020617] text-slate-100 overflow-x-hidden font-sans selection:bg-amber-400 selection:text-slate-900">
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${GA_MEASUREMENT_ID}');`}
      </Script>

      {/* 1. HERO SECTION - RESPONSIVE HEIGHT */}
      <section className="relative h-[100dvh] flex flex-col justify-center px-4 md:px-6 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentHero}
            src={HERO_IMAGES[currentHero]}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 0.5, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            className="absolute inset-0 w-full h-full object-cover z-0"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-[#020617]/80 z-[1]" />
        
        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-6 md:space-y-8">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl sm:text-8xl md:text-[10rem] font-black tracking-tighter text-white leading-[0.85] uppercase italic"
          >
            Ethereal <br className="hidden md:block" />
            <span className="text-amber-400">Inn.</span>
          </motion.h1>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6 px-4">
            <button
              onClick={() => setShowInquiry(true)}
              className="w-full sm:w-auto bg-white/10 backdrop-blur-md border border-white/20 text-white font-black px-12 py-5 rounded-2xl md:rounded-full hover:bg-white hover:text-black transition-all shadow-2xl active:scale-95 uppercase tracking-widest text-[11px]"
            >
              Direct Inquiry
            </button>
            <button
              onClick={handleBookingRedirect}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-4 bg-emerald-500 text-slate-950 font-black px-12 py-5 rounded-2xl md:rounded-full hover:bg-emerald-400 transition-all shadow-2xl active:scale-95 uppercase tracking-widest text-[11px]"
            >
              <MessageCircle size={18} /> Book Instant
            </button>
          </div>
        </div>
      </section>

      {/* 2. COLLECTION SECTION - MORPHISM TABS */}
      <section className="max-w-6xl mx-auto py-20 md:py-32 px-4">
        <div className="flex flex-col items-center text-center mb-12 md:mb-16">
          <h2 className="text-4xl md:text-6xl font-black text-white flex items-center gap-4 uppercase italic">
            <Camera className="text-amber-400" /> Collection
          </h2>
          <div className="mt-8 md:mt-10 w-full max-w-md">
            <div className="flex bg-white/5 backdrop-blur-2xl p-1.5 rounded-2xl border border-white/10 shadow-inner">
              {Object.keys(GALLERY_DATA).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveGalleryTab(tab as any)}
                  className={`flex-1 px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-500 ${
                    activeGalleryTab === tab ? "bg-amber-400 text-slate-950 shadow-lg" : "text-slate-500 hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
          {GALLERY_DATA[activeGalleryTab].map((img) => (
            <div key={img} className="aspect-[4/3] rounded-[2.5rem] md:rounded-[4rem] overflow-hidden border border-white/10 shadow-2xl group relative">
              <img src={img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s]" alt="Space" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          ))}
        </div>
      </section>

      {/* 3. MARQUEE REVIEWS - REFINED CARDS */}
      <section className="py-24 border-t border-white/5 overflow-hidden">
        <div className="flex flex-col items-center mb-16 px-4 text-center">
          <h2 className="text-5xl md:text-8xl font-black tracking-tighter text-white uppercase italic leading-none">Voices.</h2>
        </div>
        <div className="relative flex overflow-x-hidden group">
          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{ ease: "linear", duration: 35, repeat: Infinity }}
            whileHover={{ animationPlayState: "paused" }}
            className="flex gap-6 whitespace-nowrap"
          >
            {[...reviews, ...reviews].map((review, i) => (
              <ReviewCard key={i} review={review} />
            ))}
          </motion.div>
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#020617] to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#020617] to-transparent z-10 pointer-events-none" />
        </div>
      </section>

      {/* 4. LOCATION & MAP - CLEANER WRAPPER */}
      <section className="max-w-6xl mx-auto py-24 px-4 border-t border-white/5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 items-center">
          <div className="space-y-6 md:space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 text-amber-400 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest">
              <MapPin size={16} /> South Delhi
            </div>
            <h2 className="text-5xl md:text-7xl font-black text-white leading-tight uppercase">Chhatarpur's <br /><span className="text-slate-500 italic">Boutique.</span></h2>
            <a href="https://maps.app.goo.gl/9r8k8Vw89T9fS7Nf6" target="_blank" className="inline-flex items-center gap-3 bg-white/5 hover:bg-amber-400 hover:text-black text-white font-black px-10 py-5 rounded-2xl border border-white/10 transition-all uppercase text-xs tracking-widest">
              Navigate <ExternalLink size={18} />
            </a>
          </div>
          <div className="h-[350px] md:h-[450px] w-full bg-slate-900 rounded-[3rem] md:rounded-[4.5rem] overflow-hidden border border-white/10 shadow-3xl relative">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3505.5414848492!2d77.1764!3d28.5028!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjjCsDMwJzEwLjEiTiA3N8KwMTAnMzUuMCJF!5e0!3m2!1sen!2sin!4v1710000000000!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0, filter: "grayscale(1) invert(0.9) opacity(0.6)" }}
              allowFullScreen
              loading="lazy"
            ></iframe>
          </div>
        </div>
      </section>

      {/* 5. FOOTER - MINIMALIST */}
      <footer className="bg-slate-950 pt-24 pb-12 px-6 border-t border-white/5 text-center">
        <h2 className="text-4xl md:text-6xl font-black text-white mb-10 uppercase italic">Ethereal <span className="text-amber-400">Inn.</span></h2>
        <div className="flex flex-wrap justify-center gap-6 md:gap-12 mb-12 text-[10px] font-black uppercase tracking-[0.4em] text-slate-600">
          <button onClick={() => setPolicyType("privacy")} className="hover:text-amber-400 transition-colors">Privacy</button>
          <button onClick={() => setPolicyType("terms")} className="hover:text-amber-400 transition-colors">Terms</button>
          <button onClick={() => setPolicyType("refunds")} className="hover:text-amber-400 transition-colors">Refunds</button>
          <button onClick={() => setShowLogin(true)} className="text-white/40 hover:text-white transition-all">Staff</button>
        </div>
      </footer>

      {/* 6. MODALS - IMPROVED GLASSMOBILE */}
      <AnimatePresence>
        {(showInquiry || showLogin || policyType) && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              className="w-full max-w-lg bg-[#020617] border-t sm:border border-white/10 rounded-t-[3rem] sm:rounded-[4rem] p-10 md:p-14 relative shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.5)]"
            >
              <button onClick={() => { setShowInquiry(false); setShowLogin(false); setPolicyType(null); }} className="absolute top-8 right-8 text-slate-500 hover:text-white"><X size={28} /></button>

              {showInquiry && (
                <form onSubmit={handleInquirySubmit} className="space-y-4">
                  <h3 className="text-3xl font-black uppercase italic text-white mb-6">Direct <span className="text-amber-400">Desk</span></h3>
                  {inquirySuccess ? (
                    <div className="text-center py-10"><CheckCircle2 className="mx-auto text-emerald-400 mb-4" size={48} /><p className="text-white font-black uppercase">Sent Successfully</p></div>
                  ) : (
                    <>
                      <input required name="name" placeholder="Name" className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none focus:border-amber-400 text-white transition-all" />
                      <input required name="phone" placeholder="WhatsApp" className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none focus:border-amber-400 text-white transition-all" />
                      <div className="grid grid-cols-2 gap-4">
                        <input required type="date" name="checkIn" className="bg-white/5 border border-white/10 p-5 rounded-2xl text-white text-[10px] uppercase font-bold" />
                        <input required type="date" name="checkOut" className="bg-white/5 border border-white/10 p-5 rounded-2xl text-white text-[10px] uppercase font-bold" />
                      </div>
                      <textarea name="note" placeholder="Special requirements?" rows={2} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none focus:border-amber-400 text-white resize-none" />
                      <button disabled={isPendingInquiry} className="w-full bg-amber-400 text-slate-950 font-black py-6 rounded-2xl uppercase text-[11px] tracking-widest mt-4 shadow-xl active:scale-95 transition-all">
                        {isPendingInquiry ? <Loader2 className="animate-spin mx-auto" /> : "Request Availability"}
                      </button>
                    </>
                  )}
                </form>
              )}

              {showLogin && (
                <form action={formAction} className="space-y-4">
                  <h3 className="text-3xl font-black text-white uppercase italic text-center mb-8">Staff Gate</h3>
                  <input name="email" type="email" placeholder="Email" className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-amber-400 transition-all" />
                  <input name="password" type="password" placeholder="Passkey" className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-amber-400 transition-all" />
                  <button className="w-full bg-amber-400 text-slate-950 font-black py-6 rounded-2xl uppercase tracking-widest text-[11px] shadow-xl">
                    {isPending ? <Loader2 className="animate-spin mx-auto" /> : "Authenticate"}
                  </button>
                </form>
              )}

              {policyType && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-black text-white uppercase italic">{POLICY_CONTENT[policyType].title}</h3>
                  {POLICY_CONTENT[policyType].sections.map((s, i) => (
                    <div key={i} className="bg-white/5 p-5 rounded-2xl border border-white/5">
                      <p className="text-[10px] font-black uppercase text-amber-400 mb-2">{s.h}</p>
                      <p className="text-slate-400 text-xs leading-relaxed">{s.p}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] w-[320px] md:w-[420px] whitespace-normal flex flex-col justify-between group hover:border-amber-400/40 transition-all duration-700">
      <div>
        <div className="flex justify-between items-start mb-6">
          <div className="flex gap-1">
            {[...Array(5)].map((_, idx) => (
              <Star key={idx} size={12} className={idx < review.rating ? "fill-amber-400 text-amber-400" : "text-slate-700"} />
            ))}
          </div>
          <Quote className="text-white/5 group-hover:text-amber-400/20 transition-colors duration-700" size={40} />
        </div>
        <p className="text-slate-300 text-sm md:text-base italic leading-relaxed mb-8">"{review.text}"</p>
      </div>
      <div className="flex items-center gap-4 border-t border-white/5 pt-6">
        <img src={review.profile_photo_url} className="w-10 h-10 rounded-full grayscale group-hover:grayscale-0 transition-all duration-700" alt="" />
        <div>
          <h4 className="text-white font-black text-[10px] uppercase tracking-wider">{review.author_name}</h4>
          <span className="text-[9px] text-slate-500 uppercase font-bold">{review.relative_time_description}</span>
        </div>
      </div>
    </div>
  );
}