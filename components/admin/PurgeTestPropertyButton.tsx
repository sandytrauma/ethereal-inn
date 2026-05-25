"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import { purgePropertyEntirely } from "@/lib/actions/saas-actions";
import { Loader2, Trash2 } from "lucide-react";

interface PurgeButtonProps {
  propertyId: string;
}

export default function PurgeTestPropertyButton({ propertyId }: PurgeButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handlePurge = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!confirm("Are you sure you want to drop this property and wipe out all its rooms? This resets the tenant's property count to 0.")) {
      return;
    }

    startTransition(async () => {
      const res = await purgePropertyEntirely(propertyId);
      
      if (res.success) {
        // 🌟 THE FIX: Re-hydrate the active data grid cleanly via server-driven DOM morphing 
        // instead of triggering a harsh browser refresh flash!
        router.refresh(); 
      } else {
        alert("Wipe rejected: " + (res.error || "Unknown Error"));
      }
    });
  };

  return (
    <button
      onClick={handlePurge}
      disabled={isPending}
      className="px-4 py-3 bg-red-600 hover:bg-red-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 shadow-xl active:scale-[0.98] cursor-pointer select-none"
    >
      {isPending ? (
        <Loader2 className="animate-spin text-white" size={14} />
      ) : (
        <>
          <Trash2 size={14} />
          Purge Property Layout
        </>
      )}
    </button>
  );
}