// components/CommandTerminalActions.tsx
"use client";

import React, { useState, useEffect } from "react";
import { 
  issueWalkInQueueToken, 
  transitionTokenToServing, 
  completeQueueService 
} from "@/lib/actions/salon-queue";
import { createNewTimeSlotBooking } from "@/lib/actions/salon-appointments";
import { quickRegisterNewClient } from "@/lib/actions/salon-clients"; // 🌟 Ingest registration action
import { useRouter } from "next/navigation"; // 🌟 For instant UI synchronization

interface ClientRecord {
  id: number;
  name: string;
}

interface TerminalProps {
  clientsList: ClientRecord[];
}

export default function CommandTerminalActions({ clientsList }: TerminalProps) {
  const router = useRouter();
  const [activeModal, setActiveModal] = useState<"token" | "appointment" | null>(null);
  const [loading, setLoading] = useState(false);

  // Core Form states
  const [walkInName, setWalkInName] = useState("");
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedHour, setSelectedHour] = useState("");
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split("T")[0]); // 🌟 Default to today's date context string

  // Fast Customer Registration Sub-States
  const [showFastReg, setShowFastReg] = useState(false);
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");

  // 🎹 Global Keyboard Hotkey Listener Pipeline
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept hotkeys if user is typing into text fields
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "SELECT") {
        return;
      }
      if (e.key === "F2") {
        e.preventDefault();
        setActiveModal("token");
      } else if (e.key === "F3") {
        e.preventDefault();
        setActiveModal("appointment");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleIssueToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await issueWalkInQueueToken(walkInName);
    setLoading(false);
    
    if (res.success) {
      setActiveModal(null);
      setWalkInName("");
      router.refresh(); // 🌟 Instant UI data update pass
    } else {
      alert(res.error);
    }
  };

  const handleFastRegistration = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!regName || !regPhone) return alert("Provide client name and matching mobile number.");
    
    setLoading(true);
    const res = await quickRegisterNewClient({ name: regName, phone: regPhone });
    setLoading(false);

    if (res.success && res.client) {
      alert(res.message);
      // Inject the newly generated ID directly into your client dropdown option array values
      setSelectedClient(String(res.client.id));
      setShowFastReg(false);
      setRegName("");
      setRegPhone("");
      router.refresh(); // Force component property re-hydration
    } else {
      alert(res.error);
    }
  };

  const handleBookSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !selectedHour || !targetDate) {
      return alert("Complete all appointment parameter choices.");
    }
    
    setLoading(true);
    const res = await createNewTimeSlotBooking({
      clientId: parseInt(selectedClient, 10),
      targetDate: targetDate, // 🌟 Safe non-drift day timeline anchor passed cleanly
      hour: parseInt(selectedHour, 10),
    });
    setLoading(false);
    
    if (res.success) {
      setActiveModal(null);
      setSelectedClient("");
      setSelectedHour("");
      router.refresh(); // 🌟 Sync the dashboard and scheduler slots instantly
    } else {
      alert(res.error);
    }
  };

  return (
    <div className="w-full space-y-2.5">
      <button 
        onClick={() => setActiveModal("token")}
        className="w-full p-3 bg-gradient-to-r from-pink-600/20 to-rose-600/20 hover:from-pink-600/30 hover:to-rose-600/30 border border-pink-800/40 rounded-xl text-xs font-bold uppercase tracking-wider text-pink-300 transition cursor-pointer text-left flex justify-between items-center select-none"
      >
        <span>🎟️ Issue New Walk-in Token</span>
        <span className="text-[10px] bg-pink-900/40 px-2 py-0.5 rounded border border-pink-700/40 font-mono">F2 Key</span>
      </button>

      <button 
        onClick={() => setActiveModal("appointment")}
        className="w-full p-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-300 transition cursor-pointer text-left flex justify-between items-center select-none"
      >
        <span>📅 Book Appointment Slot</span>
        <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded border border-slate-700/30 font-mono">F3 Key</span>
      </button>

      {/* 🎟️ MODAL A: WALK-IN DISPENSER SHEET */}
      {activeModal === "token" && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleIssueToken} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-sm space-y-4 shadow-2xl text-slate-100">
            <h3 className="text-sm uppercase font-black tracking-wider text-pink-400">Dispense Walk-In Token</h3>
            <div className="space-y-1 text-xs">
              <label className="text-slate-400">Guest Custom Descriptor Name</label>
              <input 
                type="text" 
                placeholder="Walk-In Client Name" 
                value={walkInName}
                onChange={e => setWalkInName(e.target.value)}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl mt-1 focus:outline-none focus:border-pink-500/50"
                required
              />
            </div>
            <div className="flex gap-2 text-xs pt-2">
              <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-pink-600 hover:bg-pink-500 rounded-xl font-bold uppercase tracking-wider transition disabled:opacity-50">{loading ? "Printing..." : "Issue Token"}</button>
              <button type="button" onClick={() => { setActiveModal(null); setWalkInName(""); }} className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 transition">Close</button>
            </div>
          </form>
        </div>
      )}

      {/* 📅 MODAL B: APPOINTMENT TIME SLOT SLOT ALLOCATION */}
      {activeModal === "appointment" && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleBookSlot} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-sm space-y-4 shadow-2xl text-slate-100">
            <h3 className="text-sm uppercase font-black tracking-wider text-indigo-400">Secure Time Lane Booking</h3>
            
            <div className="space-y-3 text-xs">
              {/* Target Date Input Field */}
              <div>
                <label className="text-slate-400">Target Appointment Date</label>
                <input 
                  type="date" 
                  value={targetDate} 
                  onChange={e => setTargetDate(e.target.value)} 
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl mt-1 focus:outline-none focus:border-indigo-500/50 text-slate-200"
                  required
                />
              </div>

              {/* Client Selector Segment */}
              <div className="border-t border-slate-800/60 pt-2">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-400">Target Customer Profile</label>
                  <button 
                    type="button" 
                    onClick={() => setShowFastReg(!showFastReg)} 
                    className="text-[10px] text-indigo-400 font-bold tracking-tight hover:underline"
                  >
                    {showFastReg ? "← View Profiles List" : "+ Create New Profile"}
                  </button>
                </div>

                {!showFastReg ? (
                  <select 
                    value={selectedClient} 
                    onChange={e => setSelectedClient(e.target.value)} 
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none text-slate-300"
                    required
                  >
                    <option value="">Choose a file...</option>
                    {clientsList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                ) : (
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 mt-1 animate-fadeIn">
                    <input 
                      type="text" 
                      placeholder="Customer Full Name" 
                      value={regName} 
                      onChange={e => setRegName(e.target.value)}
                      className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none"
                    />
                    <input 
                      type="tel" 
                      placeholder="Primary Mobile Phone" 
                      value={regPhone} 
                      onChange={e => setRegPhone(e.target.value)}
                      className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none"
                    />
                    <button 
                      type="button" 
                      onClick={handleFastRegistration} 
                      disabled={loading}
                      className="w-full py-1.5 bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-500/40 text-indigo-200 rounded-lg font-bold uppercase text-[10px] tracking-wide transition"
                    >
                      {loading ? "Registering..." : "Commit Registration File"}
                    </button>
                  </div>
                )}
              </div>

              {/* Target Shift Selection Field */}
              <div>
                <label className="text-slate-400">Target Shift Hour</label>
                <select 
                  value={selectedHour} 
                  onChange={e => setSelectedHour(e.target.value)} 
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl mt-1 focus:outline-none text-slate-300"
                  required
                >
                  <option value="">Choose window...</option>
                  {Array.from({ length: 12 }, (_, i) => i + 9).map(h => (
                    <option key={h} value={h}>{h > 12 ? h - 12 : h}:00 {h >= 12 ? "PM" : "AM"}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 text-xs pt-2">
              <button 
                type="submit" 
                disabled={loading || showFastReg} 
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold uppercase tracking-wider transition disabled:opacity-40"
              >
                {loading ? "Locking..." : "Book Slot"}
              </button>
              <button 
                type="button" 
                onClick={() => { setActiveModal(null); setSelectedClient(""); setSelectedHour(""); setShowFastReg(false); }} 
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 transition"
              >
                Close
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}