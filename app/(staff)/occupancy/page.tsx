import { getRoomsList } from "@/lib/actions/room-actions";
import RoomOccupancyClient from "./RoomOccupancyClient";
import SeedButton from "./SeedButton";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function OccupancyPage({ searchParams }: PageProps) {
  // 1. Resolve searchParams and sanitize the prefillGuest
  const resolvedParams = await searchParams;
  const rawPrefill = resolvedParams.prefillGuest;
  
  // Guard against "undefined" strings or nulls
  const prefill = (rawPrefill && rawPrefill !== "undefined") ? String(rawPrefill) : null;

  // 2. Fetch initial rooms from Neon/Drizzle
  const initialRooms = await getRoomsList();

  // 3. Render Empty/Seed state if no rooms exist
  if (!initialRooms || initialRooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[90vh] bg-[#020617] p-8 text-center overflow-hidden">
        <div className="relative mb-12">
          <div className="absolute -inset-20 bg-amber-400/5 blur-[80px] rounded-full animate-pulse" />
          <div className="relative space-y-4">
            <h2 className="text-white text-6xl md:text-8xl font-black tracking-tighter italic uppercase leading-none">
              Inventory <span className="text-amber-400">Empty</span>
            </h2>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em]">
              Generate your operational grid to begin tracking
            </p>
          </div>
        </div>
        
        <div className="relative z-10 scale-110">
          <SeedButton />
        </div>

        <div className="mt-12 flex items-center gap-4 text-[9px] text-slate-700 font-bold uppercase tracking-widest">
            <div className="h-[1px] w-8 bg-slate-800" />
            System Ready for Initialization
            <div className="h-[1px] w-8 bg-slate-800" />
        </div>
      </div>
    );
  }

  // 4. Render the Client Grid
  return (
    <div className="min-h-screen bg-[#020617]">
       <RoomOccupancyClient initialRooms={initialRooms} />
    </div>
  );
}