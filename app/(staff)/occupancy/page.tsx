import { getRoomsList } from "@/lib/actions/room-actions";
import RoomOccupancyClient from "./RoomOccupancyClient";
import SeedButton from "./SeedButton";

export default async function OccupancyPage() {
  // Fetch initial rooms from the database
  const initialRooms = await getRoomsList();

  // If no rooms exist, show the high-fidelity "Seed" state
  if (!initialRooms || initialRooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] bg-[#020617] p-8 text-center">
        <div className="relative mb-10">
          {/* Decorative glow effect */}
          <div className="absolute -inset-10 bg-amber-400/5 blur-[50px] rounded-full" />
          
          <div className="relative space-y-3">
            <h2 className="text-white text-5xl font-black tracking-tighter italic uppercase leading-none">
              Inventory <span className="text-amber-400">Empty</span>
            </h2>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">
              Generate your 15-unit grid to initiate operations
            </p>
          </div>
        </div>
        
        {/* The Client Component button handles the server action trigger */}
        <div className="relative z-10">
          <SeedButton />
        </div>

        <p className="mt-8 text-[9px] text-slate-700 font-bold uppercase tracking-widest italic">
          System ready for initialization
        </p>
      </div>
    );
  }

  // If rooms exist, render the interactive client grid
  return (
    <div className="min-h-screen bg-[#020617] p-4">
       <RoomOccupancyClient initialRooms={initialRooms} />
    </div>
  );
}