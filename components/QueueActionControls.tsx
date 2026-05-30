// components/QueueActionControls.tsx
"use client";

import React, { useState } from "react";
import { issueWalkInQueueToken } from "@/lib/actions/salon-tokens";
import { transitionTokenToServing, completeQueueService } from "@/lib/actions/salon-queue";
import { useRouter } from "next/navigation"; // 🌟 THE UX FIX: Import the native router engine

interface ActionProps {
  mode: "dispense" | "call" | "complete";
  targetId?: string | number; 
}

export default function QueueActionControls({ mode, targetId }: ActionProps) {
  const router = useRouter(); // Initialize the real-time cache flusher hook
  const [loading, setLoading] = useState(false);

  const executeControlPass = async () => {
    setLoading(true);

    if (mode === "dispense") {
      const guestName = prompt("Enter Walk-In Customer Name Descriptor:", "Walk-In Guest");
      if (guestName === null) {
        setLoading(false);
        return; 
      }
      
      const res = await issueWalkInQueueToken(guestName);
      if (!res.success) {
        alert(res.error);
      } else {
        router.refresh(); // 🌟 Force instant dashboard and runway grid sync
      }
    } 
    
    else if (mode === "call" && targetId) {
      const res = await transitionTokenToServing(String(targetId));
      if (!res.success) {
        alert(res.error);
      } else {
        router.refresh(); // 🌟 Shift the token to an active chair immediately
      }
    } 
    
    else if (mode === "complete" && targetId) {
      const res = await completeQueueService(String(targetId));
      if (!res.success) {
        alert(res.error);
      } else {
        router.refresh(); // 🌟 Remove the token from active layouts instantly
      }
    }

    setLoading(false);
  };

  if (mode === "dispense") {
    return (
      <button
        onClick={executeControlPass}
        disabled={loading}
        className="px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition hover:opacity-90 disabled:opacity-40 cursor-pointer select-none"
      >
        {loading ? "Generating..." : "🎟️ Dispense Token"}
      </button>
    );
  }

  if (mode === "call") {
    return (
      <button
        onClick={executeControlPass}
        disabled={loading}
        className="text-[10px] uppercase font-bold tracking-wider px-3 py-1 bg-amber-950/30 border border-amber-800 text-amber-400 rounded hover:bg-amber-500 hover:text-slate-950 transition disabled:opacity-40 cursor-pointer select-none"
      >
        {loading ? "Calling..." : "Call Chair"}
      </button>
    );
  }

  return (
    <button
      onClick={executeControlPass}
      disabled={loading}
      className="text-[10px] uppercase tracking-wider font-bold px-3 py-1 bg-slate-900 border border-slate-800 rounded text-slate-400 hover:text-emerald-400 transition disabled:opacity-40 cursor-pointer select-none"
    >
      {loading ? "Settling..." : "Complete →"}
    </button>
  );
}