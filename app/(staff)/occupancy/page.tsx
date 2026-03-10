import { getRoomsList } from "@/lib/actions/room-actions";
import RoomOccupancyClient from "./RoomOccupancyClient";
import SeedButton from "./SeedButton"; // Import the new component

export default async function OccupancyPage() {
  const initialRooms = await getRoomsList();

  if (initialRooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#020617] p-8 text-center">
        <div className="mb-8 space-y-2">
          <h2 className="text-white text-4xl font-black tracking-tighter italic uppercase">Inventory Empty.</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em]">Generate your 15-unit grid to begin.</p>
        </div>
        
        {/* Use the Client Component button here */}
        <SeedButton />
      </div>
    );
  }

  return <RoomOccupancyClient initialRooms={initialRooms} />;
}