"use client";

import { useRouter } from "next/navigation";
import { Building2, ChevronDown, MapPin } from "lucide-react";

export default function PropertySwitcher({ currentId, allProperties }: any) {
  const router = useRouter();
  const active = allProperties.find((p: any) => p.id === currentId);

  return (
    <div className="relative group">
      <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-6 py-3 rounded-2xl cursor-pointer hover:border-amber-500/50 transition-all backdrop-blur-xl">
        <div className="p-2 bg-amber-500/10 rounded-lg">
          <Building2 size={18} className="text-amber-500" />
        </div>
        <div>
          <p className="text-[8px] font-black uppercase text-slate-500 tracking-[0.2em]">Active Property</p>
          <p className="text-sm font-black text-white italic uppercase">{active?.name || "Select Property"}</p>
        </div>
        <ChevronDown size={14} className="ml-4 text-slate-600 group-hover:rotate-180 transition-transform" />
      </div>
      
      <div className="absolute top-full right-0 w-64 mt-2 bg-[#0a0c14] border border-white/10 rounded-2xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all z-50 overflow-hidden shadow-2xl">
        <div className="p-3 border-b border-white/5">
          <p className="text-[9px] font-black text-slate-600 uppercase px-3">Available Properties</p>
        </div>
        {allProperties.map((p: any) => (
          <div 
            key={p.id}
            onClick={() => router.push(`/pms/${p.id}`)}
            className={`px-6 py-4 flex items-center justify-between hover:bg-amber-400 hover:text-slate-950 transition-all cursor-pointer ${p.id === currentId ? 'bg-white/5' : ''}`}
          >
            <div>
              <p className="text-xs font-black uppercase italic">{p.name}</p>
              <div className="flex items-center gap-1 mt-1 opacity-60">
                <MapPin size={8} />
                <p className="text-[8px] font-bold uppercase">{p.city}</p>
              </div>
            </div>
            {p.id === currentId && <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
          </div>
        ))}
      </div>
    </div>
  );
}