import { Metadata } from "next"; 
import React from "react";
import Script from "next/script";
import Image from "next/image";
import { notFound } from "next/navigation";

import { 
  MessageSquare, 
  BedDouble, 
  Utensils, 
  Sparkles, 
  ArrowUpRight, 
  Star,
  Zap,
  ShieldAlert,
  Heart,
  Wallet,
  Clock,
  Briefcase,
  CheckCircle2,
  Wifi,
  FileSpreadsheet
} from "lucide-react";
import { CAMPAIGN_MAP } from "@/app/config/campaigns";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!;

// =========================================================================
// 1. DYNAMIC METADATA GENERATION (AUTOMATIC WHATSAPP LINK PREVIEW CARDS)
// =========================================================================
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const campaign = CAMPAIGN_MAP[id];

  if (!campaign) {
    return {
      title: "Ethereal Inn Sanctuary",
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.etherealinn.com";
  const imageUrl = campaign.primaryImage.startsWith("http")
    ? campaign.primaryImage
    : `${siteUrl}${campaign.primaryImage}`;

  return {
    title: `Ethereal Inn - ${campaign.badge || campaign.title}`,
    description: campaign.subtitle,
    openGraph: {
      title: campaign.title,
      description: campaign.subtitle,
      url: `${siteUrl}/sanctuary/${id}`,
      siteName: "Ethereal Inn Hospitality",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: campaign.title,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: campaign.title,
      description: campaign.subtitle,
      images: [imageUrl],
    },
  };
}

// =========================================================================
// 2. MAIN DYNAMIC LANDING PAGE COMPONENT
// =========================================================================
export default async function DynamicSanctuaryAdPage({ params }: PageProps) {
  const { id } = await params;
  
  // Clean fallback mapping lookup
  const campaign = CAMPAIGN_MAP[id];

  if (!campaign) {
    notFound();
  }

  const whatsappNumber = "918796211849";
  const mainAdLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(campaign.whatsappMessage)}`;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans antialiased selection:bg-amber-500/30 selection:text-amber-200 relative">
      
      {/* 1. ANALYTICS TRACKING */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-dynamic-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', { page_path: '/sanctuary/${id}' });
        `}
      </Script>

      {/* 2. BACKGROUND ARCHITECTURE */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 scale-105"
          style={{ backgroundImage: "url('/logo-bg.jpeg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/80 to-slate-950/95 backdrop-blur-[6px]" />
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-amber-600/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]" />
      </div>

      {/* 3. DYNAMIC HERO BRAND BLOCK */}
      <section className="relative pt-32 pb-12 px-6 max-w-6xl mx-auto text-center z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 backdrop-blur-md mb-8">
          <Star size={14} className="text-amber-500 fill-amber-500" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400">
            <Link href="/sanctuary">
              {campaign.badge || "Exclusive Campaign Offer"}
            </Link>
          </span>
         
        </div>

         <span className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-400 ml-5">
            <Link href="/">
              Return to the home of sanctuaries
            </Link>
          </span>
        
        <h1 className="text-4xl md:text-7xl font-black tracking-tighter text-white mb-6 leading-none uppercase max-w-4xl mx-auto">
          {campaign.title}
        </h1>
        
        <p className="text-gray-300 text-sm md:text-lg max-w-2xl mx-auto leading-relaxed font-medium mb-10 drop-shadow-sm">
          {campaign.subtitle}
        </p>

        <div className="mb-16">
          <a 
            href={mainAdLink}
            target="_blank"
            className="bg-white text-slate-950 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-amber-500 transition-all hover:scale-105 active:scale-95 inline-flex items-center gap-3 shadow-2xl shadow-black/40"
          >
            <MessageSquare size={18} className="fill-slate-950" /> Secure Direct Booking
          </a>
        </div>

        {/* Hero Display Banner */}
        <div className="max-w-4xl mx-auto rounded-[32px] overflow-hidden border border-white/10 shadow-2xl relative h-[250px] md:h-[450px]">
          <Image
            src={campaign.primaryImage}
            alt={campaign.title}
            fill
            priority
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
        </div>
      </section>

      {/* 4A. EXCLUSIVE CONTENT: FOR COUPLES */}
      {id === "couple-friendly-stay" && (
        <section className="relative z-10 max-w-4xl mx-auto px-6 pb-20">
          <div className="bg-slate-900/60 border border-white/10 rounded-[32px] p-8 md:p-12 backdrop-blur-xl shadow-2xl">
            <h3 className="text-xl md:text-2xl font-black text-white tracking-tight mb-8 text-center uppercase">
              Why Couples Choose Ethereal Inn Sanctuaries
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex gap-4 items-start">
                <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl shrink-0"><Heart size={20} /></div>
                <div>
                  <h5 className="font-bold text-gray-200 text-sm mb-1">Uncompromised Discretion & Privacy</h5>
                  <p className="text-slate-400 text-xs leading-relaxed">Enjoy completely private rooms with zero-interruption service architectures. Your tranquility is our ultimate baseline.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl shrink-0"><Wallet size={20} /></div>
                <div>
                  <h5 className="font-bold text-gray-200 text-sm mb-1">Budget-Friendly, Premium Comfort</h5>
                  <p className="text-slate-400 text-xs leading-relaxed">Luxury shouldn&apos;t burn a hole in your pocket. Experience premium linen, neat washrooms, and elite setups at highly accessible daily prices.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl shrink-0"><ShieldAlert size={20} /></div>
                <div>
                  <h5 className="font-bold text-gray-200 text-sm mb-1">Local ID Friendly Check-In</h5>
                  <p className="text-slate-400 text-xs leading-relaxed">Frictionless entry handling with secure verification. Respectful hospitality protocols for all couples and transit professionals.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl shrink-0"><Clock size={20} /></div>
                <div>
                  <h5 className="font-bold text-gray-200 text-sm mb-1">Seamless Transit Connectivity</h5>
                  <p className="text-slate-400 text-xs leading-relaxed">Perfect location alignment. Situated just moments away from the primary Delhi metro networks for simple, direct commuting.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4B. EXCLUSIVE CONTENT: FOR CORPORATE CLIENTS */}
      {id === "corporate-stay" && (
        <section className="relative z-10 max-w-4xl mx-auto px-6 pb-20">
          <div className="bg-slate-900/60 border border-amber-500/20 rounded-[32px] p-8 md:p-12 backdrop-blur-xl shadow-2xl">
            <h3 className="text-xl md:text-2xl font-black text-white tracking-tight mb-2 text-center uppercase">
              Corporate & Executive Transit Features
            </h3>
            <p className="text-xs text-amber-500 font-bold text-center tracking-widest uppercase mb-8">
              Optimized for Institutional Standards
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex gap-4 items-start">
                <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl shrink-0"><FileSpreadsheet size={20} /></div>
                <div>
                  <h5 className="font-bold text-gray-200 text-sm mb-1">Frictionless GST & Corporate Invoicing</h5>
                  <p className="text-slate-400 text-xs leading-relaxed">Get instant, fully compliant itemized GST invoices for smooth corporate tax deductions and company expense filings. No delays.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl shrink-0"><Wifi size={20} /></div>
                <div>
                  <h5 className="font-bold text-gray-200 text-sm mb-1">High-Speed Work Infrastructure</h5>
                  <p className="text-slate-400 text-xs leading-relaxed">Every room configuration comes equipped with uninterrupted high-bandwidth Wi-Fi networks and ergonomically aligned workspace desks.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl shrink-0"><Clock size={20} /></div>
                <div>
                  <h5 className="font-bold text-gray-200 text-sm mb-1">Express Automated Check-In Matrix</h5>
                  <p className="text-slate-400 text-xs leading-relaxed">Skip front-desk lines. Enjoy digital document verification layouts to clear your room entry within 2 minutes of arriving from the airport or station.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl shrink-0"><Briefcase size={20} /></div>
                <div>
                  <h5 className="font-bold text-gray-200 text-sm mb-1">Strategic Corporate Rates &固定 SLAs</h5>
                  <p className="text-slate-400 text-xs leading-relaxed">Access recurring institutional discount tiers for corporate accounts, executive group stays, and long-term transit schedules.</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400"><CheckCircle2 size={14} /> 24/7 Power Backup</span>
              <span className="flex items-center gap-1.5 text-emerald-400"><CheckCircle2 size={14} /> Desk Dining</span>
              <span className="flex items-center gap-1.5 text-emerald-400"><CheckCircle2 size={14} /> Metro Proximity</span>
            </div>
          </div>
        </section>
      )}

      {/* 5. CROSS-SELLING BRAND CATALOGUE */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-32">
        <h2 className="text-center font-black tracking-widest text-[11px] text-slate-500 uppercase mb-12">
          Explore Our Complete Luxury Portfolio
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          
          {/* Card: Suites */}
          <div className={`group relative flex flex-col bg-slate-950/50 border rounded-[40px] backdrop-blur-xl transition-all duration-500 overflow-hidden shadow-xl ${
            id === "couple-friendly-stay" || id === "corporate-stay" 
              ? "border-amber-500/50 ring-2 ring-amber-500/20 scale-[1.02]" 
              : "border-white/10"
          }`}>
            <div className="relative h-48 w-full">
              <Image src="/Matial_2.jpg" alt="Luxury Guest Suites" fill className="object-cover object-center group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
            </div>
            <div className="p-8 pt-4 flex flex-col flex-grow">
              <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center mb-6 border border-amber-500/20"><BedDouble size={22} /></div>
              <h3 className="text-2xl font-black text-white mb-3 tracking-tight">Luxury Guest Suites</h3>
              <p className="text-slate-400 text-xs leading-relaxed font-medium mb-8 flex-grow">Premium urban sanctuaries designed with architectural precision. Featuring automated room structures and elite comfort layers.</p>
              <a href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hello Ethereal Inn, I would like to check availability for your Luxury Guest Suites.")}`} target="_blank" className="flex items-center justify-between w-full bg-white/5 p-4 rounded-2xl group-hover:bg-amber-500 group-hover:text-black transition-all font-bold text-[11px] uppercase tracking-widest">Book A Suite <ArrowUpRight size={16} /></a>
            </div>
          </div>

          {/* Card: Culinary */}
          <div className={`group relative flex flex-col bg-slate-950/50 border rounded-[40px] backdrop-blur-xl transition-all duration-500 overflow-hidden shadow-xl ${
            id === "urban-ambrosia" ? "border-purple-500/50 ring-2 ring-purple-500/20 scale-[1.02]" : "border-white/10"
          }`}>
            <div className="relative h-48 w-full">
              <Image src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80" alt="Urban Ambrosia Luxury Fine Dining" fill className="object-cover object-center group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
            </div>
            <div className="p-8 pt-4 flex flex-col flex-grow">
              <div className="w-12 h-12 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center mb-6 border border-purple-500/20"><Utensils size={22} /></div>
              <h3 className="text-2xl font-black text-white mb-3 tracking-tight">Urban Ambrosia</h3>
              <p className="text-slate-400 text-xs leading-relaxed font-medium mb-8 flex-grow">Experimental culinary masterfully plated. A high-contrast fine-dining wing where vibrant fusion flavors meet atmospheric luxury.</p>
              <a href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hello, I would like to reserve a table experience at Urban Ambrosia Culinary.")}`} target="_blank" className="flex items-center justify-between w-full bg-white/5 p-4 rounded-2xl group-hover:bg-purple-500 group-hover:text-black transition-all font-bold text-[11px] uppercase tracking-widest">Reserve Table <ArrowUpRight size={16} /></a>
            </div>
          </div>

          {/* Card: Glam Studio */}
          <div className={`group relative flex flex-col bg-slate-950/50 border rounded-[40px] backdrop-blur-xl transition-all duration-500 overflow-hidden shadow-xl ${
            id === "glam-studio" ? "border-pink-500/50 ring-2 ring-pink-500/20 scale-[1.02]" : "border-white/10"
          }`}>
            <div className="relative h-48 w-full">
              <Image src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80" alt="Ethereal Glam Studio" fill className="object-cover object-center group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
            </div>
            <div className="p-8 pt-4 flex flex-col flex-grow">
              <div className="w-12 h-12 bg-pink-500/10 text-pink-400 rounded-xl flex items-center justify-center mb-6 border border-pink-500/20"><Sparkles size={22} /></div>
              <h3 className="text-2xl font-black text-white mb-3 tracking-tight">Ethereal Glam Studio</h3>
              <p className="text-slate-400 text-xs leading-relaxed font-medium mb-8 flex-grow">Editorial-grade aesthetic makeovers. Pairing master artists with global luxury brands for bridal and premium styling care.</p>
              <a href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hello, I am looking to book a signature makeover session at Ethereal Glam Studio.")}`} target="_blank" className="flex items-center justify-between w-full bg-white/5 p-4 rounded-2xl group-hover:bg-pink-500 group-hover:text-black transition-all font-bold text-[11px] uppercase tracking-widest">Book Session <ArrowUpRight size={16} /></a>
            </div>
          </div>

        </div>
      </section>

      {/* 6. FOOTER */}
      <footer className="relative z-10 border-t border-white/5 py-16 px-6 text-center bg-slate-950/70 backdrop-blur-md">
        <div className="max-w-4xl mx-auto">
          <Zap size={32} className="mx-auto text-amber-500 mb-6" />
          <h2 className="text-3xl font-black text-white mb-4">Ready for the Experience?</h2>
          <p className="text-slate-400 text-sm mb-10">Connect directly with our elite hospitality desk for customized arrangements.</p>
          
          <a 
            href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hello Ethereal Inn, I am interested in your luxury services. Please share more details.")}`}
            target="_blank"
            className="inline-flex items-center gap-4 text-amber-500 hover:text-white transition-colors text-lg font-bold"
          >
            <MessageSquare className="fill-amber-500 group-hover:fill-white transition-colors" /> +91 87962 11849
          </a>
          
          <div className="mt-16 text-[9px] uppercase tracking-[0.4em] text-slate-500 font-bold">
            Ethereal Inn Hospitality LLP · New Delhi
          </div>
        </div>
      </footer>
    </div>
  );
}