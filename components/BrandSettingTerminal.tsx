"use client";

import React, { useState, useTransition } from "react";
import { UploadButton } from "@/lib/uploadthing"; 
import { updateTenantBrandAction } from "@/lib/actions/salon-brand-update"; 
import { useRouter } from "next/navigation";

export default function BrandSettingsTerminal({ tenantProfile }: { tenantProfile: any }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // 1. Media Assets State Hooks
  const [logo, setLogo] = useState(tenantProfile.brandLogoUrl || "");
  const [banner, setBanner] = useState(tenantProfile.brandBannerUrl || "");

  // 2. Text Form & SEO Parameters State Hooks
  const [businessName, setBusinessName] = useState(tenantProfile.businessName || "");
  const [brandBio, setBrandBio] = useState(tenantProfile.brandBio || "");
  const [brandMetaTitle, setBrandMetaTitle] = useState(tenantProfile.brandMetaTitle || "");
  const [brandMetaDescription, setBrandMetaDescription] = useState(tenantProfile.brandMetaDescription || "");
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState(tenantProfile.googleAnalyticsId || "");

  // =========================================================================
  // ⚡ CENTRALIZED PERSISTENCE ENGINE (Handles Image Auto-Save & Manual Text Saves)
  // =========================================================================
  const handleDatabaseSync = async (nextLogo = logo, nextBanner = banner) => {
    startTransition(async () => {
      const payload = {
        businessName,
        brandBio,
        brandLogoUrl: nextLogo,
        brandBannerUrl: nextBanner,
        brandMetaTitle,
        brandMetaDescription,
        googleAnalyticsId,
      };

      const res = await updateTenantBrandAction(payload);

      if (res.success) {
        // Clear route cache to instantly render fresh layouts on the brand viewport
        router.refresh();
      } else {
        console.error("Failed to update tenant branding profile layout:", res.error);
      }
    });
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-6 max-w-4xl relative overflow-hidden text-slate-200">
      
      {/* Visual Sync Overlay Loader */}
      {isPending && (
        <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-pink-400 select-none animate-pulse">
            <span className="h-2 w-2 rounded-full bg-pink-500 animate-ping" />
            Synchronizing Branding Matrix to Database...
          </div>
        </div>
      )}

      <div>
        <h2 className="text-md font-bold text-slate-200 tracking-wide">Brand Portal Personalization Studio</h2>
        <p className="text-xs text-slate-500 mt-0.5">Configure public asset listings, content biographies, and search engine metadata.</p>
      </div>

      {/* =========================================================================
          IMAGE UPLOAD TRACK (AUTOMATED AUTO-SAVE CHANNELS)
         ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-slate-800/60">
        {/* Logo Media Slot */}
        <div className="space-y-2">
          <label className="block text-[11px] font-bold uppercase text-slate-400 tracking-wider">Studio Identity Logo</label>
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col items-center justify-center text-center space-y-3 min-h-[150px]">
            {logo ? (
              <img src={logo} className="w-14 h-14 object-contain rounded-lg border border-slate-800 p-1" alt="Logo preview" />
            ) : (
              <div className="text-xs text-slate-600 italic">No Image Configured</div>
            )}
            <UploadButton
              endpoint="imageUploader"
              onClientUploadComplete={(res) => {
                const targetUrl = res[0].ufsUrl || res[0].url;
                setLogo(targetUrl);
                handleDatabaseSync(targetUrl, banner); // Auto-saves changes inside database instantly
              }}
              className="ut-button:bg-pink-600 ut-button:text-xs ut-button:h-8 ut-button:rounded-lg ut-allowed-content:hidden"
            />
          </div>
        </div>

        {/* Banner Media Slot */}
        <div className="space-y-2">
          <label className="block text-[11px] font-bold uppercase text-slate-400 tracking-wider">Showcase Cover Banner</label>
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col items-center justify-center text-center space-y-3 min-h-[150px]">
            {banner ? (
              <img src={banner} className="w-full h-10 object-cover rounded-lg border border-slate-800" alt="Banner preview" />
            ) : (
              <div className="text-xs text-slate-600 italic">No Cover Added</div>
            )}
            <UploadButton
              endpoint="imageUploader"
              onClientUploadComplete={(res) => {
                const targetUrl = res[0].ufsUrl || res[0].url;
                setBanner(targetUrl);
                handleDatabaseSync(logo, targetUrl); // Auto-saves changes inside database instantly
              }}
              className="ut-button:bg-pink-600 ut-button:text-xs ut-button:h-8 ut-button:rounded-lg ut-allowed-content:hidden"
            />
          </div>
        </div>
      </div>

      {/* =========================================================================
          TEXT CONTENT & SEO DATA CONTROLS (MANUAL SAVE TRACK)
         ========================================================================= */}
      <div className="space-y-4 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Business Display Name</label>
            <input 
              type="text" 
              value={businessName} 
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-pink-500/50 transition font-medium"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Google Analytics Measurement ID (GA4)</label>
            <input 
              type="text" 
              placeholder="G-XXXXXXXXXX"
              value={googleAnalyticsId} 
              onChange={(e) => setGoogleAnalyticsId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-100 focus:outline-none focus:border-pink-500/50 transition uppercase"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Search Engine SEO Title (Meta Title)</label>
          <input 
            type="text" 
            placeholder="Ex: Ethereal Glam Studio | Premium Luxury Hair Design & Styling"
            value={brandMetaTitle} 
            onChange={(e) => setBrandMetaTitle(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-pink-500/50 transition font-medium"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Search Engine Snippet Summary (Meta Description)</label>
          <textarea 
            rows={2}
            placeholder="Provide a brief search result description summarizing your studio's premium experiences..."
            value={brandMetaDescription} 
            onChange={(e) => setBrandMetaDescription(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-pink-500/50 transition resize-none font-medium leading-relaxed"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Studio Public Biography Profile</label>
          <textarea 
            rows={4}
            placeholder="Describe your salon history, specialties, styling philosophy, and atmosphere context..."
            value={brandBio} 
            onChange={(e) => setBrandBio(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-pink-500/50 transition resize-none font-medium leading-relaxed"
          />
        </div>

        {/* Manual Content Sync Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={() => handleDatabaseSync()}
            className="px-6 py-2.5 bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-400 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md hover:shadow-pink-950/20 transition transform active:scale-98 cursor-pointer"
          >
            Save Text Profile & SEO Settings
          </button>
        </div>
      </div>

    </div>
  );
}