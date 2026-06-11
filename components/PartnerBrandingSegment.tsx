"use client";

import React, { useState, useTransition } from "react";
import PartnerInquiryModal from "./PartnerInquiryModal";
import { Handshake, ShieldCheck, Zap, ArrowRight } from "lucide-react";

export default function PartnerBrandingSegment() {
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <section className="py-20 bg-gradient-to-b from-slate-950 via-slate-900/20 to-slate-950 text-slate-200 relative">
        <div className="max-w-5xl mx-auto px-6">
          
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-16 select-none">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-pink-950/40 text-pink-400 border border-pink-900/30">
              Ethereal Partnership Ecosystem
            </span>
            <h2 className="text-3xl font-extrabold text-slate-100 tracking-tight mt-3">
              Run Your Hotel With Absolute Leniency. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-400">
                Your Operations, Our Priority.
              </span>
            </h2>
            <p className="text-sm text-slate-400 mt-4 leading-relaxed font-medium">
              Stop wrestling with infrastructure mechanics. Align your property with the Ethereal brand network and offload the tech, compliance, and core logistics overhead to us.
            </p>
          </div>

          {/* Core Value Props Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12 select-none">
            
            <div className="p-6 bg-slate-900/30 border border-slate-800/80 rounded-2xl backdrop-blur-md">
              <div className="p-2.5 bg-pink-950/40 border border-pink-900/30 text-pink-400 rounded-xl w-fit mb-4">
                <Zap size={18} />
              </div>
              <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Frictionless Onboarding</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                No expensive engineering overhead or server deployments. Input your hotel profile, map your custom domain, and go live instantly.
              </p>
            </div>

            <div className="p-6 bg-slate-900/30 border border-slate-800/80 rounded-2xl backdrop-blur-md">
              <div className="p-2.5 bg-pink-950/40 border border-pink-900/30 text-pink-400 rounded-xl w-fit mb-4">
                <ShieldCheck size={18} />
              </div>
              <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Autonomous Ledgers</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                From real-time room status mapping to day-end transactional reconciliation locks—your complete management system runs safely on autopilot.
              </p>
            </div>

            <div className="p-6 bg-slate-900/30 border border-slate-800/80 rounded-2xl backdrop-blur-md">
              <div className="p-2.5 bg-pink-950/40 border border-pink-900/30 text-pink-400 rounded-xl w-fit mb-4">
                <Handshake size={18} />
              </div>
              <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Unified Brand Command</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Monitor guest lifecycles, operational costs, and inventory thresholds seamlessly across multiple hotel branches from one interface overlay.
              </p>
            </div>

          </div>

          {/* Action Interactive Banner Wrapper Card */}
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800/90 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="text-left select-none">
              <h5 className="text-sm font-bold text-slate-200">Ready to hustle operations out of your timeline?</h5>
              <p className="text-xs text-slate-500 mt-0.5">Become a premium corporate partner node in under 10 minutes.</p>
            </div>
            <button 
              type="button"
              onClick={() => {
                startTransition(() => {
                  setShowInquiryModal(true);
                });
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-400 text-white font-black text-xs uppercase tracking-wider transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-pink-950/20 select-none"
            >
              Become a Partner Node
              <ArrowRight size={14} />
            </button>
          </div>

        </div>
      </section>

      {/* 🌟 MODAL OVERLAY: Conditionally rendered into the branding segment pipeline */}
      {showInquiryModal && (
        <PartnerInquiryModal 
          onClose={() => setShowInquiryModal(false)} 
        />
      )}
    </>
  );
}