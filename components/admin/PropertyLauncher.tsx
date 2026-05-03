"use client";

import React, { useState, useTransition } from "react";
import { Loader2, Plus, Building2, MapPin, Grid3X3, Layers } from "lucide-react";
import { useRouter } from "next/navigation";
// Ensure this path matches where you saved the server action
import { initializeNewProperty } from "@/lib/actions/property-actions"; 

export default function PropertyLauncher() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Dynamic State
  const [formData, setFormData] = useState({
    name: "",
    location: "Delhi", // We will map this to 'city' in the handleLaunch
    floors: 1,
    roomsPerFloor: 9,
  });

  const handleLaunch = () => {
    if (!formData.name) return alert("Please enter a Property Name");

    startTransition(async () => {
      // 1. We map 'location' to 'city' here to match the server action type
      // 2. We include your managerEmail as required by the schema
      const res = await initializeNewProperty({
        name: formData.name,
        city: formData.location, 
        managerEmail: "sksandeep443@gmail.com", 
        floors: formData.floors,
        roomsPerFloor: formData.roomsPerFloor,
      });

      if (res.success) {
        // 'propertyId' is now safely accessible because res.success is true
        router.push(`/occupancy?propertyId=${res.propertyId}`);
      } else {
        // 'error' is now safely accessible because res.success is false
        alert("Launch failed: " + res.error);
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-10 bg-slate-900/50 backdrop-blur-xl rounded-[3.5rem] border border-white/10 shadow-2xl transition-all hover:border-amber-400/30">
      <div className="flex items-center gap-4 mb-10">
        <div className="p-4 bg-amber-400/10 rounded-2xl text-amber-400">
          <Building2 size={32} />
        </div>
        <div>
          <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase leading-none">Launch Property.</h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Assign ID & Generate Inventory</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Property Name */}
        <div className="relative">
          <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest ml-4 mb-2 block">Site Identification</label>
          <div className="relative">
            <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400/50" size={18} />
            <input 
              className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white outline-none focus:border-amber-400 font-black uppercase italic transition-all placeholder:text-slate-700"
              placeholder="e.g. Matiala Dwarka"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
        </div>

        {/* Location & Scale */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Region/City */}
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest ml-4 block">Region</label>
            <div className="relative">
              <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400/50" size={16} />
              <input 
                className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-xs text-white font-bold outline-none focus:border-amber-400 transition-all"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
          </div>

          {/* Floors */}
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest ml-4 block">Floors</label>
            <div className="relative">
              <Layers className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400/50" size={16} />
              <input 
                type="number"
                min="1"
                className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-xs text-white font-bold outline-none focus:border-amber-400 transition-all"
                value={formData.floors}
                onChange={(e) => setFormData({ ...formData, floors: Math.max(1, Number(e.target.value)) })}
              />
            </div>
          </div>

          {/* Rooms Per Floor */}
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest ml-4 block">Rooms/Floor</label>
            <div className="relative">
              <Grid3X3 className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400/50" size={16} />
              <input 
                type="number"
                min="1"
                className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-xs text-white font-bold outline-none focus:border-amber-400 transition-all"
                value={formData.roomsPerFloor}
                onChange={(e) => setFormData({ ...formData, roomsPerFloor: Math.max(1, Number(e.target.value)) })}
              />
            </div>
          </div>
        </div>

        <button 
          onClick={handleLaunch}
          disabled={isPending || !formData.name}
          className="w-full mt-6 bg-amber-400 hover:bg-amber-300 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black py-6 rounded-3xl flex items-center justify-center gap-3 uppercase text-xs tracking-[0.3em] shadow-2xl shadow-amber-400/20 active:scale-95 transition-all group"
        >
          {isPending ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <>
              <Plus size={20} strokeWidth={3} className="group-hover:rotate-90 transition-transform" /> 
              Initialize Property Cluster
            </>
          )}
        </button>
      </div>
    </div>
  );
}