"use client";

import React, { useState, useTransition, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  DoorOpen, UserCheck, Wind, AlertCircle, X, Loader2, 
  Receipt, ArrowLeft, UserPlus, Search, Calendar, 
  CheckCircle2, Zap, Sparkles, TrendingUp,
  Check, BedDouble, RefreshCcw,
  CalendarCheck,
  Database,
  MapPin,
  Fingerprint,
  Users,
  ChevronDown,
  Building2
} from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation"; 
import { updateRoomStatus, processCheckout, seedRooms, type RoomStatus, trimExcessRooms } from "@/lib/actions/room-actions";
import DashboardBackground from "@/components/dashboard/DashboardBackground";
import Link from "next/link";

// --- TYPES ---

interface Room {
  id: number;           
  number: number;
  floor: number;
  status: RoomStatus | null; 
  guestName?: string | null;
  checkInTime?: Date | null; 
  checkInDate?: Date | null; // <--- ADD THIS LINE
  propertyId: string;        
}

interface Property {
  id: string;
  name: string;
}

interface RoomOccupancyProps {
  properties: Property[];
  currentPropertyId: string;
  initialRooms: Room[];
  prefillName?: string | null; 
  onRoomUpdate?: () => Promise<void>; 
  onlySwitcher?: boolean;
}

// --- MAIN COMPONENT ---

