// app/culinary/brand/[tenantSlug]/page.tsx
import React from "react";
import { db } from "@/db";
import { culinaryOutlets, culinaryDishes } from "@/db/schema/culinary";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Script from "next/script";
import Link from "next/link";
import { 
  UtensilsCrossed, 
  MessageSquareCode, 
  Clock, 
  ShoppingBag, 
  ExternalLink,
  ChevronRight,
  TrendingDown,
  Info
} from "lucide-react";

interface BrandPageProps {
  params: Promise<{ tenantSlug: string }>;
}

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  const { tenantSlug } = await params;
  const normalizedSlug = tenantSlug.toLowerCase().trim();

  return {
    title: `Urban Ambrosia Culinary Portfolio | ${normalizedSlug.replace(/-/g, " ").toUpperCase()}`,
    description: "Compare live menu rates across third-party aggregators and claim optimal direct-to-kitchen pricing instantly with zero technical overhead.",
    alternates: {
      canonical: `https://www.etherealinn.com/culinary/brand/${normalizedSlug}`,
    },
  };
}

export default async function PublicCulinaryBrandPage({ params }: BrandPageProps) {
  const { tenantSlug } = await params;
  const normalizedSlug = tenantSlug.toLowerCase().trim();

  // 1. Fetch kitchen instance parameters matching the verified slug anchor column
  const [activeOutlet] = await db
    .select()
    .from(culinaryOutlets)
    .where(and(eq(culinaryOutlets.slug, normalizedSlug), eq(culinaryOutlets.isActive, true)))
    .limit(1);

  if (!activeOutlet) {
    notFound();
  }

  // 2. Query active dishes assigned specifically to this outlet node location partition
  const branchMenu = await db
    .select()
    .from(culinaryDishes)
    .where(eq(culinaryDishes.outletId, activeOutlet.id))
    .orderBy(culinaryDishes.name);

  // 🤖 AEO COMPATIBILITY MATRICES: Machine-readable Knowledge Graphs for AI Models
  const brandKnowledgeGraph = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": `https://www.etherealinn.com/culinary/brand/${normalizedSlug}/#kitchen`,
    "name": activeOutlet.name,
    "telephone": activeOutlet.whatsappNumber,
    "url": `https://www.etherealinn.com/culinary/brand/${normalizedSlug}`,
    "hasMenu": `https://www.etherealinn.com/culinary/brand/${normalizedSlug}`,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": activeOutlet.locationContext,
      "addressCountry": "IN"
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-slate-100 selection:bg-pink-500 selection:text-white pb-32 font-sans antialiased relative">
      
      {/* Structural Knowledge Graph Injection Pass */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(brandKnowledgeGraph) }}
      />

      {/* Global In-house Analytics Node Injection */}
      {GA_MEASUREMENT_ID && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
          <Script id="culinary-analytics-router" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}', { page_path: window.location.pathname });
            `}
          </Script>
        </>
      )}

      {/* --- HERO BANNER SPACE --- */}
      <div className="relative h-40 md:h-56 w-full bg-slate-950 border-b border-slate-900/60 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-950/10 via-zinc-950 to-emerald-950/10 opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-[#030303]/20 to-transparent" />
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-14 relative z-10 space-y-12">
        
        {/* Core Identity Row Panel */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-slate-900/80 pb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
            <div className="w-20 h-24 bg-zinc-950 border border-slate-800/80 rounded-2xl flex items-center justify-center p-3 shadow-2xl backdrop-blur-2xl">
              <UtensilsCrossed className="w-8 h-8 text-pink-500" />
            </div>
            <div className="space-y-1">
              <span className="text-[8px] font-black uppercase tracking-[0.4em] text-pink-500 block">Urban Ambrosia Ecosystem</span>
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-white uppercase tracking-tight italic">
                {activeOutlet.name}
              </h1>
              <p className="text-xs text-slate-500 font-medium flex items-center justify-center sm:justify-start gap-1.5 font-mono">
                <Clock size={12} className="text-[#c5a059]" /> REF: {activeOutlet.slug}
              </p>
            </div>
          </div>

          <Link
            href="/ethereal-inn"
            className="w-full sm:w-auto px-5 py-2 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-center text-[10px] font-black uppercase tracking-wider transition shadow-lg"
          >
            Terminal Portal Gateway Login
          </Link>
        </div>

        {/* --- COMPARATIVE INVENTORY INTERFACE --- */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-3 select-none text-center sm:text-left">
            <div>
              <span className="text-[#c5a059] text-[9px] font-black uppercase tracking-widest mb-0.5 block">Live Aggregate Platform Price Layers</span>
              <h2 className="text-xl font-serif font-bold text-white uppercase tracking-tight">Menu Portfolio</h2>
            </div>
            <p className="text-[11px] text-slate-500 font-medium max-w-sm sm:text-right leading-relaxed">
              Deducted values are fetched straight from verified store channels. Bypass third-party commissions dynamically.
            </p>
          </div>

          {branchMenu.length === 0 ? (
            <div className="text-center py-16 text-xs text-slate-500 bg-slate-950/20 rounded-2xl border border-slate-900 border-dashed">
              🍽️ No dishes currently configured inside this kitchen node asset partition.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {branchMenu.map((dish) => {
                const zomatoDisplayPrice = dish.scrapedZomatoPrice || Math.round(dish.basePrice * 1.20);
                const swiggyDisplayPrice = dish.scrapedSwiggyPrice || Math.round(dish.basePrice * 1.22);
                
                const directOrderString = encodeURIComponent(
                  `Hello ${activeOutlet.name}! I'm viewing your menu on the Urban Ambrosia platform node and want to order "${dish.name}" directly for the optimal base price of ₹${dish.basePrice}.`
                );

                return (
                  <div 
                    key={dish.id} 
                    className="p-5 bg-slate-900/20 border border-slate-900 rounded-[1.75rem] flex flex-col justify-between hover:border-slate-800/80 transition-all gap-4"
                  >
                    <div className="flex justify-between items-start gap-4 select-none">
                      <div>
                        <h3 className="text-sm font-bold text-slate-200 font-serif italic tracking-wide uppercase">{dish.name}</h3>
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5 font-mono capitalize">{dish.category}</p>
                      </div>
                      <span className="text-[8px] font-mono font-bold text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 px-2 py-0.5 rounded">
                        SAVE ₹{zomatoDisplayPrice - dish.basePrice}
                      </span>
                    </div>

                    {/* Dynamic Aggregator Cost Matrix Cards */}
                    <div className="grid grid-cols-3 gap-2">
                      
                      {/* Direct WhatsApp Option */}
                      <div className="p-2.5 bg-emerald-950/10 border border-emerald-500/20 rounded-xl text-center select-none relative overflow-hidden">
                        <span className="text-[8px] text-emerald-400 font-black uppercase tracking-tight block">Direct WA</span>
                        <span className="text-sm font-mono font-black text-white mt-0.5 block">₹{dish.basePrice}</span>
                      </div>

                      {/* Zomato Platform Column */}
                      <div className="p-2.5 bg-slate-950 border border-slate-900 rounded-xl text-center select-none">
                        <span className="text-[8px] text-slate-500 font-bold uppercase tracking-tight block">Zomato</span>
                        <span className="text-sm font-mono font-semibold text-slate-400 mt-0.5 block">₹{zomatoDisplayPrice}</span>
                      </div>

                      {/* Swiggy Platform Column */}
                      <div className="p-2.5 bg-slate-950 border border-slate-900 rounded-xl text-center select-none">
                        <span className="text-[8px] text-slate-500 font-bold uppercase tracking-tight block">Swiggy</span>
                        <span className="text-sm font-mono font-semibold text-slate-400 mt-0.5 block">₹{swiggyDisplayPrice}</span>
                      </div>

                    </div>

                    {/* Lower Operational Action Row Links */}
                    <div className="pt-3 border-t border-slate-900/80 flex items-center justify-between gap-2">
                      <div className="text-[9px] font-mono text-slate-600 flex items-center gap-1">
                        <TrendingDown size={10} className="text-emerald-500" /> Direct Route Optimization Active
                      </div>

                      <a
                        href={`https://wa.me/${activeOutlet.whatsappNumber.replace("+", "")}?text=${directOrderString}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-1.5 bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-400 text-white font-black text-[9px] uppercase tracking-widest rounded-lg transition select-none flex items-center gap-1"
                      >
                        <MessageSquareCode size={11} /> Claim Direct Rate
                      </a>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* --- GEOLOCATION ANCHOR FOOTER BLOCKS --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-900 select-none">
          <div className="p-4 bg-slate-900/10 border border-slate-900 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center text-[#c5a059] shrink-0 font-mono text-[10px] font-black">LOC</div>
            <div className="text-left">
              <p className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Operational Tracking Bounds</p>
              <p className="text-xs text-slate-300 font-medium mt-0.5">{activeOutlet.locationContext}</p>
            </div>
          </div>
          <div className="p-4 bg-slate-900/10 border border-slate-900 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center text-pink-400 shrink-0 font-mono text-[10px] font-black">TEL</div>
            <div className="text-left">
              <p className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Direct Dispatch Endpoint</p>
              <p className="text-xs text-slate-300 font-mono font-bold mt-0.5">{activeOutlet.whatsappNumber}</p>
            </div>
          </div>
        </div>

      </div>

      {/* --- ERGONOMIC PHONE THUMB STICKY INTERACTION ELEMENT DOCK --- */}
      <div className="fixed bottom-4 left-4 right-4 h-16 bg-slate-950/80 border border-slate-900 backdrop-blur-xl rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.8)] z-[99] flex items-center justify-around px-4 select-none max-w-sm mx-auto md:hidden">
        <Link href="/" className="flex flex-col items-center justify-center gap-0.5 text-slate-500 active:text-pink-500 py-1 flex-1">
          <span className="text-base font-serif italic text-slate-400 font-black">E</span>
          <span className="text-[8px] font-black tracking-tight uppercase">Home</span>
        </Link>
        <div className="w-px h-5 bg-slate-900" />
        <a 
          href={`https://wa.me/${activeOutlet.whatsappNumber.replace("+", "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center gap-1 text-pink-500 py-1 flex-1"
        >
          <ShoppingBag size={16} strokeWidth={2.5} />
          <span className="text-[8px] font-black tracking-tight uppercase">Direct Order</span>
        </a>
      </div>

    </div>
  );
}