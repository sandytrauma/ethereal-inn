"use client";

import { seedRooms } from "@/lib/actions/room-actions";
import { useState } from "react";
import { Loader2, LayoutGrid } from "lucide-react";
import { toast } from "sonner";

// We define the component name clearly here
export default function SeedButton() {
  const [loading, setLoading] = useState(false);
  const [floors, setFloors] = useState(1);
  const [roomsPerFloor, setRoomsPerFloor] = useState(9);

  const handleSeed = async () => {
    setLoading(true);
    try {
      await seedRooms(floors, roomsPerFloor);
      toast.success("Infrastructure Initialized");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 bg-white/5 p-8 rounded-[3rem] border border-white/10 backdrop-blur-xl">
      <div className="flex gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Floors</label>
          <input 
            type="number" value={floors} onChange={(e) => setFloors(Number(e.target.value))}
            className="w-24 bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white font-black outline-none focus:border-amber-400"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Units / Floor</label>
          <input 
            type="number" value={roomsPerFloor} onChange={(e) => setRoomsPerFloor(Number(e.target.value))}
            className="w-24 bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white font-black outline-none focus:border-amber-400"
          />
        </div>
      </div>

      <button 
        onClick={handleSeed}
        disabled={loading}
        className="group bg-amber-400 text-slate-950 px-10 py-5 rounded-2xl font-black uppercase tracking-widest flex items-center gap-3 hover:bg-amber-300 transition-all active:scale-95"
      >
        {loading ? <Loader2 className="animate-spin" /> : <LayoutGrid size={20} />}
        Initialize Infrastructure
      </button>
    </div>
  );
}