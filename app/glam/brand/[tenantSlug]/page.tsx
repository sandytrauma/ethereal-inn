// app/glam/brand/[tenantSlug]/page.tsx
import React from "react";
import { db } from "@/db";
import { salonTenants, salonOutlets, salonServices } from "@/db/glam-schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Script from "next/script";
import { getSalonSession } from "@/lib/salon-token"; 
import { MapPin, Phone, Clock, Sparkles, Settings2, Scissors, Sparkle, Camera, MessageSquare, HelpCircle } from "lucide-react";
import Link from "next/link";

// Drop-in your component settings configuration panel dynamically
import BrandSettingsTerminal from "@/components/BrandSettingTerminal";

interface BrandPageProps {
  params: Promise<{ tenantSlug: string }>;
  searchParams: Promise<{ studio?: string }>; 
}

const LOOKBOOK_GALLERY = [
  { id: 1, src: "https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=600&auto=format&fit=crop", title: "Couture Balayage", tag: "HAIR LAB" },
  { id: 2, src: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=600&auto=format&fit=crop", title: "Bridal Glow Premium", tag: "MAKEOVER" },
  { id: 3, src: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=600&auto=format&fit=crop", title: "Aesthetic Skin Revival", tag: "CLINICAL" },
  { id: 4, src: "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=600&auto=format&fit=crop", title: "Precision Editorial Crop", tag: "STYLING" },
  { id: 5, src: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=600&auto=format&fit=crop", title: "High-Gloss Glass Mani", tag: "NAIL BAR" },
  { id: 6, src: "https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?q=80&w=600&auto=format&fit=crop", title: "Ethereal Waves Treatment", tag: "THERAPY" },
];

const BRAND_FAQS = [
  { q: "Do I need to book an appointment in advance?", a: "While we accommodate walk-ins based on fractional chair availability, we highly recommend confirming your booking online via our store terminal layer to lock in your preferred stylist node." },
  { q: "What premium material formulations do you use?", a: "Our outlets exclusively utilize sustainable, clinically verified, high-end backbar luxury lines optimized for custom skin thresholds and hair health structural safety." },
];

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const { tenantSlug } = resolvedParams;
  
  const [tenant] = await db
    .select()
    .from(salonTenants)
    .where(eq(salonTenants.slug, tenantSlug.toLowerCase().trim()))
    .limit(1);

  if (!tenant) return {};

  return {
    title: tenant.brandMetaTitle || `${tenant.businessName} | Luxury Salon Experience`,
    description: tenant.brandMetaDescription || tenant.brandBio || `Book appointments online at ${tenant.businessName}.`,
    openGraph: {
      title: tenant.brandMetaTitle || tenant.businessName,
      description: tenant.brandMetaDescription || tenant.brandBio || "",
      images: tenant.brandBannerUrl ? [{ url: tenant.brandBannerUrl }] : [],
    },
  };
}

export default async function PublicTenantBrandPage({ params, searchParams }: BrandPageProps) {
  const resolvedParams = await params;
  const { tenantSlug } = resolvedParams;
  const resolvedSearchParams = await searchParams;
  const { studio } = resolvedSearchParams;

  const tenantRows = await db
    .select()
    .from(salonTenants)
    .where(eq(salonTenants.slug, tenantSlug.toLowerCase().trim()))
    .limit(1);

  const tenant = tenantRows[0];

  if (!tenant || tenant.subscriptionStatus !== "active") {
    notFound();
  }

  const outlets = await db
    .select()
    .from(salonOutlets)
    .where(eq(salonOutlets.tenantId, tenant.id));

  // 🌟 FIXED: Removed .limit(6) restriction so newly added custom services are visible publicly
  const services = await db
    .select()
    .from(salonServices)
    .where(eq(salonServices.tenantId, tenant.id));

  const session = await getSalonSession();
  const isVerifiedTenantOwner = 
    session && 
    String(session.tenantId) === String(tenant.id) && 
    session.slug?.toLowerCase().trim() === tenant.slug.toLowerCase().trim();

  const isStudioOpen = studio === "active" && isVerifiedTenantOwner;

  const whatsappPhone = outlets[0]?.phone ? outlets[0].phone.replace(/[^0-9]/g, "") : "91XXXXXXXXXX";

  const formatCurrency = (amount: string | number) => {
    return `₹${parseFloat(String(amount)).toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-pink-500 selection:text-white pb-24 relative">
      
      {tenant.googleAnalyticsId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${tenant.googleAnalyticsId}`} strategy="afterInteractive" />
          <Script id="google-analytics-dynamic-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${tenant.googleAnalyticsId}', { page_path: window.location.pathname });
            `}
          </Script>
        </>
      )}

      {isVerifiedTenantOwner && (
        <div className="sticky top-0 left-0 right-0 z-[99] bg-slate-900 border-b border-pink-500/30 p-3 flex flex-col items-center justify-center gap-3 shadow-xl backdrop-blur-md select-none">
          <div className="max-w-5xl w-full flex items-center justify-between text-xs px-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-pink-500 animate-ping" />
              <p className="font-medium text-slate-300">
                Recognized Operator Identity: <span className="text-white font-bold">{session.name}</span> ({tenant.businessName})
              </p>
            </div>
            <Link
              href={isStudioOpen ? `/glam/brand/${tenant.slug}` : `/glam/brand/${tenant.slug}?studio=active`}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-950/40 hover:bg-pink-900/50 border border-pink-800/40 rounded-lg text-pink-400 font-bold tracking-wide transition cursor-pointer"
            >
              <Settings2 size={13} />
              {isStudioOpen ? "Close Customization Console" : "Open Brand Customization Studio"}
            </Link>
          </div>
          {isStudioOpen && (
            <div className="w-full max-w-5xl px-2 pt-2 animate-fade-in pb-4">
              <BrandSettingsTerminal tenantProfile={tenant} publicServices={services} />
            </div>
          )}
        </div>
      )}

      {/* Hero Cover Banner Section */}
      <div className="relative h-64 md:h-[45vh] w-full bg-slate-900 border-b border-slate-900 overflow-hidden">
        {tenant.brandBannerUrl ? (
          <img src={tenant.brandBannerUrl} className="w-full h-full object-cover opacity-80 object-center" alt={tenant.businessName} />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-pink-950/20 via-slate-900 to-rose-950/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
      </div>

      {/* Corporate Identity Profile Core */}
      <div className="max-w-5xl mx-auto px-4 -mt-20 relative z-10 space-y-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-slate-900">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
            <div className="w-32 h-32 bg-slate-900 border-2 border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center p-2 shadow-2xl backdrop-blur-xl">
              {tenant.brandLogoUrl ? (
                <img src={tenant.brandLogoUrl} className="max-w-full max-h-full object-contain rounded-xl" alt="Logo" />
              ) : (
                <Sparkles className="w-12 h-12 text-pink-500 animate-pulse" />
              )}
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white uppercase font-serif italic">
                {tenant.businessName}
              </h1>
              <p className="text-sm text-pink-400 font-mono tracking-wider">
                {tenant.slug}.etherealinn.com
              </p>
            </div>
          </div>

          <a
            href={`https://wa.me/${whatsappPhone}?text=Hi%20there!%20I%20would%20like%20to%20confirm%20an%20appointment%20booking%20at%20${encodeURIComponent(tenant.businessName)}.`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black rounded-xl text-center shadow-lg transition transform active:scale-95 text-xs uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <MessageSquare size={14} />
            Confirm Booking via WhatsApp
          </a>
        </div>

        {/* Biography & Detailed Info Panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <Sparkle size={12} className="text-pink-500" /> About Our Studio Vision
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed font-medium whitespace-pre-line bg-slate-900/30 border border-slate-900 p-6 rounded-2xl backdrop-blur-sm">
              {tenant.brandBio || "Welcome to our premier brand showcase portfolio page. Experience top-tier artisan styling, aesthetic clinical procedures, and exceptional grooming curation tailored directly to your lifestyle needs."}
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <MapPin size={12} className="text-pink-500" /> Strategic Outlets
            </h2>
            <div className="space-y-3">
              {outlets.length === 0 ? (
                <p className="text-xs text-slate-600 italic">No public branches mapped yet.</p>
              ) : (
                outlets.map((branch) => (
                  <div key={branch.id} className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl space-y-2.5 shadow-md backdrop-blur-xs">
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">{branch.name}</h3>
                    <div className="space-y-1 text-[11px] text-slate-400 font-medium leading-relaxed">
                      <p className="truncate text-slate-300">{branch.address}</p>
                      <p className="text-slate-500 font-mono">P: {branch.phone}</p>
                      <p className="text-pink-500/80 font-mono text-[10px] uppercase tracking-wider mt-1">
                        ⏱️ {branch.operatingHoursOpen} — {branch.operatingHoursClose}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* DYNAMIC INTERACTIVE SERVICES PRICE MATRIX BLOCK */}
        <div className="space-y-6 pt-6">
          <div className="flex items-center justify-between border-b border-slate-900 pb-4">
            <div>
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Scissors size={12} className="text-pink-500" /> The Treatment Lookbook Menu
              </h2>
              <p className="text-xs text-slate-400 mt-1">Explore our high-end grooming treatments, aesthetic procedures, and styling pricing tiers.</p>
            </div>
          </div>

          {services.length === 0 ? (
            <div className="text-center py-10 bg-slate-900/10 border border-dashed border-slate-900 rounded-2xl text-xs text-slate-500">
              No service treatments currently listed on the public catalog layer.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((service) => (
                <div key={service.id} className="p-5 bg-gradient-to-br from-slate-900/50 to-slate-900/20 border border-slate-900 rounded-2xl flex items-start justify-between gap-4 group hover:border-slate-800 transition-colors">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-100 group-hover:text-pink-400 transition-colors">{service.name}</h3>
                      {service.isAestheticProcedure && (
                        <span className="text-[8px] font-black uppercase tracking-widest bg-pink-500/10 text-pink-400 border border-pink-500/20 px-1.5 py-0.5 rounded-md">
                          Clinical
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 max-w-sm line-clamp-2 leading-relaxed">{service.description || "Tailored luxury backbar configuration session including diagnostic health checks."}</p>
                    <span className="inline-block text-[10px] font-mono font-bold text-slate-500">⏱️ {service.durationMinutes} Mins Allocation</span>
                  </div>
                  <div className="text-right flex-shrink-0 flex flex-col items-end gap-2">
                    <span className="text-base font-mono font-black text-white">{formatCurrency(service.price)}</span>
                    <a
                      href={`https://wa.me/${whatsappPhone}?text=Hi%20there!%20I%20want%20to%20confirm%20a%20booking%20for%20the%20following%20service:%20${encodeURIComponent(service.name)}%20(${service.durationMinutes}%20mins)%20at%20${encodeURIComponent(tenant.businessName)}.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-slate-950 border border-slate-800 text-[10px] font-black uppercase tracking-wider rounded-md text-emerald-400 hover:bg-emerald-600 hover:text-white hover:border-emerald-500 transition-all flex items-center gap-1"
                    >
                      Book Now
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* BRAND PORTFOLIO / LOOKBOOK MARKETING GRID VISUALS LAYER */}
        <div className="space-y-6 pt-6">
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <Camera size={12} className="text-pink-500" /> Client Transformations & Studio Lookbook
            </h2>
            <p className="text-xs text-slate-400 mt-1">Real artistry executed directly across our high-performing artisan chairs and clinical asset beds.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {LOOKBOOK_GALLERY.map((img) => (
              <div key={img.id} className="group relative aspect-[4/5] rounded-2xl overflow-hidden border border-slate-900 bg-slate-900 shadow-lg">
                <img src={img.src} alt={img.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-90 transition-opacity" />
                <div className="absolute bottom-4 left-4 right-4 translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-[9px] text-pink-400 font-mono font-bold tracking-widest uppercase">{img.tag}</p>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wide mt-0.5 truncate">{img.title}</h4>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MARKETING TRUST MODULES (FAQ SECTION) */}
        <div className="space-y-6 pt-6">
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <HelpCircle size={12} className="text-pink-500" /> Frequently Asked Questions
            </h2>
            <p className="text-xs text-slate-400 mt-1">Clear answers regarding booking policies, operations, and custom diagnostic tracks.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {BRAND_FAQS.map((faq, i) => (
              <div key={i} className="p-5 bg-slate-900/20 border border-slate-900 rounded-2xl space-y-2">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide flex items-start gap-2">
                  <span className="text-pink-500 font-mono">Q.</span> {faq.q}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed font-medium pl-4 border-l border-slate-800">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}