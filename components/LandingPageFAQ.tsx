import React from "react";
import { HelpCircle } from "lucide-react";

const FAQS = [
  {
    q: "How fast can we go live after partnering with Ethereal Inn?",
    a: "Instantly. Because our core engine is entirely cloud-native and multi-tenant, you bypass heavy hardware setups or localized code installations. You simply register, input your operational matrices, map your domain, and start running."
  },
  {
    q: "Can the inventory pipeline handle items outside standard ml metrics?",
    a: "Yes. Our stock tracking module features multi-vector support out of the box. You can configure and monitor items in milliliters, grams, pieces, packets, or kilograms—making it equally powerful for front-of-house consumables and back-office fixed assets."
  },
  {
    q: "What does 'Utmost Leniency and Hustle' mean for our staff operations?",
    a: "It means we automate the tracking overhead that slows down your desk operators. Checkouts, material logic calculations, dynamic reorder warnings, and balance logs are processed atomically so your staff focuses purely on hospitality execution."
  },
  {
    q: "How does the system handle multi-location outlets under a single brand?",
    a: "Ethereal Inn compiles separate properties into a unified command dashboard. You can segment or group data to run standalone branch inventory balances while reviewing your entire multi-property portfolio's performance instantly from your primary login."
  }
];

export function LandingPageFAQ() {
  return (
    <section className="py-20 max-w-4xl mx-auto px-6 text-slate-200">
      
      {/* FAQ Header */}
      <div className="flex items-center gap-3 mb-12 select-none">
        <div className="p-2 bg-slate-900 border border-slate-800 text-pink-400 rounded-xl">
          <HelpCircle size={18} />
        </div>
        <div>
          <h3 className="text-md font-bold text-slate-200 tracking-wide">Frequently Answered Queries</h3>
          <p className="text-xs text-slate-500 mt-0.5">Got implementation check questions? Here is how our architecture deploys.</p>
        </div>
      </div>

      {/* Two-Column Clean Text Flow Layout Grid */}
      <div className="grid md:grid-cols-2 gap-x-10 gap-y-8">
        {FAQS.map((faq, i) => (
          <div key={i} className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-pink-400/90 leading-tight">
              ⚡ {faq.q}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              {faq.a}
            </p>
          </div>
        ))}
      </div>

    </section>
  );
}