"use client";

import React, { useState, useTransition } from "react";
import { submitPartnerInquiry } from "@/lib/actions/partner-inquiry";
import { X, CheckCircle, Sparkles, Building2 } from "lucide-react";

// 🌟 TypeScript Global Override Declaration for Google Tags
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

interface Lead {
  id: number;
  hotelName: string;
  ownerName: string;
  email: string;
  phone: string;
  totalRooms: number;
  message: string | null;
  status: string;
  loggedAt: Date | string;
}

export default function PartnerInquiryModal({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    hotelName: "",
    ownerName: "",
    email: "",
    phone: "",
    totalRooms: 0,
    message: "",
  });

  const [isPending, startTransition] = useTransition();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic data sanity gate check
    if (formData.totalRooms <= 0) {
      setError("Please specify a valid room count greater than 0.");
      return;
    }

    startTransition(async () => {
      const result = await submitPartnerInquiry(formData);
      
      if (result.success) {
        setIsSubmitted(true);

        // 🎯 GOOGLE ADS CONVERSION INJECTION LAYER
        // Fires only when the database commits and passes back a success boolean token
        if (typeof window !== "undefined" && window.gtag) {
          window.gtag("event", "conversion_event_contact", {
            event_callback: () => {
              console.log("🚀 B2B Conversion pipeline verified by Google Analytics.");
            },
          });
        }
      } else {
        setError(result.error || "An error occurred during pipeline data sync.");
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center mt-24 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl w-full max-w-md max-h-[95vh] overflow-y-auto text-slate-200 relative animate-in zoom-in-95 duration-150">
        
        {/* Absolute Close Action Pin */}
        <button 
          type="button"
          onClick={onClose} 
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-500 hover:text-slate-300 transition cursor-pointer"
        >
          <X size={16} />
        </button>

        {isSubmitted ? (
          /* Onboarding Success Screen State */
          <div className="text-center py-8 space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <CheckCircle size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-100">Prospectus Logged Successfully</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Thank you for choosing Ethereal as your deployment framework. We have initialized our validation check loops and will coordinate with you via email within 24 hours.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
            >
              Close Window
            </button>
          </div>
        ) : (
          /* Data Entry Form Content Frame */
          <>
            <div className="flex items-center gap-3 mb-6 select-none">
              <div className="p-2 bg-pink-950/40 border border-pink-800/30 text-pink-400 rounded-xl">
                <Building2 size={18} />
              </div>
              <div>
                <h3 className="text-md font-bold text-slate-100 tracking-wide">Become a Brand Partner Node</h3>
                <p className="text-xs text-slate-500 mt-0.5">Offload your software logistics completely.</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/30 border border-red-900/30 text-red-400 text-xs font-semibold">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Hotel / Property Name</label>
                <input
                  type="text"
                  required
                  disabled={isPending}
                  value={formData.hotelName}
                  onChange={(e) => setFormData({ ...formData, hotelName: e.target.value })}
                  placeholder="e.g., Grand Ethereal Suites"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-pink-500/50 transition disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Primary Owner / Representative Name</label>
                <input
                  type="text"
                  required
                  disabled={isPending}
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  placeholder="Your Name"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-pink-500/50 transition disabled:opacity-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Corporate Email ID</label>
                  <input
                    type="email"
                    required
                    disabled={isPending}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@hotel.com"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-pink-500/50 transition disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Contact Number</label>
                  <input
                    type="tel"
                    required
                    disabled={isPending}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91..."
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-pink-500/50 transition disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Total Operational Keys (Rooms)</label>
                <input
                  type="number"
                  required
                  min="1"
                  disabled={isPending}
                  value={formData.totalRooms || ""}
                  onChange={(e) => setFormData({ ...formData, totalRooms: parseInt(e.target.value) || 0 })}
                  placeholder="e.g., 45"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-pink-500/50 transition disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Custom Property Notes (Optional)</label>
                <textarea
                  rows={3}
                  disabled={isPending}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us about your property footprint, location channels, or specific integration requirements..."
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium focus:outline-none focus:border-pink-500/50 transition resize-none disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-400 text-white font-black text-xs uppercase tracking-widest transition disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-pink-950/20"
              >
                <Sparkles size={14} />
                {isPending ? "Transmitting..." : "Initialize Partnership Protocol"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}