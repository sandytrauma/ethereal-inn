"use client";

import React, {
  useState,
  useActionState,
  useEffect,
  useTransition,
} from "react";
import { loginUser } from "@/lib/actions/auth";
import { createInquiryAction } from "@/lib/actions/inquiry";
import {
  Loader2,
  MessageCircle,
  X,
  ShieldCheck,
  Camera,
  Star,
  ArrowUpRight,
  ChefHat,
  UtensilsCrossed,
  CheckCircle2,
  BookOpen,
  Instagram,
  Facebook,
  PhoneCall,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Script from "next/script";
import { getGoogleReviews } from "@/lib/actions/reviews";
import Link from "next/link";
import DashboardBackground from "./dashboard/DashboardBackground";
import MultiPropertyMap from "./MultiPropertyMap";
import Image from "next/image";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";

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
    text: "The most serene stay now in Delhi. The attention to detail in the room decor is unmatched.",
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
      {
        h: "Data Security",
        p: "We use encryption to protect your contact info. Your data is stored only for booking and statutory purposes.",
      },
      { h: "Cookies", p: "We use Google Analytics to track site traffic." },
    ],
  },
  terms: {
    title: "Terms of Service",
    sections: [
      {
        h: "Guest ID",
        p: "Government-approved ID is mandatory upon check-in.",
      },
      { h: "Property Care", p: "Ethereal Inn is a non-smoking property." },
    ],
  },
  refunds: {
    title: "Refund Policy",
    sections: [
      {
        h: "Cancellation Window",
        p: "Cancel 48 hours before check-in for a full refund.",
      },
    ],
  },
};

const ENCODED_PHONE = "KzkxODc5NjIxMTg0OQ==";
const WHATSAPP_MESSAGE = encodeURIComponent(
  "Hi Ethereal Inn & Urban Ambrosia! I'd like to inquire about a booking or meal service.",
);

