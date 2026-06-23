"use client";

import React, { useState, useTransition } from "react";
import { UploadButton } from "@/lib/uploadthing"; 
import { updateTenantBrandAction, addSalonServiceAction } from "@/lib/actions/salon-brand-update"; 
import { useRouter } from "next/navigation";
import { Scissors, Sparkle, MessageSquare, Plus, ShieldCheck, Clock, Coins } from "lucide-react";

interface BrandSettingsTerminalProps {
  tenantProfile: any;
  publicServices?: any[];
}

export default function BrandSettingsTerminal({ tenantProfile, publicServices = [] }: BrandSettingsTerminalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // 1. Navigation Controller (Split View between Core Settings & Service Manager)
  const [activeTab, setActiveTab] = useState<"branding" | "services">("branding");

  // 2. Media Assets State Hooks
  const [logo, setLogo] = useState(tenantProfile.brandLogoUrl || "");
  const [banner, setBanner] = useState(tenantProfile.brandBannerUrl || "");

  // 3. Text Form & SEO Parameters State Hooks
  const [businessName, setBusinessName] = useState(tenantProfile.businessName || "");
  const [brandBio, setBrandBio] = useState(tenantProfile.brandBio || "");
  const [brandMetaTitle, setBrandMetaTitle] = useState(tenantProfile.brandMetaTitle || "");
  const [brandMetaDescription, setBrandMetaDescription] = useState(tenantProfile.brandMetaDescription || "");
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState(tenantProfile.googleAnalyticsId || "");

  // 4. Dynamic Custom Service Submission Form State
  const [newService, setNewService] = useState({
    name: "",
    description: "",
    durationMinutes: 60,
    price: "",
    isAestheticProcedure: false,
  });
  const [serviceError, setServiceError] = useState<string | null>(null);

  // Fallback destination coordinates for preview linkage tracking
  const whatsappPhone = tenantProfile.phone ? tenantProfile.phone.replace(/[^0-9]/g, "") : "91XXXXXXXXXX";

  // =========================================================================
  // ⚡ CENTRALIZED PERSISTENCE ENGINE (Handles Branding Core Sync Layouts)
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
        router.refresh();
      } else {
        console.error("Failed to update tenant branding profile layout:", res.error);
      }
    });
  };

  // =========================================================================
  // ➕ MUTATION ACTION: Invokes Server Action Directly for Database Insertion
  // =========================================================================
  const handleAddCustomService = async (e: React.FormEvent) => {
    e.preventDefault();
    setServiceError(null);

    if (!newService.name.trim()) {
      setServiceError("A valid treatment name coordinate is required.");
      return;
    }

    if (parseFloat(newService.price) < 0 || isNaN(parseFloat(newService.price))) {
      setServiceError("Service valuation price matrices must be a non-negative number.");
      return;
    }

    startTransition(async () => {
      try {
        // 🌟 FIXED: Dropped fetch calls completely to use your exact addSalonServiceAction contract
        const res = await addSalonServiceAction({
          name: newService.name,
          description: newService.description,
          durationMinutes: newService.durationMinutes,
          price: newService.price,
          isAestheticProcedure: newService.isAestheticProcedure,
        });

        if (res.success) {
          setNewService({ name: "", description: "", durationMinutes: 60, price: "", isAestheticProcedure: false });
          router.refresh();
        } else {
          setServiceError(res.error || "Failed to register custom service parameters.");
        }
      } catch (err: any) {
        setServiceError("An unexpected compilation fault occurred during pipeline transmission.");
      }
    });
  };

  const formatCurrency = (amount: string | number) => {
    return `₹${parseFloat(String(amount)).toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;
  };

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Tab Navigation Interface Strip Header */}
      <div className="flex border-b border-slate-800/80 gap-2 p-1 bg-slate-950 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("branding")}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === "branding" ? "bg-slate-800 text-pink-400 shadow-sm" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          ✨ Studio Profile Branding
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("services")}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "services" ? "bg-slate-800 text-pink-400 shadow-sm" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Scissors size={12} />
          Manage Service Catalog ({publicServices.length})
        </button>
      </div>

      {/* =========================================================================
          TAB SECTOR ONE: PROFILE CUSTOMIZATION TERMINAL LAYER
         ========================================================================= */}
      {activeTab === "branding" && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-6 relative overflow-hidden text-slate-200">
          {isPending && (
            <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center z-50">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-pink-400 animate-pulse">
                <span className="h-2 w-2 rounded-full bg-pink-500 animate-ping" />
                Synchronizing Branding Matrix to Database...
              </div>
            </div>
          )}

          <div>
            <h2 className="text-md font-bold text-slate-200 tracking-wide">Brand Portal Personalization Studio</h2>
            <p className="text-xs text-slate-500 mt-0.5">Configure public asset listings, content biographies, and search engine metadata.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-slate-800/60">
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
                    handleDatabaseSync(targetUrl, banner);
                  }}
                  className="ut-button:bg-pink-600 ut-button:text-xs ut-button:h-8 ut-button:rounded-lg ut-allowed-content:hidden"
                />
              </div>
            </div>

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
                    handleDatabaseSync(logo, targetUrl);
                  }}
                  className="ut-button:bg-pink-600 ut-button:text-xs ut-button:h-8 ut-button:rounded-lg ut-allowed-content:hidden"
                />
              </div>
            </div>
          </div>

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
                <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Google Analytics ID (GA4)</label>
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
              <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">SEO Meta Title</label>
              <input 
                type="text" 
                value={brandMetaTitle} 
                onChange={(e) => setBrandMetaTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">SEO Meta Description</label>
              <textarea 
                rows={2}
                value={brandMetaDescription} 
                onChange={(e) => setBrandMetaDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Studio Public Biography Profile</label>
              <textarea 
                rows={4}
                value={brandBio} 
                onChange={(e) => setBrandBio(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 resize-none"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => handleDatabaseSync()}
                className="px-6 py-2.5 bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-400 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition"
              >
                Save Text Profile & SEO Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB SECTOR TWO: INLINE SERVICE CATALOG GENERATION SUITE (FOR OWNERS)
         ========================================================================= */}
      {activeTab === "services" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Column A: Interactive Formulation Registration Console */}
          <div className="lg:col-span-1 bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4 text-slate-200 self-start">
            <div>
              <h3 className="text-sm font-bold text-slate-200 tracking-wide flex items-center gap-1.5">
                <Plus size={14} className="text-pink-500" />
                List Custom Treatment
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Inject customized salon operations directly into your active display layout.</p>
            </div>

            {serviceError && (
              <div className="p-2.5 rounded-lg bg-red-950/30 border border-red-900/40 text-red-400 text-[11px] font-medium">
                ⚠️ {serviceError}
              </div>
            )}

            <form onSubmit={handleAddCustomService} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Treatment Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Keratin Infrared Infusion"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-100 placeholder-slate-700 focus:outline-none focus:border-pink-500/40"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Menu Subtitle Description</label>
                <textarea
                  rows={2}
                  placeholder="Summarize the procedure advantages, materials used, etc."
                  value={newService.description}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-100 placeholder-slate-700 resize-none focus:outline-none focus:border-pink-500/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    min={5}
                    required
                    value={newService.durationMinutes}
                    onChange={(e) => setNewService({ ...newService, durationMinutes: parseInt(e.target.value) || 60 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Retail Price (₹)</label>
                  <input
                    type="number"
                    step="1"
                    min={0}
                    required
                    placeholder="1500"
                    value={newService.price}
                    onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-100 placeholder-slate-700"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 bg-slate-950/20 p-2 rounded-xl border border-slate-800/40">
                <input
                  type="checkbox"
                  id="owner-is-clinical"
                  checked={newService.isAestheticProcedure}
                  onChange={(e) => setNewService({ ...newService, isAestheticProcedure: e.target.checked })}
                  className="accent-pink-500 h-3.5 w-3.5 rounded cursor-pointer"
                />
                <label htmlFor="owner-is-clinical" className="text-[11px] font-medium text-slate-300 cursor-pointer select-none">
                  Tag as Aesthetic Clinical Procedure
                </label>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-2 bg-pink-600 hover:bg-pink-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition shadow-lg active:scale-95 disabled:opacity-40 cursor-pointer"
              >
                {isPending ? "Publishing Entry..." : "Publish Treatment Entry"}
              </button>
            </form>
          </div>

          {/* Column B: Live Catalog Array Preview Node Layer */}
          <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4 text-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-200 tracking-wide flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-400" />
                Active Storefront Menu Lookbook Preview
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Verify public visibility rules or execute instant WhatsApp booking links.</p>
            </div>

            {publicServices.length === 0 ? (
              <div className="text-center py-12 bg-slate-950/40 border border-dashed border-slate-800 rounded-xl text-xs text-slate-500 italic">
                No service treatments currently associated with your tenant space. List one using the left controller.
              </div>
            ) : (
              <div className="space-y-2.5 overflow-y-auto max-h-[420px] pr-1 scrollbar-thin">
                {publicServices.map((service) => (
                  <div 
                    key={service.id} 
                    className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between gap-4 group hover:border-slate-700/60 transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-200 truncate block">{service.name}</span>
                        {service.isAestheticProcedure && (
                          <span className="text-[7px] font-black uppercase tracking-widest bg-pink-500/10 text-pink-400 border border-pink-500/20 px-1.5 py-0.2 rounded">
                            Clinical
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate max-w-md">
                        {service.description || "No public descriptive metadata added to item array details."}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] text-slate-500 font-medium">
                        <span className="flex items-center gap-0.5"><Clock size={10} /> {service.durationMinutes || 60} mins</span>
                        <span className="flex items-center gap-0.5 font-mono text-slate-400"><Coins size={10} /> {formatCurrency(service.price)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <a
                        href={`https://wa.me/${whatsappPhone}?text=Hi%20there!%20I%20want%20to%20confirm%20a%20booking%20for%20the%20following%20service:%20${encodeURIComponent(service.name)}%20(${service.durationMinutes || 60}%20mins)%20at%20${encodeURIComponent(businessName || "your%20studio")}.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 text-[10px] font-black uppercase tracking-wider rounded-md text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-1"
                        title="Test WhatsApp Routing Performance"
                      >
                        <MessageSquare size={10} />
                        Test Link
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}