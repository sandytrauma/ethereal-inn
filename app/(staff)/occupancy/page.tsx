import { getRoomsList } from "@/lib/actions/room-actions";
import RoomOccupancyClient from "./RoomOccupancyClient";
import SeedButton from "./SeedButton"; 

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function OccupancyPage({ searchParams }: PageProps) {
const resolvedParams = await searchParams;
const propertyId = typeof resolvedParams.propertyId === 'string' ? resolvedParams.propertyId : "";
  
  const rawPrefill = resolvedParams.prefillGuest;
  const prefill = (rawPrefill && rawPrefill !== "undefined") ? String(rawPrefill) : null;

  // 2. Fetch initial rooms
  const initialRooms = await getRoomsList();

  // 3. Render Empty/Seed state if no rooms exist
  if (!initialRooms || initialRooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#020617] p-8 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-400/5 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20 pointer-events-none" />
        
        <div className="relative mb-12">
          <div className="relative space-y-6">
            <div className="flex flex-col items-center">
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-amber-500 text-[10px] font-black uppercase tracking-[0.6em]">
                        System Status: Offline
                    </span>
                </div>
                
                <h2 className="text-white text-6xl md:text-9xl font-black tracking-tighter italic uppercase leading-[0.75] mb-2">
                  Inventory <br />
                  <span className="text-amber-400">Zero</span>
                </h2>
            </div>
            
            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-[0.3em] max-w-md mx-auto leading-relaxed mt-4">
              The operational grid is currently unpopulated. <br />
              <span className="text-slate-700">Define your property scale below to initialize the cluster.</span>
            </p>
          </div>
        </div>
        
        {/* Pass propertyId to the SeedButton to satisfy the 3-argument requirement */}
        <div className="relative z-10 scale-100 hover:scale-[1.02] transition-all duration-700 ease-out">
  {/* This will now be valid because SeedButton accepts propertyId */}
  <SeedButton propertyId={propertyId} />
</div>

        <div className="mt-20 flex items-center gap-8 text-[10px] text-slate-800 font-black uppercase tracking-[0.5em] opacity-40">
            <div className="h-[1px] w-16 bg-slate-900" />
            Ethereal Inn Core v1.0.4
            <div className="h-[1px] w-16 bg-slate-900" />
        </div>
      </div>
    );
  }

  // 4. Render the Client Grid
  return (
    <div className="min-h-screen bg-[#020617] selection:bg-amber-400/30">
       <RoomOccupancyClient 
          initialRooms={initialRooms} 
          prefillName={prefill} 
       />
    </div>
  );
}