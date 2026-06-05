"use client";

import React, { useState } from "react";
import { adjustStockLevel } from "@/lib/actions/salon-inventory";
import { useRouter } from "next/navigation";

export default function StockAdjustmentModal({
  product,
  onClose,
}: {
  product: any;
  onClose: () => void;
}) {
  const [volumeDelta, setVolumeDelta] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const newVolume = Math.max(0, product.currentVolumeMlGrams + volumeDelta);

  const handleAdjust = async () => {
    if (volumeDelta === 0) {
      setError("Please enter an adjustment amount");
      return;
    }

    setError(null);
    setIsLoading(true);

    const result = await adjustStockLevel(product.id, volumeDelta);

    if (result.success) {
      router.refresh();
      onClose();
    } else {
      setError(result.error || "Failed to adjust stock");
    }

    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl w-full max-w-md">
        <h2 className="text-xl font-bold text-slate-200 mb-2">{product.productName}</h2>
        <p className="text-xs text-slate-400 mb-6">Adjust stock level</p>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs font-medium">
            ⚠️ {error}
          </div>
        )}

        <div className="space-y-6">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Current Volume:</span>
              <span className="font-mono font-bold text-slate-200">{product.currentVolumeMlGrams} ml</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Adjustment:</span>
              <span className={`font-mono font-bold ${volumeDelta > 0 ? "text-emerald-400" : volumeDelta < 0 ? "text-red-400" : "text-slate-500"}`}>
                {volumeDelta > 0 ? "+" : ""}{volumeDelta} ml
              </span>
            </div>
            <div className="pt-3 border-t border-slate-800/50 flex justify-between">
              <span className="text-xs text-slate-400">New Volume:</span>
              <span className="font-mono font-bold text-pink-400">{newVolume} ml</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Volume Adjustment
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setVolumeDelta(Math.max(volumeDelta - 50, -product.currentVolumeMlGrams))}
                disabled={isLoading}
                className="flex-1 py-2 px-3 rounded-lg bg-red-950/30 hover:bg-red-900/50 text-red-400 font-bold text-sm border border-red-800/40 transition"
              >
                -50ml
              </button>
              <button
                onClick={() => setVolumeDelta(Math.max(volumeDelta - 10, -product.currentVolumeMlGrams))}
                disabled={isLoading}
                className="flex-1 py-2 px-3 rounded-lg bg-red-950/20 hover:bg-red-900/30 text-red-400 font-bold text-sm border border-red-800/30 transition"
              >
                -10ml
              </button>
              <button
                onClick={() => setVolumeDelta(0)}
                disabled={isLoading}
                className="flex-1 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition"
              >
                Reset
              </button>
              <button
                onClick={() => setVolumeDelta(volumeDelta + 10)}
                disabled={isLoading}
                className="flex-1 py-2 px-3 rounded-lg bg-emerald-950/20 hover:bg-emerald-900/30 text-emerald-400 font-bold text-sm border border-emerald-800/30 transition"
              >
                +10ml
              </button>
              <button
                onClick={() => setVolumeDelta(volumeDelta + 50)}
                disabled={isLoading}
                className="flex-1 py-2 px-3 rounded-lg bg-emerald-950/30 hover:bg-emerald-900/50 text-emerald-400 font-bold text-sm border border-emerald-800/40 transition"
              >
                +50ml
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Or Enter Custom Amount
            </label>
            <input
              type="number"
              value={volumeDelta}
              onChange={(e) => setVolumeDelta(parseInt(e.target.value) || 0)}
              placeholder="Enter amount (positive or negative)"
              disabled={isLoading}
              className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-pink-500/80 focus:ring-1 focus:ring-pink-500/30 transition text-sm disabled:opacity-50"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleAdjust}
              disabled={isLoading || volumeDelta === 0}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-400 text-white font-bold text-sm tracking-wide shadow-lg shadow-pink-950/20 transition transform active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {isLoading ? "Adjusting..." : "Confirm Adjustment"}
            </button>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm transition disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
