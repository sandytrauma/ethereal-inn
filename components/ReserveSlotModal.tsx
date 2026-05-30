// components/ReserveSlotModal.tsx
"use client";

import React, { useState } from "react";
import { createNewTimeSlotBooking } from "@/lib/actions/salon-appointments";
import { quickRegisterNewClient } from "@/lib/actions/salon-clients";
import { useRouter } from "next/navigation"; // 🌟 THE UX FIX: Import the native router engine

interface ClientRecord {
  id: number;
  name: string;
}

interface ModalProps {
  clientsList: ClientRecord[];
  operationalHours: number[];
  targetDate: string; // 🌟 THE PRODUCTION FIX: Enforce clear day tracking variables (e.g., "2026-05-30")
}

export default function ReserveSlotModal({ clientsList, operationalHours, targetDate }: ModalProps) {
  const router = useRouter(); // Initialize the real-time cache hydration hook
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Appointment Form States
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedHour, setSelectedHour] = useState("");
  const [notes, setNotes] = useState("");

  // Quick Registration Form States
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");

  // Handle Quick Onboarding Pass Natively
  const handleQuickClientRegister = async () => {
    if (!newClientName || !newClientPhone) {
      alert("Please provide at least a name and mobile contact number.");
      return;
    }

    setLoading(true);
    const outcome = await quickRegisterNewClient({
      name: newClientName.trim(),
      phone: newClientPhone.trim()
    });
    setLoading(false);

    if (outcome.success && outcome.client) {
      // 🌟 Clean mapping regardless of whether it's a fresh or duplicate record
      setSelectedClient(String(outcome.client.id));
      setShowQuickAdd(false);
      setNewClientName("");
      setNewClientPhone("");
      router.refresh(); // Sync component selector option array re-hydration
    } else {
      alert(outcome.error || "Failed to process customer onboarding card.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !selectedHour) {
      alert("Please designate both a target client profile and an operational hour window.");
      return;
    }

    setLoading(true);
    const result = await createNewTimeSlotBooking({
      clientId: parseInt(selectedClient, 10),
      targetDate: targetDate, // 🌟 Safe non-drift day timeline anchor passed cleanly
      hour: parseInt(selectedHour, 10),
      notes: notes.trim() || undefined
    });
    setLoading(false);

    if (result.success) {
      setIsOpen(false);
      setSelectedClient("");
      setSelectedHour("");
      setNotes("");
      router.refresh(); // 🌟 Force layout grid elements to update visually instantly
    } else {
      alert(result.error);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition hover:opacity-90 cursor-pointer select-none"
      >
        + Reserve Time Slot
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl text-slate-100">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm uppercase font-black tracking-wider text-pink-400">Reserve New Treatment Lane</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Booking context anchor: <span className="font-mono font-bold text-slate-300">{targetDate}</span></p>
              </div>
              <button onClick={() => { setIsOpen(false); setShowQuickAdd(false); }} className="text-slate-500 hover:text-slate-300 font-mono text-sm cursor-pointer p-1">✕</button>
            </div>

            {/* 🌟 INTEGRATED SUB-DRAWER: QUICK ADD DIRECTORY CUSTOMER */}
            {showQuickAdd ? (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 text-xs">
                <div className="text-[10px] uppercase font-black tracking-widest text-amber-400">⚡ Quick Add New Directory Record</div>
                <div className="space-y-2">
                  <input 
                    type="text" 
                    placeholder="Full Customer Name"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500/40"
                  />
                  <input 
                    type="tel" 
                    placeholder="Mobile Contact Number"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500/40"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button 
                    type="button"
                    onClick={handleQuickClientRegister}
                    disabled={loading}
                    className="flex-1 py-2 bg-amber-600 font-bold uppercase rounded-lg hover:bg-amber-500 text-slate-950 transition disabled:opacity-50"
                  >
                    {loading ? "Saving..." : "Save & Select Profile"}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { setShowQuickAdd(false); setNewClientName(""); setNewClientPhone(""); }}
                    className="px-3 py-2 bg-slate-800 rounded-lg text-slate-400 font-semibold hover:bg-slate-700 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-end">
                <button 
                  type="button" 
                  onClick={() => setShowQuickAdd(true)}
                  className="text-[10px] uppercase tracking-wider font-bold text-amber-400 bg-amber-950/20 border border-amber-800/40 px-2 py-1 rounded-md transition hover:bg-amber-950/40 cursor-pointer select-none"
                >
                  + Create New Customer Profile
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-2">
                <label className="block text-slate-400 font-semibold uppercase tracking-wide">Target Directory Client</label>
                <select 
                  value={selectedClient} 
                  onChange={(e) => setSelectedClient(e.target.value)}
                  disabled={showQuickAdd}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-pink-500/50 disabled:opacity-40"
                >
                  <option value="">Select a customer...</option>
                  {clientsList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-slate-400 font-semibold uppercase tracking-wide">Target Time Allocation</label>
                <select 
                  value={selectedHour} 
                  onChange={(e) => setSelectedHour(e.target.value)}
                  disabled={showQuickAdd}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-pink-500/50 disabled:opacity-40"
                >
                  <option value="">Select an hour window...</option>
                  {operationalHours.map(h => (
                    <option key={h} value={h}>
                      {h > 12 ? h - 12 : h}:00 {h >= 12 ? "PM" : "AM"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-slate-400 font-semibold uppercase tracking-wide">Internal Operational Notes</label>
                <textarea 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Hair texture details, specific stylist choices..."
                  disabled={showQuickAdd}
                  className="w-full p-3 h-20 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-pink-500/50 resize-none disabled:opacity-40"
                />
              </div>

              <button 
                type="submit"
                disabled={loading || showQuickAdd}
                className="w-full py-3 bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-400 text-white font-bold uppercase tracking-wider rounded-xl transition disabled:opacity-40 cursor-pointer select-none"
              >
                {loading ? "Locking Booking Window..." : "Confirm Secure Allocation"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}