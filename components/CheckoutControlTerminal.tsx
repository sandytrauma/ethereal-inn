// components/CheckoutControlTerminal.tsx
"use client";

import React, { useState } from "react";
import { checkoutAppointmentTicket, closeOperationalDayLedger } from "@/lib/actions/salon-checkout";

interface TerminalProps {
  actionType: "settle_ticket" | "close_day";
  ticketId?: string;
  totalEarnings?: number;
}

export default function CheckoutControlTerminal({ actionType, ticketId, totalEarnings }: TerminalProps) {
  const [loading, setLoading] = useState(false);

  const handleActionClick = async () => {
    if (actionType === "close_day") {
      const confirmClose = confirm(`Are you sure you want to lock the daily balance ledger at ₹${totalEarnings?.toLocaleString("en-IN")}? This concludes current database modifications for the tracking day frame.`);
      if (!confirmClose) return;
      
      setLoading(true);
      const res = await closeOperationalDayLedger();
      setLoading(false);
      alert(res.message || res.error);
      return;
    }

    if (actionType === "settle_ticket" && ticketId) {
      setLoading(true);
      const res = await checkoutAppointmentTicket(ticketId);
      setLoading(false);
      if (!res.success) alert(res.error);
    }
  };

  if (actionType === "close_day") {
    return (
      <button
        onClick={handleActionClick}
        disabled={loading}
        className="px-4 py-2 bg-red-950/40 hover:bg-red-900/40 border border-red-800/50 text-red-300 font-bold text-xs uppercase tracking-wider rounded-xl transition disabled:opacity-40 cursor-pointer"
      >
        {loading ? "Reconciling Master Logs..." : "🔒 Perform End-of-Day Close"}
      </button>
    );
  }

  return (
    <button
      onClick={handleActionClick}
      disabled={loading}
      className="px-3 py-1.5 bg-emerald-950/40 hover:bg-emerald-500 hover:text-slate-950 border border-emerald-800 text-emerald-400 font-bold uppercase tracking-wider rounded-lg transition disabled:opacity-40 text-[10px] cursor-pointer"
    >
      {loading ? "Settling..." : "💳 Settle & Checkout"}
    </button>
  );
}