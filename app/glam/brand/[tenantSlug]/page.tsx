// app/glam/brand/[tenantSlug]/page.tsx
import React from "react";
import { db } from "@/db";
import { salonTenants, salonOutlets } from "@/db/glam-schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Script from "next/script";
import { getSalonSession } from "@/lib/salon-token"; 
import { MapPin, Phone, Clock, Sparkles, Settings2 } from "lucide-react";
import Link from "next/link";

// Drop-in your component settings configuration panel dynamically
import BrandSettingsTerminal from "@/components/BrandSettingTerminal";

interface BrandPageProps {
  params: Promise<{ tenantSlug: string }>;
  searchParams: Promise<{ studio?: string }>; 
}

// =========================================================================
// 🚀 Dynamic SEO Metadata Compiler Engine
// =========================================================================
export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  // 🌟 FIXED: Await the params promise block completely before destructuring values
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

// =========================================================================
// Core Public View Controller Node
// =========================================================================
export default async function PublicTenantBrandPage({ params, searchParams }: BrandPageProps) {
  // 🌟 FIXED: Await both routing promises safely to avoid Next.js asynchronous data-leak locks
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const { tenantSlug } = resolvedParams;
  const { studio } = resolvedSearchParams;

  // 1. Safe fetch assignment layer to protect against empty array destructuring crashes
  const tenantRows = await db
    .select()
    .from(salonTenants)
    .where(eq(salonTenants.slug, tenantSlug.toLowerCase().trim()))
    .limit(1);

  const tenant = tenantRows[0];

  if (!tenant || tenant.subscriptionStatus !== "active") {
    notFound();
  }

  // 2. Fetch all physical outlet branches registered to this brand record
  const outlets = await db
    .select()
    .from(salonOutlets)
    .where(eq(salonOutlets.tenantId, tenant.id));

  // 3. 🛡️ SERVER-SIDE IDENTITY VERIFICATION FOR THE INLINE STUDIO GATEWAY
  const session = await getSalonSession();
  const isVerifiedTenantOwner = 
    session && 
    String(session.tenantId) === String(tenant.id) && 
    session.slug?.toLowerCase().trim() === tenant.slug.toLowerCase().trim();

  const isStudioOpen = studio === "active" && isVerifiedTenantOwner;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-pink-500 selection:text-white pb-12 relative">
      
      {/* 📊 ISOLATED DYNAMIC GOOGLE ANALYTICS SCRIPT INJECTION */}
      {tenant.googleAnalyticsId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${tenant.googleAnalyticsId}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics-dynamic-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${tenant.googleAnalyticsId}', {
                page_path: window.location.pathname,
              });
            `}
          </Script>
        </>
      )}

      {/* =========================================================================
          🌟 INLINE PORTAL BRANDING SETTINGS DRAWER (TENANT OPERATORS ONLY)
         ========================================================================= */}
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

          {/* If toggled open, render the UploadThing metadata control terminal directly inside view */}
          {isStudioOpen && (
            <div className="w-full max-w-5xl px-2 pt-2 animate-fade-in pb-4">
              <BrandSettingsTerminal tenantProfile={tenant} />
            </div>
          )}
        </div>
      )}

      {/* Hero Cover Banner Section */}
      <div className="relative h-64 md:h-96 w-full bg-slate-900 border-b border-slate-800 overflow-hidden">
        {tenant.brandBannerUrl ? (
          <img 
            src={tenant.brandBannerUrl} 
            className="w-full h-full object-cover opacity-90 object-center transition-opacity duration-300" 
            alt={tenant.businessName} 
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-pink-950/20 via-slate-900 to-rose-950/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
      </div>

      {/* Corporate Identity Profile Profile Core */}
      <div className="max-w-5xl mx-auto px-4 -mt-20 relative z-10 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-900">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
            <div className="w-32 h-32 bg-slate-900 border-2 border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center p-2 shadow-2xl backdrop-blur-xl">
              {tenant.brandLogoUrl ? (
                <img src={tenant.brandLogoUrl} className="max-w-full max-h-full object-contain rounded-xl" alt="Logo" />
              ) : (
                <Sparkles className="w-12 h-12 text-pink-500 animate-pulse" />
              )}
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-black tracking-tight text-white uppercase font-serif italic">
                {tenant.businessName}
              </h1>
              <p className="text-sm text-pink-400 font-mono">
                {tenant.slug}.etherealinn.com
              </p>
            </div>
          </div>

          <Link
            href="/glam/login"
            className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-400 text-white font-black rounded-xl text-center shadow-lg transition transform active:scale-95 text-sm uppercase tracking-wide"
          >
            Launch Internal Store Terminal
          </Link>
        </div>

        {/* Business Biography & Detailed Panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">About Our Studio Portfolio</h2>
            <p className="text-sm text-slate-300 leading-relaxed font-medium whitespace-pre-line bg-slate-900/20 border border-slate-900 p-5 rounded-2xl">
              {tenant.brandBio || "Welcome to our premier brand showcase portfolio page. Custom services descriptions coming soon."}
            </p>
          </div>

          {/* Location Branches Runway */}
          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Our Operational Branches</h2>
            <div className="space-y-3">
              {outlets.map((branch) => (
                <div key={branch.id} className="p-4 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-3 shadow-md">
                  <h3 className="text-sm font-bold text-slate-200">{branch.name}</h3>
                  <div className="space-y-1.5 text-xs text-slate-400 font-medium">
                    <div className="flex items-center gap-2">
                      <MapPin size={13} className="text-pink-500 flex-shrink-0" />
                      <span className="truncate">{branch.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={13} className="text-pink-500 flex-shrink-0" />
                      <span>{branch.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <Clock size={13} className="text-pink-500 flex-shrink-0" />
                      <span>{branch.operatingHoursOpen} - {branch.operatingHoursClose}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}