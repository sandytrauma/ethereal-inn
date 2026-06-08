"use client";

import React, { useState, useTransition } from "react";
import { adjustStockLevel } from "@/lib/actions/salon-inventory";
import { useRouter } from "next/navigation";
import { AlertCircle, RotateCcw, Scale } from "lucide-react";

export default function StockAdjustmentModal({
  product,
  onClose,
}: {
  product: any;
  onClose: () => void;
}) {
  const [volumeDelta, setVolumeDelta] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // 🌟 FIX: Integrate transition tracking hooks to handle the data refresh cleanly
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const newVolume = Math.max(0, product.currentVolumeMlGrams + volumeDelta);

  const handleAdjust = async () => {
    if (volumeDelta === 0) {
      setError("Please enter a valid adjustment volume change.");
      return;
    }

    // 🌟 FIX: Safety validation to prevent custom input typing from forcing negative stock levels
    if (product.currentVolumeMlGrams + volumeDelta < 0) {
      setError(`Adjustment exceeds available inventory. Stock cannot fall below 0 ml/g (Minimum allowable adjustment is -${product.currentVolumeMlGrams}ml).`);
      return;
    }

    setError(null);

    startTransition(async () => {
      const result = await adjustStockLevel(product.id, volumeDelta);

      if (result.success) {
        // 🌟 FORCE LOCK: Wait for the underlying server components to re-render completely before closing
        router.refresh();
        onClose();
      } else {
        setError(result.error || "Failed to update inventory stock adjustments.");
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl w-full max-w-md relative overflow-hidden text-slate-200">
        
        {/* Sync Status Overlay Indicator */}
        {isPending && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-pink-400 select-none animate-pulse">
              <span className="h-2 w-2 rounded-full bg-pink-500 animate-ping" />
              Recalculating Dynamic Shelf Stocks...
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-pink-950/40 border border-pink-800/30 text-pink-400 rounded-xl shrink-0">
            <Scale size={18} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-200 truncate max-w-[280px]">{product.productName}</h2>
            <p className="text-xs text-slate-500 mt-0.5">Adjust physical backbar inventory counts</p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs font-medium flex items-start gap-2 leading-relaxed">
            <AlertCircle size={14} className="shrink-0 text-red-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-5">
          {/* Audit Metrics Card Display Panel */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-3 font-medium">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Current Shelf Volume:</span>
              <span className="font-mono text-slate-300">{product.currentVolumeMlGrams} ml / g</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Applied Drift Delta:</span>
              <span className={`font-mono font-bold ${volumeDelta > 0 ? "text-emerald-400" : volumeDelta < 0 ? "text-red-400" : "text-slate-500"}`}>
                {volumeDelta > 0 ? "+" : ""}{volumeDelta} ml / g
              </span>
            </div>
            <div className="pt-3 border-t border-slate-800/60 flex justify-between items-center">
              <span className="text-xs text-slate-400">Calculated Final Target:</span>
              <span className="font-mono font-black text-sm text-pink-400 bg-pink-950/10 border border-pink-900/30 px-2 py-0.5 rounded-md">
                {newVolume} ml / g
              </span>
            </div>
          </div>

          {/* Quick Click Increment Grid Toolbar */}
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2.5">
              Quick Volume Add/Subtract Steps
            </label>
            <div className="flex gap-1.5 justify-between">
              <button
                type="button"
                onClick={() => setVolumeDelta(Math.max(volumeDelta - 50, -product.currentVolumeMlGrams))}
                disabled={isPending}
                className="flex-1 py-1.5 rounded-lg bg-red-950/20 hover:bg-red-900/40 text-red-400 text-xs font-bold border border-red-900/30 transition cursor-pointer"
              >
                -50
              </button>
              <button
                type="button"
                onClick={() => setVolumeDelta(Math.max(volumeDelta - 10, -product.currentVolumeMlGrams))}
                disabled={isPending}
                className="flex-1 py-1.5 rounded-lg bg-red-950/10 hover:bg-red-900/30 text-red-400 text-xs font-bold border border-red-900/20 transition cursor-pointer"
              >
                -10
              </button>
              <button
                type="button"
                onClick={() => setVolumeDelta(0)}
                disabled={isPending}
                className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center justify-center cursor-pointer"
              >
                <RotateCcw size={12} />
              </button>
              <button
                type="button"
                onClick={() => setVolumeDelta(volumeDelta + 10)}
                disabled={isPending}
                className="flex-1 py-1.5 rounded-lg bg-emerald-950/10 hover:bg-emerald-900/30 text-emerald-400 text-xs font-bold border border-emerald-900/20 transition cursor-pointer"
              >
                +10
              </button>
              <button
                type="button"
                onClick={() => setVolumeDelta(volumeDelta + 50)}
                disabled={isPending}
                className="flex-1 py-1.5 rounded-lg bg-emerald-950/20 hover:bg-emerald-900/40 text-emerald-400 text-xs font-bold border border-emerald-900/30 transition cursor-pointer"
              >
                +50
              </button>
            </div>
          </div>

          {/* Explicit Multi-Value Input Node Box */}
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">
              Or Key In Explicit Adjustment Figure
            </label>
            <input
              type="number"
              value={volumeDelta || ""}
              onChange={(e) => setVolumeDelta(parseInt(e.target.value) || 0)}
              placeholder="Enter numerical delta (e.g. -250 or 500)"
              disabled={isPending}
              className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-pink-500/50 transition text-xs font-mono font-bold disabled:opacity-50"
            />
          </div>

          {/* Operational Confirm buttons */}
          <div className="flex gap-3 pt-2 border-t border-slate-800/60">
            <button
              type="button"
              onClick={handleAdjust}
              disabled={isPending || volumeDelta === 0}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-400 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-pink-950/20 transition transform active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              {isPending ? "Adjusting..." : "Confirm Adjustment"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider transition disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}