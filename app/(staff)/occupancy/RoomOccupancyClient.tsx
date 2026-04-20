"use client";

import React, { useState, useTransition, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  DoorOpen, UserCheck, Wind, AlertCircle, X, Loader2, 
  Receipt, ArrowLeft, UserPlus, Search, Calendar, 
  CheckCircle2, Zap, Sparkles, TrendingUp,
  Check
} from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation"; 
import { updateRoomStatus, processCheckout, type RoomStatus } from "@/lib/actions/room-actions";
import DashboardBackground from "@/components/dashboard/DashboardBackground";
import Link from "next/link";

interface Room {
  id?: number;
  number: number;
  floor: number;
  status: RoomStatus | null; 
  guestName?: string | null;
}

interface RoomOccupancyProps {
  initialRooms: Room[];
  prefillName?: string | null; 
  onRoomUpdate?: () => Promise<void>; 
}

export default function RoomOccupancyClient({ initialRooms, prefillName: propPrefill, onRoomUpdate }: RoomOccupancyProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const rawPrefill = propPrefill || searchParams.get("prefillGuest");
  const prefillName = (rawPrefill && rawPrefill !== "undefined") ? rawPrefill : null;

  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showBill, setShowBill] = useState(false);
  const [guestNameInput, setGuestNameInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const [checkInDate, setCheckInDate] = useState(new Date().toISOString().split('T')[0]);
  const [roomRent, setRoomRent] = useState(0);
  const [serviceFoodTotal, setServiceFoodTotal] = useState(0);

  // Sync rooms when server data changes & handle prefill focus
  useEffect(() => {
    setRooms(initialRooms);
    if (prefillName) {
      setGuestNameInput(prefillName);
      const firstVacant = initialRooms.find(r => r.status === 'available');
      if (firstVacant && !selectedRoom) {
        setSelectedRoom(firstVacant);
      }
    }
  }, [initialRooms, prefillName]);

  const stats = useMemo(() => ({
    occupied: rooms.filter(r => r.status === 'occupied').length,
    available: rooms.filter(r => r.status === 'available').length,
    cleaning: rooms.filter(r => r.status === 'cleaning').length,
    total: rooms.length
  }), [rooms]);

  const filteredRooms = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return rooms.filter(r => 
      String(r.number).includes(q) || (r.guestName || "").toLowerCase().includes(q)
    );
  }, [rooms, searchQuery]);

  const uniqueFloors = useMemo(() => {
    const floors = Array.from(new Set(rooms.map(r => r.floor)));
    return floors.sort((a, b) => b - a);
  }, [rooms]);

  const updateLocal = (num: number, up: Partial<Room>) => {
    setRooms(prev => prev.map(r => r.number === num ? { ...r, ...up } : r));
    setSelectedRoom(prev => (prev?.number === num ? { ...prev, ...up } : prev));
    if (onRoomUpdate) onRoomUpdate();
  };

  const handleStatusChange = (s: RoomStatus) => {
    if (!selectedRoom) return;
    if (selectedRoom.status === "occupied" && s === "cleaning") {
      setShowBill(true);
    } else {
      startTransition(async () => {
        const res = await updateRoomStatus(selectedRoom.number, s);
        if (res.success) updateLocal(selectedRoom.number, { status: s, guestName: null });
      });
    }
  };

  const handleCheckIn = () => {
    if (!guestNameInput || !selectedRoom) return;
    startTransition(async () => {
      const res = await updateRoomStatus(selectedRoom.number, "occupied", guestNameInput);
      if (res.success) {
        updateLocal(selectedRoom.number, { status: "occupied", guestName: guestNameInput });
        setGuestNameInput("");
        setSelectedRoom(null);
        if (prefillName) router.replace('/occupancy', { scroll: false });
      }
    });
  };

  const finalizeCheckout = () => {
    if (!selectedRoom?.guestName) return;
    startTransition(async () => {
      const total = Number(roomRent) + Number(serviceFoodTotal);
      const res = await processCheckout(selectedRoom.number, selectedRoom.guestName!, total);
      if (res.success) {
        updateLocal(selectedRoom.number, { status: "cleaning", guestName: null });
        setShowBill(false);
        setSelectedRoom(null);
        setRoomRent(0);
        setServiceFoodTotal(0);
      }
    });
  };

  return (
    <div className="flex min-h-screen bg-transparent text-slate-100 font-sans">
      <div className="flex-1 p-6 md:p-12 overflow-y-auto pb-40 no-scrollbar relative z-10">
        <DashboardBackground />
        
        {/* Header */}
        <header className="max-w-[1700px] mx-auto mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white uppercase italic leading-[0.8]">Inventory.</h1>
            <div className="flex items-center gap-3 mt-4 ml-1">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.5em]">Live Cluster Control — Dynamic Deployment</p>
            </div>
          </div>
          <div className="relative w-full max-w-md">
            <Link href='/' className='text-slate-500 text-[9px] font-black uppercase tracking-[0.5em] mb-24 hover:text-rose-500'>Return</Link>
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input 
              type="text" placeholder="Search Unit / Guest Name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-6 outline-none focus:border-amber-400/50 text-[10px] font-black uppercase text-white transition-all backdrop-blur-xl" 
            />
          </div>
        </header>

        {/* Stats Bar */}
        <div className="max-w-[1700px] mx-auto mb-16 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatBox label="In-House" value={stats.occupied} icon={UserCheck} color="text-amber-400" />
          <StatBox label="Available" value={stats.available} icon={DoorOpen} color="text-emerald-500" />
          <StatBox label="Cleaning" value={stats.cleaning} icon={Wind} color="text-blue-500" />
          <StatBox label="Total Units" value={stats.total} icon={CheckCircle2} color="text-slate-500" />
        </div>

        {/* Floors Grid */}
        <div className="max-w-[1700px] mx-auto space-y-24 pb-20">
          {uniqueFloors.map((f) => {
            const floorRooms = filteredRooms.filter(r => r.floor === f);
            if (floorRooms.length === 0) return null;

            return (
              <div key={f} className="relative">
                <div className="flex items-center gap-6 mb-10 sticky top-4 z-20 px-6 py-4 rounded-3xl glass-morphism border border-white/5 shadow-2xl">
                  <span className="text-white/20 font-black text-6xl uppercase tracking-tighter italic leading-none">F0{f}</span>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Structural Level</span>
                    <div className="h-[2px] w-32 bg-gradient-to-r from-amber-500 to-transparent mt-1" />
                  </div>
                  <div className="h-[1px] flex-1 bg-white/5 mx-4" />
                  <span className="text-[10px] text-white/40 font-black uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full border border-white/5">
                    {floorRooms.length} Operational Units
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9 gap-3">
                  {floorRooms.map(room => (
                    <RoomTile 
                      key={room.number} 
                      room={room} 
                      isLeadActive={prefillName && room.status === 'available'}
                      onClick={() => { setSelectedRoom(room); setShowBill(false); }} 
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sidebar Panel */}
      <AnimatePresence>
        {selectedRoom && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedRoom(null)} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[90]" />
            <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed right-0 top-0 h-full w-full max-w-md bg-[#02040a]/90 backdrop-blur-[50px] border-l border-white/10 z-[100] p-10 flex flex-col shadow-[-20px_0_100px_rgba(0,0,0,0.9)]">
              
              <div className="flex justify-between items-center mb-16">
                <div className="px-6 py-3 bg-white/5 rounded-3xl border border-white/10">
                  <span className="text-amber-400 font-black text-2xl tracking-tighter italic uppercase">Unit {selectedRoom.number}</span>
                </div>
                <button onClick={() => setSelectedRoom(null)} className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-rose-500/20 hover:text-rose-500 rounded-2xl transition-all text-slate-500"><X size={20}/></button>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar">
                {!showBill ? (
                  <div className="space-y-12">
                    <section>
                      <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 mb-6 block underline decoration-amber-500/50 underline-offset-8">Quick Operations</label>
                      <div className="grid grid-cols-2 gap-4">
                        {(["available", "occupied", "cleaning", "maintenance"] as RoomStatus[]).map((s) => (
                          <button 
                            key={s} 
                            disabled={isPending || (s === 'occupied' && !selectedRoom.guestName && !guestNameInput)} 
                            onClick={() => handleStatusChange(s)} 
                            className={`py-5 rounded-3xl text-[10px] font-black uppercase tracking-widest border transition-all ${selectedRoom.status === s ? 'bg-amber-400 border-amber-400 text-slate-950 shadow-2xl shadow-amber-400/20' : 'bg-white/5 border-white/10 text-slate-500 hover:border-white/30'}`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </section>

                    {selectedRoom.status === "available" && (
                      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className={`p-8 rounded-[3rem] border-2 transition-all ${prefillName ? 'bg-amber-400/10 border-amber-400/40 ring-4 ring-amber-400/5' : 'bg-white/[0.02] border-white/5'}`}>
                        <div className="flex justify-between items-start mb-8">
                            <div className="space-y-1">
                                <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 ${prefillName ? 'text-amber-400' : 'text-slate-500'}`}>
                                  {prefillName ? <Zap size={14} className="animate-pulse" /> : <UserPlus size={14} />} 
                                  {prefillName ? "Convert Lead" : "New Check-in"}
                                </h3>
                                <p className="text-[9px] font-bold text-slate-600 uppercase">Registry Entry</p>
                            </div>
                            {prefillName && <div className="bg-amber-400 text-slate-950 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter shadow-lg">Lead Active</div>}
                        </div>
                        
                        <div className="space-y-4">
                            <input className="w-full bg-black/60 border border-white/10 rounded-2xl py-5 px-6 text-sm text-white outline-none focus:border-amber-400 transition-all font-black uppercase italic" placeholder="Guest Full Name" value={guestNameInput} onChange={(e) => setGuestNameInput(e.target.value)} />
                            <div className="relative">
                                <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                                <input type="date" className="w-full bg-black/60 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-xs text-white outline-none focus:border-amber-400 font-black uppercase" value={checkInDate} onChange={(e) => setCheckInDate(e.target.value)} />
                            </div>
                            <button onClick={handleCheckIn} disabled={isPending || !guestNameInput} className="w-full bg-amber-400 text-slate-950 font-black py-6 rounded-3xl flex items-center justify-center gap-3 uppercase text-xs tracking-widest shadow-2xl shadow-amber-400/30 active:scale-95 transition-all">
                                {isPending ? <Loader2 size={20} className="animate-spin" /> : <> <Check size={20} /> Finalize Entry</>}
                            </button>
                        </div>
                      </motion.div>
                    )}

                    {selectedRoom.guestName && selectedRoom.status === 'occupied' && (
                      <div className="bg-white/5 p-8 rounded-[3rem] border border-white/10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles size={40} /></div>
                        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-400 mb-3 block italic">Occupant Details</label>
                        <p className="text-3xl font-black text-white italic tracking-tighter mb-10 leading-tight uppercase truncate">{selectedRoom.guestName}</p>
                        <button onClick={() => setShowBill(true)} className="w-full bg-white text-slate-950 py-6 rounded-3xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-amber-400 transition-all active:scale-95 flex items-center justify-center gap-3">
                            <TrendingUp size={18} /> Process Checkout
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                    <div className="bg-white/5 p-10 rounded-[3.5rem] border border-white/10 space-y-10">
                      <div className="flex items-center gap-3 text-amber-400">
                          <Receipt size={18}/> 
                          <h4 className="font-black uppercase tracking-[0.3em] text-[10px]">Financial Audit</h4>
                      </div>
                      <div className="space-y-6">
                        <SideInput label="Unit Tariff" value={roomRent} onChange={setRoomRent} />
                        <SideInput label="Food & Services" value={serviceFoodTotal} onChange={setServiceFoodTotal} />
                        <div className="pt-10 border-t border-white/10 flex justify-between items-end">
                          <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Net Revenue</span>
                          <span className="text-5xl font-black italic text-white tracking-tighter">₹{(roomRent || 0) + (serviceFoodTotal || 0)}</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={finalizeCheckout} disabled={isPending} className="w-full bg-amber-400 text-slate-950 font-black py-7 rounded-[2.5rem] uppercase text-xs tracking-[0.3em] shadow-2xl shadow-amber-400/30 active:scale-95 transition-all">
                      {isPending ? "Syncing Transaction..." : "Authorize Settlement"}
                    </button>
                    <button onClick={() => setShowBill(false)} className="w-full text-slate-600 font-black text-[10px] uppercase flex items-center justify-center gap-3 hover:text-white transition-colors"><ArrowLeft size={14} /> Cancel Processing</button>
                  </motion.div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Sub-components for clean modularity
function SideInput({ label, value, onChange }: any) {
  return (
    <div className="relative">
      <input type="number" value={value || ""} onChange={(e) => onChange(Number(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded-2xl py-6 px-6 text-lg font-black text-white outline-none focus:border-amber-400 transition-all italic" />
      <label className="absolute -top-3 left-6 bg-[#01040f] px-3 text-[9px] font-black uppercase text-slate-600 tracking-[0.2em]">{label}</label>
    </div>
  );
}

function StatBox({ label, value, icon: Icon, color }: any) {
  return (
    <div className="bg-white/[0.03] border border-white/5 backdrop-blur-md p-10 rounded-[3rem] relative overflow-hidden group">
      <div className={`absolute -right-4 -bottom-4 opacity-[0.03] ${color} group-hover:scale-125 transition-transform duration-700`}><Icon size={120} /></div>
      <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-600 mb-2">{label}</p>
      <h4 className={`text-5xl font-black italic tracking-tighter ${color}`}>{value}</h4>
    </div>
  );
}

function RoomTile({ room, onClick, isLeadActive }: any) {
  const s: RoomStatus = room.status ?? "available";
  const statusStyles = {
    available: { color: "text-emerald-400", bg: "bg-emerald-400/10", icon: DoorOpen },
    occupied: { color: "text-amber-400", bg: "bg-amber-400/10", icon: UserCheck },
    cleaning: { color: "text-blue-400", bg: "bg-blue-400/10", icon: Wind },
    maintenance: { color: "text-rose-400", bg: "bg-rose-400/10", icon: AlertCircle }
  };
  const currentStyle = statusStyles[s];
  const Icon = currentStyle.icon;

  return (
    <motion.div 
      whileHover={{ y: -8, scale: 1.02 }} 
      whileTap={{ scale: 0.97 }} 
      onClick={onClick} 
      className={`
        glass-deep relative flex flex-col justify-between 
        p-5 rounded-[2.5rem] cursor-pointer transition-all duration-500
        aspect-square w-full overflow-hidden
        ${isLeadActive ? 'ring-2 ring-amber-400 ring-offset-4 ring-offset-[#02040a]' : 'border border-white/5'}
      `}
    >
      <div className="flex justify-between items-start w-full">
        <div className="flex flex-col">
          <h3 className="text-4xl font-black tracking-tighter italic leading-none text-white">{room.number}</h3>
          <div className="flex items-center gap-1.5 mt-1">
             <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${currentStyle.bg.replace('/10', '')}`} />
             <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${currentStyle.color}`}>{s}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isLeadActive && <Sparkles size={12} className="text-amber-400 animate-bounce" />}
          <Icon size={18} className={`${currentStyle.color} opacity-30`} />
        </div>
      </div>

      <div className="mt-auto">
        {room.guestName ? (
          <div className="bg-white/[0.03] px-3 py-2 rounded-xl border border-white/5 backdrop-blur-md">
            <p className="text-[10px] font-black text-white/90 truncate italic uppercase tracking-tight">{room.guestName}</p>
          </div>
        ) : (
          <div className="px-1"><p className="text-[8px] font-black text-white/10 uppercase tracking-[0.3em]">Ready</p></div>
        )}
      </div>

      <div className={`absolute -bottom-10 -right-10 w-24 h-24 blur-[50px] rounded-full opacity-20 ${currentStyle.bg}`} />
    </motion.div>
  );
}