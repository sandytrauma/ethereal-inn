// components/CheckoutControlTerminal.tsx
"use client";

import React, { useState } from "react";
import { checkoutAppointmentTicket, closeOperationalDayLedger } from "@/lib/actions/salon-checkout";
import ProductConsumptionModal from "./ProductConsumptionModal";
import { useRouter } from "next/navigation";

interface TerminalProps {
  actionType: "settle_ticket" | "close_day";
  ticketId?: string;
  totalEarnings?: number;
}

export default function CheckoutControlTerminal({ actionType, ticketId, totalEarnings }: TerminalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConsumptionModal, setShowConsumptionModal] = useState(false);

  const handleActionClick = async () => {
    if (actionType === "close_day") {
      const confirmClose = confirm(
        `Are you sure you want to lock the daily balance ledger at ₹${totalEarnings?.toLocaleString("en-IN")}?\n\nThis action calculation concludes current database modifications for this tracking period.`
      );
      if (!confirmClose) return;

      setLoading(true);
      const res = await closeOperationalDayLedger();
      setLoading(false);

      alert(res.message || res.error);

      if (res.success) {
        router.refresh();
      }
      return;
    }

    if (actionType === "settle_ticket" && ticketId) {
      setShowConsumptionModal(true);
    }
  };

  const handleConsumptionClose = async () => {
    setShowConsumptionModal(false);
  };

  const handleConsumptionSuccess = () => {
    router.refresh();
  };

  if (actionType === "close_day") {
    return (
      <button
        onClick={handleActionClick}
        disabled={loading}
        className="px-4 py-2 bg-red-950/40 hover:bg-red-900/40 border border-red-800/50 text-red-300 font-bold text-xs uppercase tracking-wider rounded-xl transition disabled:opacity-40 cursor-pointer select-none"
      >
        {loading ? "Reconciling Master Logs..." : "🔒 Perform End-of-Day Close"}
      </button>
    );
  }

  return (
    <>
      <button
        onClick={handleActionClick}
        disabled={loading}
        className="px-3 py-1.5 bg-emerald-950/40 hover:bg-emerald-500 hover:text-slate-950 border border-emerald-800 text-emerald-400 font-bold uppercase tracking-wider rounded-lg transition disabled:opacity-40 text-[10px] cursor-pointer select-none"
      >
        {loading ? "Settling..." : "💳 Settle & Checkout"}
      </button>

      {showConsumptionModal && ticketId && (
        <ProductConsumptionModal
          appointmentId={ticketId}
          onClose={handleConsumptionClose}
          onSuccess={handleConsumptionSuccess}
        />
      )}
    </>
  );
}
