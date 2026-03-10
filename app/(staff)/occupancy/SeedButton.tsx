"use client";

import { seedRooms } from "@/lib/actions/room-actions";
import { useState } from "react";
import { Loader2, PlusCircle } from "lucide-react";

export default function SeedButton() {
  const [loading, setLoading] = useState(false);

  const handleSeed = async () => {
    setLoading(true);
    await seedRooms();
    // No need to refresh, revalidatePath handles it!
    setLoading(false);
  };

  return (
    <button 
      onClick={handleSeed}
      disabled={loading}
      className="bg-amber-400 text-slate-950 px-8 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center gap-2 hover:bg-amber-300 transition-colors"
    >
      {loading ? <Loader2 className="animate-spin" /> : <PlusCircle size={20} />}
      Initialize Ethereal Inn
    </button>
  );
}