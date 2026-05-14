"use client";

import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button 
      onClick={() => window.print()}
      className="bg-amber-600 text-white px-10 py-4 rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-amber-700 transition-all shadow-lg flex items-center gap-2"
    >
      <Printer size={16} />
      Download as PDF / Print
    </button>
  );
}