export default function RoomOccupancyClient({ 
  initialRooms, 
  prefillName: propPrefill, 
  onRoomUpdate,
  properties = [], 
  currentPropertyId, 
  onlySwitcher = false 
}: RoomOccupancyProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const urlPropertyId = searchParams.get("propertyId") || currentPropertyId || "";
  const rawPrefill = propPrefill || searchParams.get("prefillGuest");
  const prefillName = (rawPrefill && rawPrefill !== "undefined") ? rawPrefill : null;

  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showBill, setShowBill] = useState(false);
  const [guestNameInput, setGuestNameInput] = useState("");
  
  const [paxInput, setPaxInput] = useState(1);
  const [idNumberInput, setIdNumberInput] = useState("");
  const [stateOriginInput, setStateOriginInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const [checkInDate, setCheckInDate] = useState(new Date().toISOString().split('T')[0]);
  const [roomRent, setRoomRent] = useState(0);
  const [serviceFoodTotal, setServiceFoodTotal] = useState(0);

  // --- UI-ONLY: touch-friendly property switcher state (replaces broken hover-only dropdown) ---
  const [propertyMenuOpen, setPropertyMenuOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement | null>(null);

  // Sync rooms when server data changes
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

  // --- UI-ONLY: close the property switcher when tapping/clicking outside of it ---
  useEffect(() => {
    if (!propertyMenuOpen) return;

    function handleOutsideInteraction(e: MouseEvent | TouchEvent) {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setPropertyMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideInteraction);
    document.addEventListener("touchstart", handleOutsideInteraction);
    return () => {
      document.removeEventListener("mousedown", handleOutsideInteraction);
      document.removeEventListener("touchstart", handleOutsideInteraction);
    };
  }, [propertyMenuOpen]);

  // --- UI-ONLY: lock background scroll while the room detail sheet is open on mobile ---
  useEffect(() => {
    if (selectedRoom) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [selectedRoom]);

  const handleCleanup = async () => {
    if (!confirm("This will delete the extra 6 rooms per floor. Proceed?")) return;
    
    startTransition(async () => {
      for (let f = 1; f <= 4; f++) {
        await trimExcessRooms(urlPropertyId, f, 6);
      }
      router.refresh();
      alert("Cleanup complete. 6 rooms per floor remaining.");
    });
  };

  const occupancyStats = useMemo(() => {
    const occupied = rooms.filter(r => r.status === 'occupied').length;
    const available = rooms.filter(r => r.status === 'available').length;
    const cleaning = rooms.filter(r => r.status === 'cleaning').length;
    
    return {
      current: occupied,
      totalToday: occupied + cleaning,
      reconciled: cleaning,
      available,
      total: rooms.length
    };
  }, [rooms]);

  const filteredRooms = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return rooms.filter(r => 
      String(r.number).includes(q) || (r.guestName || "").toLowerCase().includes(q)
    );
  }, [rooms, searchQuery]);

  // Group rooms by floor strictly for the active property
  const roomsByFloor = useMemo(() => {
    const floors: Record<number, Room[]> = {};
    
    filteredRooms.forEach(room => {
      if (room.propertyId === urlPropertyId) {
        if (!floors[room.floor]) floors[room.floor] = [];
        if (!floors[room.floor].find(r => r.id === room.id)) {
          floors[room.floor].push(room);
        }
      }
    });

    return Object.keys(floors)
      .map(Number)
      .sort((a, b) => a - b)
      .map(f => ({ floor: f, rooms: floors[f].sort((a, b) => a.number - b.number) }));
  }, [filteredRooms, urlPropertyId]);

  const updateLocal = (id: number, up: Partial<Room>) => {
    setRooms(prev => prev.map(r => r.id === id ? { ...r, ...up } : r));
    setSelectedRoom(prev => (prev?.id === id ? { ...prev, ...up } : prev));
    if (onRoomUpdate) onRoomUpdate();
  };

  const handleResetInventory = () => {
    if (!urlPropertyId) return alert("Property ID missing");
    if (!confirm("Reset inventory cluster?")) return;
    
    startTransition(async () => {
      const res = await seedRooms(urlPropertyId, 1, 9);
      if (res.success) {
        router.refresh();
      }
    });
  };

  const handleStatusChange = (s: RoomStatus) => {
    if (!selectedRoom) return;

    if (selectedRoom.status === "occupied" && s === "cleaning") {
      setShowBill(true);
    } else {
      startTransition(async () => {
        const res = await updateRoomStatus(
          urlPropertyId, 
          selectedRoom.number, 
          s
        );

        if (res.success) {
          updateLocal(selectedRoom.id, { status: s, guestName: null });
        }
      });
    }
  };

  const handleCheckIn = () => {
    if (!guestNameInput || !selectedRoom) return;

    startTransition(async () => {
      const res = await updateRoomStatus(
        urlPropertyId, 
        selectedRoom.number, 
        "occupied", 
        guestNameInput, 
        { 
          pax: paxInput, 
          idNumber: idNumberInput, 
          origin: stateOriginInput 
        } 
      );

      if (res.success) {
        updateLocal(selectedRoom.id, { 
          status: "occupied", 
          guestName: guestNameInput 
        });
        
        setGuestNameInput("");
        setPaxInput(1);
        setIdNumberInput("");
        setStateOriginInput("");
        setSelectedRoom(null);
        
        if (prefillName) {
          router.replace('/occupancy', { scroll: false });
        }
      } else {
        console.error("Check-in failed to record securely on server.");
      }
    });
  };

  const finalizeCheckout = () => {
    if (!selectedRoom?.guestName || !urlPropertyId) return;

    startTransition(async () => {
      const totalAmountCalculated = Number(roomRent) + Number(serviceFoodTotal);
      
      // 🌟 FIXED: Unified the total parameter name to prevent runtime script crashes
      const res = await processCheckout(
        urlPropertyId!,          
        selectedRoom.number, 
        selectedRoom.guestName!, 
        totalAmountCalculated,
        selectedRoom.checkInDate || null
      );

      if (res.success) {
        updateLocal(selectedRoom.id, { status: "cleaning", guestName: null });
        setShowBill(false);
        setSelectedRoom(null);
        setRoomRent(0);
        setServiceFoodTotal(0);
      } else {
        // 🌟 FIXED: Clean error resolution parameter path strings
        console.error("Checkout failed to finalize:", res.error);
        alert("Server encountered an issue documenting the checkout ledger entries.");
      }
    });
  };

  const activeProperty = properties.find(p => p.id === urlPropertyId);
  const activePropertyName = activeProperty?.name || "Select Property";

  const goToProperty = (id: string) => {
    setPropertyMenuOpen(false);
    router.push(`/occupancy?propertyId=${id}`);
  };

  if (onlySwitcher) {
    return (
      <div className="relative font-sans" ref={switcherRef}>
        <button
          type="button"
          onClick={() => setPropertyMenuOpen(o => !o)}
          aria-expanded={propertyMenuOpen}
          className="w-full sm:w-auto px-5 py-3.5 sm:py-2.5 bg-white/5 hover:bg-amber-400 hover:text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-between sm:justify-center gap-2 active:scale-[0.97] touch-manipulation"
        >
          {activePropertyName}
          <ChevronDown size={14} className={`transition-transform duration-200 ${propertyMenuOpen ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence>
          {propertyMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-full sm:w-64 max-w-[92vw] bg-[#0a0a0a] border border-white/10 rounded-2xl z-50 shadow-2xl overflow-hidden max-h-[60vh] overflow-y-auto overscroll-contain"
            >
              {properties.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => goToProperty(p.id)}
                  className="flex flex-col items-start w-full px-5 py-4 border-b border-white/5 last:border-0 hover:bg-amber-400 hover:text-slate-950 active:bg-amber-500 transition-colors text-left font-black uppercase tracking-tight text-[11px] touch-manipulation"
                >
                  {p.name}
                  <span className="text-[8px] opacity-60 font-mono">{p.id}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-transparent text-slate-100 font-sans selection:bg-amber-400 selection:text-black overflow-x-hidden">
      <div className="flex-1 p-4 sm:p-6 md:p-12 overflow-y-auto pb-40 no-scrollbar relative z-10">
        <DashboardBackground />
        
        {/* PROPERTY SWITCHER HEADER */}
      <div className="max-w-[1700px] mx-auto mb-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-white/5 border border-white/10 rounded-3xl p-4 backdrop-blur-xl shadow-2xl gap-4">
  {/* Property Info */}
  <div className="flex items-center gap-4">
    <div className="p-2.5 bg-amber-400 rounded-xl text-slate-950 shadow-md shrink-0">
      <Building2 size={20} />
    </div>
    <div>
      <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest leading-none mb-1">Active Property Scope</p>
      <h3 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-2">
        {activePropertyName} 
        <span className="text-[10px] text-amber-500/50">#{urlPropertyId.slice(0,5)}</span>
      </h3>
    </div>
  </div>

  {/* Property Switcher - Thumb Ready, tap-to-open (works on touch + mouse) */}
  <div className="relative w-full sm:w-auto" ref={switcherRef}>
    <button
      type="button"
      onClick={() => setPropertyMenuOpen(o => !o)}
      aria-expanded={propertyMenuOpen}
      className="w-full sm:w-auto px-5 py-4 sm:py-2.5 bg-white/5 hover:bg-amber-400 hover:text-slate-950 rounded-2xl sm:rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-between sm:justify-center gap-2 active:scale-[0.98] touch-manipulation"
    >
      Switch Property
      <ChevronDown size={14} className={`transition-transform duration-200 ${propertyMenuOpen ? 'rotate-180' : ''}`} />
    </button>

    {/* Dropdown - opens on tap/click, sized to stay on-screen on mobile */}
    <AnimatePresence>
      {propertyMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className="absolute right-0 mt-2 w-full sm:w-72 max-w-[92vw] bg-[#0a0a0a] border border-white/10 rounded-2xl z-50 shadow-2xl overflow-hidden"
        >
          <div className="flex flex-col max-h-[300px] overflow-y-auto overscroll-contain">
            {properties.map((property) => (
              <button
                key={property.id}
                type="button"
                onClick={() => goToProperty(property.id)}
                className="flex flex-col items-start w-full px-6 py-4 border-b border-white/5 last:border-0 hover:bg-amber-400 hover:text-slate-950 transition-colors text-left active:bg-amber-500 touch-manipulation"
              >
                <span className="text-[11px] font-black uppercase tracking-tight">{property.name}</span>
                <span className="text-[9px] opacity-60 font-mono mt-0.5">{property.id}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => { setPropertyMenuOpen(false); router.push('/management'); }}
              className="w-full px-5 py-4 text-[10px] font-black text-amber-400 hover:bg-white/5 text-center border-t border-white/10 tracking-widest uppercase active:bg-white/10 touch-manipulation"
            >
              + MANAGE PROPERTIES
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
</div>

      <header className="max-w-[1700px] mx-auto mb-8 md:mb-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
  {/* Left Section: Title & Status */}
  <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
    <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-white uppercase italic leading-[0.8]">
      Inventory.
    </h1>
    <div className="flex items-center gap-3 mt-4">
      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
      <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.3em] md:tracking-[0.5em]">
        Active Operation Cluster
      </p>
    </div>
  </div>

  {/* Right Section: Controls & Search */}
  <div className="flex flex-col items-center lg:items-end gap-4 w-full lg:w-auto">
    <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
      <button 
        onClick={handleResetInventory}
        disabled={isPending}
        className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-3 sm:py-2 bg-white/5 border border-white/10 rounded-xl text-[8px] font-black uppercase tracking-widest text-slate-400 hover:text-amber-400 hover:border-amber-400/30 transition-all active:scale-95 touch-manipulation"
      >
        {isPending ? <Loader2 size={12} className="animate-spin text-amber-400" /> : <Database size={12} />}
        Reset Registry
      </button>
      <Link 
        href={`/`} 
        className="flex-1 sm:flex-initial text-center text-slate-500 text-[9px] font-black uppercase tracking-[0.3em] sm:tracking-[0.5em] hover:text-rose-500 transition-colors py-3 sm:py-0 touch-manipulation" 
        scroll={false}
      >
        Return
      </Link>
    </div>
    
    {/* Search Bar - Responsive Width, 16px base font prevents iOS auto-zoom on focus */}
    <div className="relative w-full max-w-sm lg:max-w-md">
      <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
      <input 
        type="text" 
        placeholder="Search Unit / Guest Name..." 
        value={searchQuery} 
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3.5 md:py-4 pl-12 pr-6 outline-none focus:border-amber-400/50 text-base sm:text-[10px] font-black uppercase text-white transition-all backdrop-blur-xl placeholder:text-slate-700" 
      />
    </div>
  </div>
</header>

        <div className="max-w-[1700px] mx-auto mb-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 🌟 FIXED: Passed numeric fields wrapped inside String casts to satisfy layout contracts */}
            <StatBox label="Live Occupancy" value={String(occupancyStats.current)} icon={BedDouble} color="text-amber-400" />
            <StatBox label="Daily Bookings" value={String(occupancyStats.totalToday)} icon={CalendarCheck} color="text-emerald-500" />
            <StatBox label="In Cleaning" value={String(occupancyStats.reconciled)} icon={CheckCircle2} color="text-blue-500" />
            <StatBox label="Ready Units" value={String(occupancyStats.available)} icon={DoorOpen} color="text-slate-400" />
          </div>
        </div>

        <div className="max-w-[1700px] mx-auto space-y-24 pb-20">
          {roomsByFloor.map(({ floor, rooms: floorRooms }) => (
            <div key={`floor-${floor}-ctx-${urlPropertyId}`} className="relative">
              <div className="flex items-center gap-6 mb-10 sticky top-4 z-20 px-6 py-4 rounded-3xl border border-white/5 shadow-2xl backdrop-blur-md bg-slate-950/40">
                <span className="text-white/20 font-black text-6xl uppercase tracking-tighter italic leading-none">P0{floor}</span>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Property Floor</span>
                  <div className="h-[2px] w-32 bg-gradient-to-r from-amber-500 to-transparent mt-1" />
                </div>
                <div className="h-[1px] flex-1 bg-white/5 mx-4" />
                <span className="text-[10px] text-white/40 font-black uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full border border-white/5">
                  {floorRooms.length} Active Rooms
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9 gap-3">
                {floorRooms.map(room => {
                  // 🌟 FIXED: Unified deterministic key arrays to shield DOM states
                  const safeTileKey = `room-tile-id-${room.id}-prop-${urlPropertyId}`;
                  
                  return (
                    <RoomTile 
                      key={safeTileKey} 
                      room={room} 
                      isSelected={selectedRoom?.id === room.id}
                      isLeadActive={!!prefillName && room.status === 'available'}
                      onClick={() => { setSelectedRoom(room); setShowBill(false); }} 
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedRoom && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedRoom(null)} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[90]" />
            <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed right-0 top-0 h-full w-full max-w-md bg-[#02040a]/90 backdrop-blur-[50px] border-l border-white/10 z-[100] p-6 sm:p-10 flex flex-col shadow-[-20px_0_100px_rgba(0,0,0,0.9)] overflow-y-auto overscroll-contain no-scrollbar">
              
              <div className="flex justify-between items-center mb-10 sm:mb-16">
                <div className="px-6 py-3 bg-white/5 rounded-3xl border border-white/10 bg-white/[0.02]">
                  <span className="text-amber-400 font-black text-2xl tracking-tighter italic uppercase">Room {selectedRoom.number}</span>
                </div>
                <button onClick={() => setSelectedRoom(null)} className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-rose-500/20 hover:text-rose-500 rounded-2xl transition-all text-slate-500 border border-white/5 active:scale-95 touch-manipulation"><X size={20}/></button>
              </div>

              <div className="flex-1">
                {!showBill ? (
                  <div className="space-y-10 sm:space-y-12">
                    <section>
                      <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 mb-6 block underline decoration-amber-500/50 underline-offset-8">Status Update</label>
                      <div className="grid grid-cols-2 gap-4">
                        {(["available", "occupied", "cleaning", "maintenance"] as RoomStatus[]).map((s) => (
                          <button 
                            key={s} 
                            disabled={isPending || (s === 'occupied' && !selectedRoom.guestName && !guestNameInput)} 
                            onClick={() => handleStatusChange(s)} 
                            className={`py-5 rounded-3xl text-[10px] font-black uppercase tracking-widest border transition-all active:scale-95 touch-manipulation disabled:opacity-40 disabled:active:scale-100 ${selectedRoom.status === s ? 'bg-amber-400 border-amber-400 text-slate-950 shadow-2xl shadow-amber-400/20' : 'bg-white/5 border-white/10 text-slate-500 hover:border-white/30'}`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </section>

                    {selectedRoom.status === "available" && (
                      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className={`p-6 sm:p-8 rounded-[3rem] border-2 transition-all ${prefillName ? 'bg-amber-400/10 border-amber-400/40 ring-4 ring-amber-400/5' : 'bg-white/[0.02] border-white/5'}`}>
                        <div className="flex justify-between items-start mb-8">
                            <div className="space-y-1">
                                <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 ${prefillName ? 'text-amber-400' : 'text-slate-500'}`}>
                                  {prefillName ? <Zap size={14} className="animate-pulse" /> : <UserPlus size={14} />} 
                                  Check-in Registry
                                </h3>
                                <p className="text-[9px] font-bold text-slate-600 uppercase">Confirm Arrival</p>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="relative">
                              <UserPlus className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                              <input className="w-full bg-black/60 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-base sm:text-sm text-white outline-none focus:border-amber-400 transition-all font-black uppercase italic placeholder:text-slate-700" placeholder="Guest Full Name" value={guestNameInput} onChange={(e) => setGuestNameInput(e.target.value)} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="relative">
                                  <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                                  <input type="date" className="w-full bg-black/60 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-base sm:text-[10px] text-white outline-none focus:border-amber-400 font-black uppercase" value={checkInDate} onChange={(e) => setCheckInDate(e.target.value)} />
                              </div>
                              <div className="relative">
                                  <Users className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                                  <input type="number" placeholder="Pax" className="w-full bg-black/60 border border-white/10 rounded-2xl py-5 p-4 pl-14 text-base sm:text-[10px] text-white outline-none focus:border-amber-400 font-black uppercase placeholder:text-slate-700" value={paxInput} onChange={(e) => setPaxInput(Number(e.target.value))} />
                              </div>
                            </div>

                            <div className="relative">
                              <Fingerprint className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                              <input className="w-full bg-black/60 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-base sm:text-xs text-white outline-none focus:border-amber-400 transition-all font-black uppercase placeholder:text-slate-700" placeholder="ID Number" value={idNumberInput} onChange={(e) => setIdNumberInput(e.target.value)} />
                            </div>

                            <div className="relative">
                              <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                              <input className="w-full bg-black/60 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-base sm:text-xs text-white outline-none focus:border-amber-400 transition-all font-black uppercase placeholder:text-slate-700" placeholder="State / Origin" value={stateOriginInput} onChange={(e) => setStateOriginInput(e.target.value)} />
                            </div>

                            <button onClick={handleCheckIn} disabled={isPending || !guestNameInput} className="w-full bg-amber-400 text-slate-950 font-black py-6 rounded-3xl flex items-center justify-center gap-3 uppercase text-xs tracking-widest shadow-2xl shadow-amber-400/30 active:scale-95 transition-all cursor-pointer touch-manipulation disabled:opacity-50 disabled:active:scale-100">
                                {isPending ? <Loader2 size={20} className="animate-spin text-slate-950" /> : <> <Check size={20} strokeWidth={3} /> Finalize Entry</>}
                            </button>
                        </div>
                      </motion.div>
                    )}

                    {selectedRoom.guestName && selectedRoom.status === 'occupied' && (
                      <div className="bg-white/5 p-6 sm:p-8 rounded-[3rem] border border-white/10 relative overflow-hidden bg-white/[0.01]">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles size={40} /></div>
                        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-400 mb-3 block italic">Occupant</label>
                        <p className="text-3xl font-black text-white italic tracking-tighter mb-10 leading-tight uppercase truncate">{selectedRoom.guestName}</p>
                        <button onClick={() => setShowBill(true)} className="w-full bg-white text-slate-950 py-6 rounded-3xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-amber-400 transition-all active:scale-95 flex items-center justify-center gap-3 cursor-pointer touch-manipulation">
                            <TrendingUp size={18} /> Checkout & Settle
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                    <div className="bg-white/5 p-6 sm:p-10 rounded-[3.5rem] border border-white/10 space-y-10 bg-white/[0.01]">
                      <div className="flex items-center gap-3 text-amber-400">
                          <Receipt size={18}/> 
                          <h4 className="font-black uppercase tracking-[0.3em] text-[10px]">Financial Summary</h4>
                      </div>
                      <div className="space-y-6">
                        <SideInput label="Daily Rent" value={roomRent} onChange={setRoomRent} />
                        <SideInput label="Add-ons / Food" value={serviceFoodTotal} onChange={setServiceFoodTotal} />
                        <div className="pt-10 border-t border-white/10 flex justify-between items-end">
                          <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Total Bill</span>
                          <span className="text-4xl sm:text-5xl font-black italic text-white tracking-tighter">₹{(roomRent || 0) + (serviceFoodTotal || 0)}</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={finalizeCheckout} disabled={isPending} className="w-full bg-amber-400 text-slate-950 font-black py-7 rounded-[2.5rem] uppercase text-xs tracking-[0.3em] shadow-2xl shadow-amber-400/30 active:scale-95 transition-all cursor-pointer touch-manipulation disabled:opacity-50 disabled:active:scale-100">
                      {isPending ? "Updating Database..." : "Authorize Settle"}
                    </button>
                    <button onClick={() => setShowBill(false)} className="w-full text-slate-600 font-black text-[10px] uppercase flex items-center justify-center gap-3 hover:text-white transition-colors cursor-pointer touch-manipulation py-2"><ArrowLeft size={14} /> Back to Room</button>
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

// --- SUB-COMPONENTS ---

function RoomTile({ room, onClick, isLeadActive, isSelected }: any) {
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
        aspect-square w-full overflow-hidden touch-manipulation
        ${isSelected ? 'ring-2 ring-amber-400 bg-amber-400/5' : 'border border-white/5'}
        ${isLeadActive ? 'ring-2 ring-emerald-400 ring-offset-4 ring-offset-[#02040a]' : ''}
      `}
    >
      <div className="flex justify-between items-start w-full">
        <div className="flex flex-col">
          <h3 className="text-4xl font-black tracking-tighter italic leading-none text-white">{room.number}</h3>
          <div className="items-center gap-1.5 mt-1 hidden sm:flex">
             <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${currentStyle.bg.replace('/10', '')}`} />
             <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${currentStyle.color}`}>{s}</span>
          </div>
        </div>
        <Icon size={18} className={`${currentStyle.color} opacity-30`} />
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

function SideInput({ label, value, onChange }: any) {
  return (
    <div className="relative">
      <input type="number" min="0" value={value || ""} onChange={(e) => onChange(Number(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded-2xl py-6 px-6 text-lg font-black text-white outline-none focus:border-amber-400 transition-all italic" />
      <label className="absolute -top-3 left-6 bg-[#01040f] px-3 text-[9px] font-black uppercase text-slate-600 tracking-[0.2em]">{label}</label>
    </div>
  );
}

function StatBox({ label, value, icon: Icon, color }: any) {
  return (
    <div className="bg-white/[0.03] border border-white/5 backdrop-blur-md p-6 sm:p-10 rounded-[3rem] relative overflow-hidden group text-center lg:text-left">
      <div className={`absolute -right-4 -bottom-4 opacity-[0.03] ${color} group-hover:scale-125 transition-transform duration-700`}><Icon size={120} /></div>
      <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-600 mb-2">{label}</p>
      <h4 className={`text-4xl sm:text-5xl font-black italic tracking-tighter ${color}`}>{value}</h4>
    </div>
  );
}