"use client";

import React, { useState, useMemo } from "react";
import { format, startOfToday, setHours } from "date-fns";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function PublicAppointmentCalendar() {
  const router = useRouter();
  const hours = Array.from({ length: 10 }, (_, i) => 10 + i);

  // Calculate which 4-hour block we are in (e.g., 0, 1, 2...)
  const currentBlock = Math.floor(new Date().getHours() / 4);
  const daySeed = new Date().getDate();
  
  // Deterministic "random" function based on the current time block
  // This ensures all users see the same scarcity at the same time
  const isSlotOpen = (hour: number) => {
    // Simple hash: combines hour, block, and day to keep it consistent
    const hash = (hour * 31 + currentBlock * 17 + daySeed * 7) % 10;
    return hash < 3; // Returns true for ~30% of slots
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
      <div className="mb-6">
        <h1 className="text-lg font-bold text-amber-400">Limited Availability</h1>
        <p className="text-xs text-slate-400">Exclusively reserved spots for {format(new Date(), 'MMMM d')}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {hours.map((hour) => {
          const open = isSlotOpen(hour);
          return (
            <div
              key={hour}
              className={`p-3 rounded-xl border text-center transition ${
                open 
                  ? "bg-pink-950/20 border-pink-500/30" 
                  : "bg-slate-800/50 border-slate-700 opacity-40"
              }`}
            >
              <p className="text-xs font-bold text-white">{format(setHours(new Date(), hour), 'h:mm a')}</p>
              <p className={`text-[10px] ${open ? "text-pink-200" : "text-slate-500"}`}>
                {open ? "Open" : "Booked"}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-8 pt-6 border-t border-slate-800 text-center">
        <Button 
          onClick={() => router.push("/contact")} 
          className="w-full bg-gradient-to-r from-amber-600 to-amber-700 text-white"
        >
          Request Priority Concierge
        </Button>
      </div>
    </div>
  );
}