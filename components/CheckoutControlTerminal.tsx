"use client";

import React, { useState, useTransition } from "react";
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
  const [showConsumptionModal, setShowConsumptionModal] = useState(false);
  
  // 🌟 FIX: Use transitions to manage both background reconciliation actions and ticket completions cleanly
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleActionClick = async () => {
    setErrorMessage(null);

    // =========================================================================
    // BRANCH PATH A: CLOSE OPERATIONAL DAY LEDGER
    // =========================================================================
    if (actionType === "close_day") {
      const confirmClose = confirm(
        `Are you sure you want to lock the daily balance ledger at ₹${totalEarnings?.toLocaleString("en-IN")}?\n\nThis action concludes current database modifications for this tracking period.`
      );
      if (!confirmClose) return;

      startTransition(async () => {
        const res = await closeOperationalDayLedger();
        
        if (res.success) {
          alert(res.message || "Daily operational ledger reconciled and locked successfully.");
          router.refresh();
        } else {
          setErrorMessage(res.error || "Failed to reconcile active cash balances.");
          alert(res.error || "Failed to reconcile active cash balances.");
        }
      });
      return;
    }

    // =========================================================================
    // BRANCH PATH B: SHOW CONSUMPTION RECORD FORM OVERLAY
    // =========================================================================
    if (actionType === "settle_ticket" && ticketId) {
      setShowConsumptionModal(true);
    }
  };

  const handleConsumptionClose = () => {
    setShowConsumptionModal(false);
  };

  // 🌟 FIX: Automatically execute the main ticket settlement pipeline when consumption counts return successfully
  const handleConsumptionSuccess = () => {
    if (!ticketId) return;

    startTransition(async () => {
      const res = await checkoutAppointmentTicket(ticketId);
      
      if (res.success) {
        setShowConsumptionModal(false);
        router.refresh(); // Flash updates directly down to your active roster views
      } else {
        setErrorMessage(res.error || "Consumption saved, but ticket settlement failed.");
        alert(res.error || "Consumption saved, but ticket settlement failed.");
      }
    });
  };

  // Render configuration wrapper tracking the close day action frame
  if (actionType === "close_day") {
    return (
      <button
        type="button"
        onClick={handleActionClick}
        disabled={isPending}
        className="px-4 py-2 bg-red-950/40 hover:bg-red-900/40 border border-red-800/50 text-red-300 font-bold text-xs uppercase tracking-wider rounded-xl transition disabled:opacity-40 disabled:pointer-events-none cursor-pointer select-none"
      >
        {isPending ? "Reconciling Master Logs..." : "🔒 Perform End-of-Day Close"}
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleActionClick}
        disabled={isPending}
        className="px-3 py-1.5 bg-emerald-950/40 hover:bg-emerald-500 hover:text-slate-950 border border-emerald-800 text-emerald-400 font-bold uppercase tracking-wider rounded-lg transition disabled:opacity-40 disabled:pointer-events-none text-[10px] cursor-pointer select-none"
      >
        {isPending ? "Settling Ledger..." : "💳 Settle & Checkout"}
      </button>

      {showConsumptionModal && ticketId && (
        <ProductConsumptionModal
          appointmentId={ticketId}
          onClose={handleConsumptionClose}
          onSuccess={handleConsumptionSuccess} // Fires our newly integrated transition pipeline immediately on submission
        />
      )}
    </>
  );
}