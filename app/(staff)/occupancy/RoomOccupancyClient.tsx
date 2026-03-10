"use client";

import React, { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  DoorOpen, UserCheck, Wind, AlertCircle, X, 
  Loader2, Receipt, Check, ArrowLeft, UserPlus 
} from "lucide-react";
import { updateRoomStatus, processCheckout } from "@/lib/actions/room-actions";

type RoomStatus = "available" | "occupied" | "cleaning" | "maintenance";

export default function RoomOccupancyPage({ initialRooms }: { initialRooms: any[] }) {
  const [rooms, setRooms] = useState(initialRooms);
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null);
  const [showBill, setShowBill] = useState(false);
  const [guestNameInput, setGuestNameInput] = useState("");
  const [isPending, startTransition] = useTransition();

  // Helper to update local state immediately for a snappy UI
  const updateLocalRoom = (roomNumber: string, updates: any) => {
    setRooms(prev => prev.map(r => r.number === roomNumber ? { ...r, ...updates } : r));
    setSelectedRoom((prev: any) => prev?.number === roomNumber ? { ...prev, ...updates } : prev);
  };

  const handleStatusChange = (nextStatus: RoomStatus) => {
    // If moving from occupied to cleaning, show the bill first
    if (selectedRoom.status === "occupied" && nextStatus === "cleaning") {
      setShowBill(true);
    } 
    // If checking in (available -> occupied), we need a name first
    else if (selectedRoom.status === "available" && nextStatus === "occupied") {
      // Logic handled by the check-in form button
    } 
    else {
      startTransition(async () => {
        const res = await updateRoomStatus(selectedRoom.number, nextStatus);
        if (res.success) {
          updateLocalRoom(selectedRoom.number, { status: nextStatus, guestName: null });
        }
      });
    }
  };

  const handleCheckIn = () => {
  if (!guestNameInput) return;
  startTransition(async () => {
    // This call now matches the updated 3-argument signature
    const res = await updateRoomStatus(selectedRoom.number, "occupied", guestNameInput);
    if (res.success) {
      updateLocalRoom(selectedRoom.number, { status: "occupied", guestName: guestNameInput });
      setGuestNameInput("");
    }
  });
};
  const finalizeCheckout = () => {
    startTransition(async () => {
      const amount = 14950; // Dynamic fetch logic can go here
      const res = await processCheckout(selectedRoom.number, selectedRoom.guestName, amount);
      if (res.success) {
        // After checkout, move room to cleaning status
        await updateRoomStatus(selectedRoom.number, "cleaning");
        updateLocalRoom(selectedRoom.number, { status: "cleaning", guestName: null });
        setShowBill(false);
        setSelectedRoom(null);
      }
    });
  };

  return (
    <div className="flex min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-amber-400 selection:text-slate-950">
      <div className="flex-1 max-w-10xl p-8 md:p-12 overflow-y-auto pb-40">
        <header className="max-w-6xl mx-auto mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-10xl font-black tracking-tighter text-white uppercase italic">Inventory.</h1>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-3">
              Ethereal Inn • {rooms.length} Units Online
            </p>
          </div>
          <div className="flex flex-wrap gap-4 bg-white/5 p-3 rounded-3xl border border-white/10 backdrop-blur-md">
            <StatusLegend label="Ready" color="bg-emerald-500" />
            <StatusLegend label="Stay" color="bg-amber-400" />
            <StatusLegend label="Clean" color="bg-blue-500" />
            <StatusLegend label="Ooo" color="bg-rose-500" />
          </div>
        </header>

        <div className="max-w-10xl mx-auto flex flex-col-reverse gap-16">
          {[1, 2, 3, 4, 5].map((floor) => (
            <div key={floor}>
              <div className="flex items-center gap-6 mb-8">
                <span className="text-slate-900 font-black text-6xl uppercase tracking-tighter opacity-50">F0{floor}</span>
                <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {rooms.filter(r => r.floor === floor).map(room => (
                  <RoomCard key={room.number} room={room} onClick={() => { setSelectedRoom(room); setShowBill(false); }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedRoom && (
          <motion.aside 
            initial={{ x: "100%" }} 
            animate={{ x: 0 }} 
            exit={{ x: "100%" }} 
            className="fixed right-0 top-0 h-full w-full max-w-md bg-[#01040f] border-l border-white/10 z-[100] shadow-2xl p-8 md:p-12 flex flex-col overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-16">
              <div className="px-6 py-3 bg-white/5 rounded-2xl border border-white/10">
                <span className="text-amber-400 font-black text-2xl tracking-tighter italic">Room {selectedRoom.number}</span>
              </div>
              <button onClick={() => setSelectedRoom(null)} className="p-3 bg-white/5 rounded-full hover:bg-white/10 text-slate-500 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1">
              {!showBill ? (
                <div className="space-y-12">
                  {/* STATUS SELECTOR */}
                  <section>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6 block">Quick Transition</label>
                    <div className="grid grid-cols-2 gap-4">
                      {["available", "occupied", "cleaning", "maintenance"].map((s) => (
                        <button 
                          key={s} 
                          disabled={isPending || (s === 'occupied' && selectedRoom.status === 'available')} 
                          onClick={() => handleStatusChange(s as any)} 
                          className={`py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${selectedRoom.status === s ? 'bg-amber-400 border-amber-400 text-slate-950' : 'bg-white/5 border-white/10 text-slate-500 hover:border-white/20'}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* CHECK-IN FORM FOR AVAILABLE ROOMS */}
                  {selectedRoom.status === "available" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 p-8 rounded-[3rem] border border-emerald-500/20">
                      <label className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2 mb-6">
                        <UserPlus size={14} /> New Check-In
                      </label>
                      <input 
                        className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-amber-400 transition-all mb-4"
                        placeholder="Primary Guest Name"
                        value={guestNameInput}
                        onChange={(e) => setGuestNameInput(e.target.value)}
                      />
                      <button 
                        onClick={handleCheckIn}
                        disabled={isPending || !guestNameInput}
                        className="w-full bg-emerald-500 text-slate-950 font-black py-4 rounded-2xl flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest"
                      >
                        {isPending ? <Loader2 className="animate-spin" /> : <><Check size={16}/> Confirm Stay</>}
                      </button>
                    </motion.div>
                  )}

                  {/* GUEST INFO FOR OCCUPIED ROOMS */}
                  {selectedRoom.guestName && selectedRoom.status === 'occupied' && (
                    <div className="bg-white/5 p-8 rounded-[3rem] border border-white/5 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <UserCheck size={64} />
                      </div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Inhabitant</label>
                      <p className="text-3xl font-black text-white mt-2 leading-none">{selectedRoom.guestName}</p>
                      <div className="mt-8 pt-6 border-t border-white/5 flex gap-4">
                        <button className="flex-1 bg-white/5 hover:bg-white/10 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors">Services</button>
                        <button className="flex-1 bg-white/5 hover:bg-white/10 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors">Ext. Stay</button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                  <div className="bg-white/5 p-8 rounded-[3rem] border border-amber-400/20 shadow-2xl">
                    <h4 className="text-amber-400 font-black uppercase tracking-widest text-xs mb-8 flex items-center gap-2">
                      <Receipt size={14}/> Final Settlement
                    </h4>
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm text-slate-400 font-medium">
                        <span>Room Charges</span>
                        <span>₹12,500</span>
                      </div>
                      <div className="flex justify-between text-sm text-slate-400 font-medium">
                        <span>Kitchen & Bar</span>
                        <span>₹2,450</span>
                      </div>
                      <div className="border-t border-white/10 pt-4 mt-4 flex justify-between text-white text-xl font-black">
                        <span>Total Due</span>
                        <span>₹14,950</span>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={finalizeCheckout} 
                    disabled={isPending} 
                    className="w-full bg-amber-400 text-slate-950 font-black py-6 rounded-3xl uppercase text-[10px] tracking-[0.3em] flex items-center justify-center gap-2 shadow-lg shadow-amber-400/10 hover:shadow-amber-400/20 transition-all"
                  >
                    {isPending ? <Loader2 className="animate-spin" /> : "Authorize & Move to Cleaning"}
                  </button>

                  <button 
                    onClick={() => setShowBill(false)} 
                    className="w-full text-slate-500 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <ArrowLeft size={14} /> Go Back
                  </button>
                </motion.div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}

function RoomCard({ room, onClick }: any) {
  const styles = { 
    available: "border-emerald-500/30 text-emerald-500 bg-emerald-500/5 hover:border-emerald-500/60", 
    occupied: "border-amber-400/30 text-amber-400 bg-amber-400/5 hover:border-amber-400/60", 
    cleaning: "border-blue-500/30 text-blue-500 bg-blue-500/5 hover:border-blue-500/60", 
    maintenance: "border-rose-500/30 text-rose-500 bg-rose-500/5 hover:border-rose-500/60" 
  };
  
  const Icon = { 
    available: DoorOpen, 
    occupied: UserCheck, 
    cleaning: Wind, 
    maintenance: AlertCircle 
  }[room.status as RoomStatus];

  return (
    <motion.div 
      whileHover={{ y: -8, scale: 1.02 }} 
      onClick={onClick} 
      className={`relative overflow-hidden cursor-pointer p-2 rounded-[2.5rem] border-2 transition-all shadow-2xl ${styles[room.status as RoomStatus]} group`}
    >
      <div className="flex justify-between lg:justify-start items-start mb-10">
        <h3 className="text-5xl lg:text-2xl font-black tracking-tighter italic">{room.number}</h3>
        <Icon size={28} className="opacity-30 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="space-y-1 mb-4">
        <span className="text-[6px] font-black uppercase tracking-[0.3em] opacity-40">Status</span>
        <p className="font-black text-white uppercase tracking-tighter text-sm">{room.status}</p>
      </div>
      
      {/* Subtle indicator for occupied rooms */}
      {room.status === 'occupied' && (
        <div className="absolute top-0 right-0 w-20 h-20 bg-amber-400/5 rounded-bl-full -mr-10 -mt-10" />
      )}
    </motion.div>
  );
}

function StatusLegend({ label, color }: any) {
  return (
    <div className="flex items-center gap-3 px-3">
      <div className={`w-2 h-2 rounded-full ${color} shadow-[0_0_8px_rgba(0,0,0,0.5)]`} />
      <span className="text-[9px] font-black uppercase text-slate-500">{label}</span>
    </div>
  );
}