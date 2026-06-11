"use client";

import React, { useState, useTransition } from "react";
import { Users, Building2 } from "lucide-react";

interface TabsProps {
  tenantSection: React.ReactNode;
  inquirySection: React.ReactNode;
}

export default function OnboardingTabsClient({ tenantSection, inquirySection }: TabsProps) {
  const [activeTab, setActiveTab] = useState<"tenants" | "inquiries">("tenants");
  const [, startTransition] = useTransition();

  const switchTab = (tab: "tenants" | "inquiries") => {
    startTransition(() => {
      setActiveTab(tab);
    });
  };

  return (
    <div className="w-full max-w-5xl space-y-8 animate-in fade-in duration-200">
      
      {/* Premium Minimal Navigation Header Toggles */}
      <div className="flex border-b border-slate-800/80 max-w-md mx-auto p-1 bg-slate-950/40 backdrop-blur-md rounded-2xl border w-fit gap-2">
        <button
          type="button"
          onClick={() => switchTab("tenants")}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition flex items-center gap-2 cursor-pointer ${
            activeTab === "tenants"
              ? "bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-lg shadow-amber-950/10"
              : "text-slate-500 hover:text-slate-300 border border-transparent"
          }`}
        >
          <Users size={13} />
          Provision Sandbox
        </button>
        <button
          type="button"
          onClick={() => switchTab("inquiries")}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition flex items-center gap-2 cursor-pointer ${
            activeTab === "inquiries"
              ? "bg-pink-500/10 border border-pink-500/20 text-pink-400 shadow-lg shadow-pink-950/10"
              : "text-slate-500 hover:text-slate-300 border border-transparent"
          }`}
        >
          <Building2 size={13} />
          Incoming Inquiries
        </button>
      </div>

      {/* Conditional Active Section Display Frames */}
      <div className="w-full flex flex-col items-center gap-8 animate-in zoom-in-95 duration-150">
        {activeTab === "tenants" ? tenantSection : inquirySection}
      </div>

    </div>
  );
}