export default function LandingLoginPage() {
  const [showLogin, setShowLogin] = useState(false);
  const [showInquiry, setShowInquiry] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [currentHero, setCurrentHero] = useState(0);
  const [activeGalleryTab, setActiveGalleryTab] =
    useState<keyof typeof GALLERY_DATA>("Rooms");
  const [policyType, setPolicyType] = useState<
    keyof typeof POLICY_CONTENT | null
  >(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isPendingInquiry, startTransition] = useTransition();
  const [inquirySuccess, setInquirySuccess] = useState(false);

  // 🌟 Action state hook handles state configurations gracefully
  const [state, formAction, isPending] = useActionState(loginUser, null);

  useEffect(() => {
    const timer = setInterval(
      () => setCurrentHero((prev) => (prev + 1) % HERO_IMAGES.length),
      6000,
    );
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

  useEffect(() => {
    const shouldLock = showAbout || showInquiry || showLogin || policyType;
    document.body.style.overflow = shouldLock ? "hidden" : "unset";
  }, [showAbout, showInquiry, showLogin, policyType]);

  const handleBookingRedirect = (e: React.MouseEvent) => {
    e.preventDefault();
    const decodedPhone = atob(ENCODED_PHONE);
    const whatsappUrl = `https://wa.me/${decodedPhone.replace("+", "")}?text=${WHATSAPP_MESSAGE}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  async function handleInquirySubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // 🌟 FIXED: Captured native DOM form reference before execution thread asynchronously steps into transitions
    const currentFormElement = e.currentTarget;
    const formData = new FormData(currentFormElement);

    const PROPERTY_ID =
      process.env.NEXT_PUBLIC_MOHAN_GARDEN_ID ||
      "00000000-0000-0000-0000-000000000000";

    startTransition(async () => {
      try {
        const res = await createInquiryAction(PROPERTY_ID, formData);

        if (res.success) {
          setInquirySuccess(true);
          currentFormElement.reset(); // Safe explicit call

          setTimeout(() => {
            setShowInquiry(false);
            setInquirySuccess(false);
          }, 2500);
        } else {
          console.error("Database Error:", res.error);
        }
      } catch (err) {
        console.error("Network Error:", err);
      }
    });
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-100 overflow-x-hidden font-sans selection:bg-[#c5a059] selection:text-black pb-24 md:pb-0">
      <DashboardBackground />

      {/* 🌟 FIXED: Google Analytics Global Tracking Snippet Configuration Tag Loader */}
      {GA_MEASUREMENT_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}', {
                page_path: window.location.pathname,
              });
            `}
          </Script>
        </>
      )}

      {/* --- NAVIGATION --- */}
      <nav className="fixed top-0 w-full z-[100] flex justify-between items-center px-6 md:px-12 py-6 backdrop-blur-md border-b border-white/5 bg-black/20">
        <div className="flex flex-col text-left">
          <span className="text-[10px] tracking-[0.4em] uppercase text-gray-500 font-black">
            The Collective
          </span>
          <span className="text-xl md:text-2xl font-serif font-bold italic text-[#c5a059]">
            Ethereal Inn
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowAbout(true)}
            className="hidden md:block text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#c5a059] transition-colors mr-4"
          >
            Our Story
          </button>

          <button
            onClick={() => setShowLogin(true)}
            className="bg-[#c5a059] text-black px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform duration-200 cursor-pointer"
          >
            Staff Gate
          </button>
        </div>
      </nav>

      {/* --- MOBILE FOOTER DOCK --- */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-[150] md:hidden">
        <div className="bg-zinc-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-2 flex items-center justify-around shadow-2xl">
          <button
            onClick={() => setShowAbout(true)}
            className="flex flex-col items-center gap-1 p-3 text-gray-400 hover:text-[#c5a059] active:scale-90 transition-all cursor-pointer"
          >
            <BookOpen size={20} />
            <span className="text-[8px] font-black uppercase tracking-tighter">
              Our Story
            </span>
          </button>
        </div>
      </div>

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
            className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-[#0a0a0a]/80 z-[1]" />

        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8">
          <div className="flex items-center justify-center w-full">
            <Image
              src="/logo-bg.jpeg"
              alt="Ethereal Logo"
              width={140}
              height={140}
              className=" mt-8 border border-white/10 shadow-2xl"
            />
          </div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-7xl md:text-8xl lg:text-[9rem] font-serif font-bold tracking-tighter text-white leading-[0.85] uppercase italic"
          >
            Ethereal <br className="hidden md:block" />
            <span
              style={{
                background: `linear-gradient(to right, #fbf2cf 0%, #c5a059 50%, #fbf2cf 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              INN
            </span>
          </motion.h1>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6 px-4">
            <button
              onClick={() => setShowInquiry(true)}
              className="w-full sm:w-auto bg-white/5 backdrop-blur-md border border-white/10 text-white font-black px-12 py-5 rounded-2xl md:rounded-full hover:bg-[#c5a059] hover:text-black transition-all uppercase tracking-widest text-[11px] cursor-pointer"
            >
              Direct Inquiry
            </button>
            <button
              onClick={handleBookingRedirect}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-4 bg-emerald-500 text-slate-950 font-black px-12 py-5 rounded-2xl md:rounded-full hover:bg-emerald-400 transition-all uppercase tracking-widest text-[11px] cursor-pointer shadow-xl shadow-emerald-500/10"
            >
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
            <img
              src={GALLERY_DATA.Culinary[0]}
              className="relative rounded-[3rem] border border-white/10 shadow-2xl grayscale hover:grayscale-0 transition-all duration-1000 w-full object-cover"
              alt="Urban Ambrosia"
            />
            <div className="absolute bottom-10 right-10 bg-black/80 backdrop-blur-xl p-8 rounded-3xl border border-[#c5a059]/30 max-w-xs hidden md:block text-left">
              <UtensilsCrossed className="text-[#c5a059] mb-4" size={32} />
              <h4 className="text-white font-serif text-xl font-bold mb-2">
                Cloud-First Dining
              </h4>
              <p className="text-gray-500 text-xs leading-relaxed">
                Premium delivery optimized for temperature and celestial
                presentation.
              </p>
            </div>
          </div>

          <div className="space-y-8 text-center lg:text-left">
            <h2 className="text-5xl md:text-7xl font-serif font-bold italic leading-none text-white">
              Urban <span className="text-[#c5a059]">Ambrosia.</span>
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed font-light">
              A premium culinary brand under the Ethereal Inn umbrella. We blend
              traditional Indian soul with modern presentation to create the{" "}
              <span className="text-white font-bold italic uppercase tracking-widest">
                Food of Modern Gods.
              </span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 flex flex-col items-center lg:items-start">
                <CheckCircle2 className="text-[#c5a059] mb-3" size={24} />
                <p className="text-white text-sm font-black uppercase tracking-wider">
                  Sattvic Quality
                </p>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 flex flex-col items-center lg:items-start">
                <ChefHat className="text-[#c5a059] mb-3" size={24} />
                <p className="text-white text-sm font-black uppercase tracking-wider">
                  Urban Fusion
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- COLLECTION GALLERY --- */}
      <section className="max-w-6xl mx-auto py-20 px-4">
        <div className="flex flex-col items-center text-center mb-12">
          <h2 className="text-4xl md:text-6xl font-serif font-bold text-white flex items-center gap-4 uppercase italic">
            <Camera className="text-[#c5a059]" /> Gallery Collection
          </h2>
          <div className="mt-10 w-full max-w-md">
            <div className="flex bg-white/5 backdrop-blur-2xl p-1.5 rounded-full border border-white/10">
              {Object.keys(GALLERY_DATA).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveGalleryTab(tab as any)}
                  className={`flex-1 px-4 py-3 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-500 cursor-pointer ${
                    activeGalleryTab === tab
                      ? "bg-[#c5a059] text-black shadow-lg"
                      : "text-slate-500 hover:text-white"
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
              className="aspect-[4/3] rounded-[2.5rem] md:rounded-[4rem] overflow-hidden border border-white/10 group relative shadow-2xl"
            >
              <img
                src={img}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s]"
                alt="Ethereal Spaces"
              />
            </motion.div>
          ))}
        </div>
      </section>

      {/* --- REVIEWS MARQUEE --- */}
      <section className="py-24 border-t border-white/5 overflow-hidden">
        <div className="flex flex-col items-center mb-16 text-center">
          <h2 className="text-5xl md:text-8xl font-serif font-bold tracking-tighter text-white uppercase italic leading-none">
            Voices.
          </h2>
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
        <MultiPropertyMap />
      </section>

      {/* --- MAIN FOOTER --- */}
      <footer className="relative bg-[#050505] pt-24 pb-12 px-6 border-t border-white/5 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#c5a059]/5 blur-[120px] rounded-full -z-10" />
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20 text-left">
            <div className="md:col-span-2 space-y-8">
              <div className="flex flex-col">
                <span className="text-[10px] tracking-[0.5em] uppercase text-gray-500 font-black mb-2">
                  The Collective
                </span>
                <h2 className="text-4xl md:text-5xl font-serif font-bold text-white uppercase italic leading-none">
                  Ethereal <span className="text-[#c5a059]">Inn.</span>
                </h2>
              </div>
              <p className="text-gray-500 text-sm max-w-sm leading-relaxed font-light">
                Redefining the art of urban sanctuary. Where architectural
                elegance meets the divine culinary craft of Urban Ambrosia.
              </p>
              <div className="flex gap-4">
                {[
                  { icon: <Instagram size={18} /> },
                  { icon: <Facebook size={18} /> },
                  { icon: <PhoneCall size={18} /> },
                ].map((social, i) => (
                  <button
                    key={i}
                    className="p-3 rounded-full bg-white/5 border border-white/5 text-gray-400 hover:text-[#c5a059] hover:border-[#c5a059]/30 transition-all cursor-pointer"
                  >
                    {social.icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-white">
                Experience
              </h4>
              <ul className="space-y-4">
                <li>
                  <Link
                    href="/suites"
                    className="text-[11px] font-bold uppercase tracking-widest text-gray-500 hover:text-[#c5a059] transition-colors"
                  >
                    The Suites
                  </Link>
                </li>
                <li>
                  <Link
                    href="/culinary"
                    className="text-[11px] font-bold uppercase tracking-widest text-gray-500 hover:text-[#c5a059] transition-colors"
                  >
                    Urban Ambrosia
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-[11px] font-bold uppercase tracking-widest text-gray-500 hover:text-[#c5a059] transition-colors"
                  >
                    Contact & Inquiry
                  </Link>
                </li>
                 <li>
                  <Link
                    href="/sanctuary"
                    className="text-[11px] font-bold uppercase tracking-widest text-gray-500 hover:text-[#c5a059] transition-colors"
                  >
                    Marketing
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-white">
                Legal
              </h4>
              <ul className="space-y-4 text-[11px] font-bold uppercase tracking-widest text-gray-500">
                <li
                  onClick={() => setPolicyType("privacy")}
                  className="hover:text-[#c5a059] transition-colors cursor-pointer"
                >
                  Privacy Policy
                </li>
                <li
                  onClick={() => setPolicyType("terms")}
                  className="hover:text-[#c5a059] transition-colors cursor-pointer"
                >
                  Terms of Service
                </li>
                <li
                  onClick={() => setPolicyType("refunds")}
                  className="hover:text-[#c5a059] transition-colors cursor-pointer"
                >
                  Refund Policy
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
              <p className="text-[9px] text-gray-600 uppercase tracking-[0.2em] font-black">
                © 2026 Ethereal Inn Collective
              </p>
              <div className="h-px w-8 bg-white/10 hidden md:block" />
              <p className="text-[9px] text-[#c5a059] uppercase tracking-[0.2em] font-black">
                Urban Ambrosia Culinary by Ethereal Inn Hospitality
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.02] border border-white/5 rounded-full">
              <ShieldCheck size={12} className="text-emerald-500" />
              <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest">
                Encrypted Booking Engine
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* --- ABOUT STORY SIDE OVERLAY --- */}
      <AnimatePresence>
        {showAbout && (
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 200 }}
            className="fixed inset-0 z-[1000] bg-[#0a0a0a] text-white overflow-y-auto overflow-x-hidden selection:bg-[#c5a059] selection:text-black font-sans text-center"
          >
            <button
              onClick={() => setShowAbout(false)}
              className="fixed top-8 right-8 z-[1010] bg-white/5 hover:bg-[#c5a059] hover:text-black p-5 rounded-full text-white backdrop-blur-xl transition-all border border-white/10 group shadow-2xl cursor-pointer"
            >
              <X
                size={24}
                className="group-hover:rotate-90 transition-transform"
              />
            </button>

            <div className="relative w-full flex flex-col items-center">
              <section className="relative h-[80dvh] w-full flex items-center justify-center px-6 overflow-hidden">
                <motion.div
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 20, ease: "linear" }}
                  className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2000')] bg-cover bg-center opacity-30 grayscale pointer-events-none"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-transparent to-[#0a0a0a]" />
                <div className="relative z-10 max-w-4xl">
                  <span className="text-[#c5a059] text-[10px] font-black uppercase tracking-[0.6em] mb-6 block">
                    The Collective Legacy
                  </span>
                  <h1 className="text-5xl md:text-[8rem] font-serif font-bold italic leading-[0.9] text-white uppercase">
                    Crafting <span className="text-gray-500">Silence</span>{" "}
                    <br /> & <span className="text-[#c5a059]">Flavor.</span>
                  </h1>
                </div>
              </section>

              <section className="max-w-4xl mx-auto py-24 px-6 space-y-12">
                <p className="text-xl md:text-3xl font-serif text-gray-300 leading-relaxed italic">
                  "Ethereal Inn was born from a simple realization: that modern
                  luxury isn't about excess, but about the{" "}
                  <span className="text-white">intentionality of space</span>{" "}
                  and the{" "}
                  <span className="text-[#c5a059]">purity of nourishment.</span>
                  "
                </p>
                <div className="h-20 w-px bg-gradient-to-b from-[#c5a059] to-transparent mx-auto" />
              </section>

              {/* Board Directors Segment */}
              <section className="max-w-7xl mx-auto py-24 px-6 w-full border-t border-white/5">
                <div className="flex flex-col items-center mb-20">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 mb-4">
                    Founding Board
                  </h2>
                  <h3 className="text-4xl font-serif font-bold italic text-white">
                    The Minds Behind the Magic
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                  {[
                    {
                      name: "Sandeep Kumar Chaudhry",
                      role: "Managing Partner",
                      desc: "Directs the collective vision with a focus on operational precision and strategic web cloud infrastructure configurations.",
                    },
                    {
                      name: "Shyam Kumar Chaudhry",
                      role: "Founder",
                      desc: "The architect of our premium hospitality standards, ensuring every guest feels our trademark pristine touch.",
                    },
                    {
                      name: "Tushar Kumar Chaudhry",
                      role: "Operations Lead",
                      desc: "Master of daily rhythms, bridging operational assets execution parameters with pristine guest care.",
                    },
                  ].map((leader, i) => (
                    <div
                      key={i}
                      className="bg-white/5 p-8 rounded-[3rem] border border-white/5 hover:border-[#c5a059]/30 transition-all duration-300 flex flex-col justify-between min-h-[300px] backdrop-blur-sm"
                    >
                      <div>
                        <h4 className="text-white font-serif text-2xl font-bold italic mb-1">
                          {leader.name}
                        </h4>
                        <p className="text-[#c5a059] text-[9px] font-black uppercase tracking-widest mb-6">
                          {leader.role}
                        </p>
                      </div>
                      <p className="text-gray-500 text-xs leading-relaxed border-t border-white/5 pt-4">
                        {leader.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <footer className="py-12 border-t border-white/5 w-full">
                <p className="text-[9px] text-gray-700 uppercase tracking-[0.4em]">
                  Designed for the Discerning • 2026
                </p>
              </footer>
            </div>
          </motion.div>
        )}

        {/* --- DYNAMIC INTERACTION MODAL BOX (INQUIRY / STAFF ACCESS) --- */}
        {(showInquiry || showLogin || policyType) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/95 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg bg-zinc-900 rounded-[3rem] p-8 md:p-10 relative border border-white/5 shadow-2xl text-left"
            >
              <button
                onClick={() => {
                  setShowInquiry(false);
                  setShowLogin(false);
                  setPolicyType(null);
                }}
                className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors cursor-pointer"
              >
                <X size={24} />
              </button>

              {showInquiry && (
                <form onSubmit={handleInquirySubmit} className="space-y-4">
                  <h3 className="text-2xl font-serif font-bold text-white uppercase italic mb-6">
                    Inquiry <span className="text-[#c5a059]">Desk</span>
                  </h3>
                  {inquirySuccess ? (
                    <div className="text-center py-10 text-emerald-400 font-black uppercase tracking-widest animate-pulse text-sm">
                      ✔ Message Routed Successfully
                    </div>
                  ) : (
                    <>
                      <input
                        required
                        name="name"
                        placeholder="Name"
                        className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-[#c5a059] font-medium text-sm"
                      />
                      <input
                        required
                        name="phone"
                        placeholder="WhatsApp Number"
                        className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-[#c5a059] font-medium text-sm"
                      />
                      <textarea
                        required
                        name="message"
                        placeholder="How can we assist you? (e.g. Booking inquiry details...)"
                        rows={4}
                        className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-[#c5a059] resize-none font-medium text-sm"
                      />
                      <button
                        disabled={isPendingInquiry}
                        className="w-full bg-[#c5a059] text-black font-black py-5 rounded-2xl uppercase text-[11px] tracking-widest cursor-pointer active:scale-[0.98] transition-all disabled:opacity-40"
                      >
                        {isPendingInquiry ? (
                          <Loader2 className="animate-spin mx-auto h-4 w-4" />
                        ) : (
                          "Send Request"
                        )}
                      </button>
                    </>
                  )}
                </form>
              )}

              {showLogin && (
                <form action={formAction} className="space-y-4">
                  <h3 className="text-2xl font-serif font-bold text-white uppercase italic mb-6">
                    Staff <span className="text-[#c5a059]">Access</span>
                  </h3>

                  {/* 🌟 FIXED: Handled action response state logs rendering error alert validations */}
                  {state?.error && (
                    <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/10 text-rose-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-2">
                      <AlertCircle size={14} /> {state.error}
                    </div>
                  )}

                  <input
                    name="email"
                    type="email"
                    placeholder="Email"
                    required
                    className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-[#c5a059] font-medium text-sm"
                  />
                  <input
                    name="password"
                    type="password"
                    placeholder="Passkey"
                    required
                    className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-[#c5a059] font-medium text-sm"
                  />
                  <button
                    disabled={isPending}
                    className="w-full bg-white text-black font-black py-5 rounded-2xl uppercase text-[11px] tracking-widest flex justify-center items-center cursor-pointer active:scale-[0.98] transition-all disabled:opacity-40"
                  >
                    {isPending ? (
                      <Loader2 className="animate-spin text-black h-4 w-4" />
                    ) : (
                      "Verify Terminal"
                    )}
                  </button>
                </form>
              )}

              {policyType && (
                <div className="space-y-6">
                  <h3 className="text-xl font-serif font-bold text-white uppercase italic">
                    {POLICY_CONTENT[policyType].title}
                  </h3>
                  {POLICY_CONTENT[policyType].sections.map((s, i) => (
                    <div key={i} className="space-y-2">
                      <p className="text-[10px] text-[#c5a059] uppercase font-black tracking-wider">
                        {s.h}
                      </p>
                      <p className="text-gray-400 text-sm leading-relaxed font-medium">
                        {s.p}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="bg-white/5 border border-white/10 p-8 md:p-10 rounded-[3rem] w-[350px] md:w-[450px] whitespace-normal flex flex-col justify-between hover:border-[#c5a059]/30 transition-all duration-500 backdrop-blur-sm">
      <div>
        <div className="flex gap-1 mb-6">
          {[...Array(5)].map((_, idx) => (
            <Star
              key={idx}
              size={12}
              className={
                idx < review.rating
                  ? "fill-[#c5a059] text-[#c5a059]"
                  : "text-zinc-700"
              }
            />
          ))}
        </div>
        <p className="text-slate-300 text-sm italic leading-relaxed text-left font-medium">
          "{review.text}"
        </p>
      </div>
      <div className="flex items-center gap-4 mt-8 pt-6 border-t border-white/5">
        <img
          src={review.profile_photo_url}
          className="w-10 h-10 rounded-full grayscale border border-white/10"
          alt=""
        />
        <div className="text-left">
          <h4 className="text-white font-black text-[10px] uppercase tracking-wide">
            {review.author_name}
          </h4>
          <span className="text-[9px] text-zinc-500 uppercase tracking-tighter">
            {review.relative_time_description}
          </span>
        </div>
      </div>
    </div>
  );
}
