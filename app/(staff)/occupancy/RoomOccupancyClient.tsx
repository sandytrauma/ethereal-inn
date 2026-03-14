"use client";

import React, { useState, useTransition, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  DoorOpen, UserCheck, Wind, AlertCircle, X, 
  Loader2, Receipt, Check, ArrowLeft, UserPlus, Search, Calendar,
  BedDouble, CheckCircle2
} from "lucide-react";
import { updateRoomStatus, processCheckout, type RoomStatus } from "@/lib/actions/room-actions";

interface Room {
  id?: number;
  number: number;
  floor: number;
  status: RoomStatus | null; 
  guestName?: string | null;
  checkInTime?: Date | string | null;
}

// Fixed Interface to include onRoomUpdate callback
interface RoomOccupancyProps {
  initialRooms: Room[];
  onRoomUpdate?: () => Promise<void>; 
}

export default function RoomOccupancyPage({ initialRooms, onRoomUpdate }: RoomOccupancyProps) {
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showBill, setShowBill] = useState(false);
  const [guestNameInput, setGuestNameInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  // Financial & Date States
  const [checkInDate, setCheckInDate] = useState(new Date().toISOString().split('T')[0]);
  const [roomRent, setRoomRent] = useState(0);
  const [serviceFoodTotal, setServiceFoodTotal] = useState(0);

  // Keep local state in sync with Dashboard props
  useEffect(() => {
    setRooms(initialRooms);
  }, [initialRooms]);

  const dashboardStats = useMemo(() => {
    const occupied = rooms.filter(r => r.status === 'occupied').length;
    const cleaning = rooms.filter(r => r.status === 'cleaning').length;
    const available = rooms.filter(r => r.status === 'available').length;
    
    return {
      current: occupied,
      available: available,
      cleaning: cleaning,
      total: rooms.length
    };
  }, [rooms]);

  const updateLocalRoom = (roomNumber: number, updates: Partial<Room>) => {
    setRooms(prev => prev.map(r => r.number === roomNumber ? { ...r, ...updates } : r));
    setSelectedRoom((prev) => (prev?.number === roomNumber ? { ...prev, ...updates } : prev));
  };

  const filteredRooms = useMemo(() => {
    if (!searchQuery) return rooms;
    const query = searchQuery.toLowerCase();
    return rooms.filter(room => 
      String(room.number).includes(query) || 
      (room.guestName || "").toLowerCase().includes(query)
    );
  }, [rooms, searchQuery]);

  const handleStatusChange = (nextStatus: RoomStatus) => {
    if (!selectedRoom) return;

    if (selectedRoom.status === "occupied" && nextStatus === "cleaning") {
      setShowBill(true);
    } else {
      startTransition(async () => {
        const res = await updateRoomStatus(selectedRoom.number, nextStatus);
        if (res.success) {
          updateLocalRoom(selectedRoom.number, { status: nextStatus, guestName: null });
          if (onRoomUpdate) await onRoomUpdate(); // Sync Parent
        }
      });
    }
  };

  const handleCheckIn = () => {
    if (!guestNameInput || !selectedRoom) return;
    startTransition(async () => {
      const res = await updateRoomStatus(selectedRoom.number, "occupied", guestNameInput);
      if (res.success) {
        updateLocalRoom(selectedRoom.number, { 
          status: "occupied", 
          guestName: guestNameInput,
        });
        setGuestNameInput("");
        if (onRoomUpdate) await onRoomUpdate(); // Sync Parent
      }
    });
  };

  const finalizeCheckout = () => {
    if (!selectedRoom || !selectedRoom.guestName) return;

    const guestName: string = selectedRoom.guestName;
    const roomNumber = selectedRoom.number;

    startTransition(async () => {
      const totalAmount = Number(roomRent) + Number(serviceFoodTotal);
      const res = await processCheckout(roomNumber, guestName, totalAmount);

      if (res.success) {
        updateLocalRoom(roomNumber, { status: "cleaning", guestName: null });
        setShowBill(false);
        setSelectedRoom(null);
        setRoomRent(0);
        setServiceFoodTotal(0);
        if (onRoomUpdate) await onRoomUpdate(); // Sync Parent
      } else {
        alert("Checkout failed. Please check system logs.");
      }
    });
  };

  return (
    <div className="flex min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-amber-400 selection:text-slate-950">
      <div className="flex-1 max-w-10xl p-8 md:p-12 overflow-y-auto pb-40">
        
        <header className="max-w-6xl mx-auto mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-10xl font-black tracking-tighter text-white uppercase italic leading-none">Inventory.</h1>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-3">
              Ethereal Inn • Live Operations Control
            </p>
          </div>
          <div className="flex flex-col gap-4 items-end">
            <div className="relative w-full max-w-xs group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-400 transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="Find room..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-10 pr-4 outline-none focus:border-amber-400/50 text-xs text-white" 
              />
            </div>
            <div className="flex flex-wrap gap-4 bg-white/5 p-3 rounded-3xl border border-white/10 backdrop-blur-md">
              <StatusLegend label="Ready" color="bg-emerald-500" />
              <StatusLegend label="Stay" color="bg-amber-400" />
              <StatusLegend label="Clean" color="bg-blue-500" />
              <StatusLegend label="Ooo" color="bg-rose-500" />
            </div>
          </div>
        </header>

        {/* --- DASHBOARD STATS SECTION --- */}
        <div className="max-w-6xl mx-auto mb-16">
           <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
              <StatCard label="Live Occupancy" value={dashboardStats.current} icon={BedDouble} color="text-amber-400" />
              <StatCard label="Available" value={dashboardStats.available} icon={DoorOpen} color="text-emerald-500" />
              <StatCard label="Turnover/Cleaning" value={dashboardStats.cleaning} icon={Wind} color="text-blue-500" />
              <StatCard label="Total Units" value={dashboardStats.total} icon={CheckCircle2} color="text-slate-400" />
           </div>
        </div>

        <div className="max-w-10xl mx-auto flex flex-col-reverse gap-16">
          {[5, 4, 3, 2, 1].map((floor) => (
            <div key={floor}>
              <div className="flex items-center gap-6 mb-8">
                <span className="text-slate-900 font-black text-6xl uppercase tracking-tighter opacity-50">F0{floor}</span>
                <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {filteredRooms.filter(r => r.floor === floor).map(room => (
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
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} 
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
                  <section>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6 block">Quick Transition</label>
                    <div className="grid grid-cols-2 gap-4">
                      {(["available", "occupied", "cleaning", "maintenance"] as RoomStatus[]).map((s) => (
                        <button 
                          key={s} 
                          disabled={isPending || (s === 'occupied' && selectedRoom.status === 'available')} 
                          onClick={() => handleStatusChange(s)} 
                          className={`py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${selectedRoom.status === s ? 'bg-amber-400 border-amber-400 text-slate-950' : 'bg-white/5 border-white/10 text-slate-500 hover:border-white/20'}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </section>

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
                      <div className="relative mb-4">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input type="date" className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white text-xs outline-none focus:border-amber-400"
                          value={checkInDate} onChange={(e) => setCheckInDate(e.target.value)} />
                      </div>
                      <button 
                        onClick={handleCheckIn}
                        disabled={isPending || !guestNameInput}
                        className="w-full bg-emerald-500 text-slate-950 font-black py-4 rounded-2xl flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest"
                      >
                        {isPending ? <Loader2 className="animate-spin" /> : <><Check size={16}/> Confirm Stay</>}
                      </button>
                    </motion.div>
                  )}

                  {selectedRoom.guestName && selectedRoom.status === 'occupied' && (
                    <div className="bg-white/5 p-8 rounded-[3rem] border border-white/5 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <UserCheck size={64} />
                      </div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Inhabitant</label>
                      <p className="text-3xl font-black text-white mt-2 leading-none">{selectedRoom.guestName}</p>
                      <div className="mt-8 pt-6 border-t border-white/5 flex gap-4">
                        <button className="flex-1 bg-white/5 hover:bg-white/10 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors">Services</button>
                        <button onClick={() => setShowBill(true)} className="flex-1 bg-amber-400 text-slate-950 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors">Checkout</button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                  <div className="bg-white/5 p-8 rounded-[3rem] border border-amber-400/20 shadow-2xl space-y-6">
                    <h4 className="text-amber-400 font-black uppercase tracking-widest text-xs flex items-center gap-2">
                      <Receipt size={14}/> Settlement Breakup
                    </h4>
                    <div className="space-y-4">
                      <div className="relative">
                        <input type="number" value={roomRent || ""} placeholder="Room Rent" className="w-full bg-slate-950 border border-white/10 rounded-xl py-4 px-6 text-white text-sm outline-none focus:border-amber-400"
                          onChange={(e) => setRoomRent(Number(e.target.value))} />
                        <label className="absolute -top-2 left-4 bg-[#01040f] px-2 text-[8px] font-black uppercase text-slate-500">Room Rent</label>
                      </div>
                      <div className="relative">
                        <input type="number" value={serviceFoodTotal || ""} placeholder="Food & Service" className="w-full bg-slate-950 border border-white/10 rounded-xl py-4 px-6 text-white text-sm outline-none focus:border-amber-400"
                          onChange={(e) => setServiceFoodTotal(Number(e.target.value))} />
                        <label className="absolute -top-2 left-4 bg-[#01040f] px-2 text-[8px] font-black uppercase text-slate-500">Food & Service</label>
                      </div>
                      <div className="border-t border-white/10 pt-4 mt-4 flex justify-between text-white text-xl font-black italic">
                        <span>Total Due</span>
                        <span>₹{Number(roomRent) + Number(serviceFoodTotal)}</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={finalizeCheckout} disabled={isPending} className="w-full bg-amber-400 text-slate-950 font-black py-6 rounded-3xl uppercase text-[10px] tracking-[0.3em] flex items-center justify-center gap-2">
                    {isPending ? <Loader2 className="animate-spin" /> : "Authorize Checkout"}
                  </button>
                  <button onClick={() => setShowBill(false)} className="w-full text-slate-500 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                    <ArrowLeft size={14} /> Back
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

// --- SUB-COMPONENTS ---
function StatCard({ label, value, icon: Icon, color }: { label: string, value: number | string, icon: any, color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 border border-white/10 p-6 rounded-[2rem] backdrop-blur-sm group hover:border-white/20 transition-all"
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-xl bg-white/5 ${color}`}>
          <Icon size={20} />
        </div>
        <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500">Live</span>
      </div>
      <div>
        <h4 className={`text-4xl font-black tracking-tighter italic leading-none mb-1 ${color}`}>
          {value}
        </h4>
        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 opacity-60">
          {label}
        </p>
      </div>
    </motion.div>
  );
}

function RoomCard({ room, onClick }: { room: Room, onClick: () => void }) {
  const currentStatus: RoomStatus = room.status ?? "available";

  const styles = { 
    available: "border-emerald-500/30 text-emerald-500 bg-emerald-500/5 hover:border-emerald-500/60", 
    occupied: "border-amber-400/30 text-amber-400 bg-amber-400/5 hover:border-amber-400/60", 
    cleaning: "border-blue-500/30 text-blue-500 bg-blue-500/5 hover:border-blue-500/60", 
    maintenance: "border-rose-500/30 text-rose-500 bg-rose-500/5 hover:border-rose-500/60" 
  };
  
  const iconMap = {
    available: DoorOpen,
    occupied: UserCheck,
    cleaning: Wind,
    maintenance: AlertCircle
  };
  
  const Icon = iconMap[currentStatus];

  return (
    <motion.div 
      whileHover={{ y: -8, scale: 1.02 }} onClick={onClick} 
      className={`relative overflow-hidden cursor-pointer p-6 rounded-[2.5rem] border-2 transition-all shadow-2xl ${styles[currentStatus]} group`}
    >
      <div className="flex justify-between items-start mb-10">
        <h3 className="text-2xl font-black tracking-tighter italic leading-none">{room.number}</h3>
        <Icon size={28} className="opacity-30 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="space-y-1 mb-4">
        <span className="text-[6px] font-black uppercase tracking-[0.3em] opacity-40">Status</span>
        <p className="font-black text-white uppercase tracking-tighter text-sm">{currentStatus}</p>
        {room.guestName && (
          <p className="text-[10px] font-bold text-amber-400 truncate mt-2 italic bg-amber-400/10 px-3 py-1 rounded-full w-fit max-w-full">
            {room.guestName}
          </p>
        )}
      </div>
      {currentStatus === 'occupied' && (
        <div className="absolute top-0 right-0 w-20 h-20 bg-amber-400/5 rounded-bl-full -mr-10 -mt-10" />
      )}
    </motion.div>
  );
}

function StatusLegend({ label, color }: { label: string, color: string }) {
  return (
    <div className="flex items-center gap-3 px-3">
      <div className={`w-2 h-2 rounded-full ${color} shadow-[0_0_8px_rgba(0,0,0,0.5)]`} />
      <span className="text-[9px] font-black uppercase text-slate-500">{label}</span>
    </div>
  );
}