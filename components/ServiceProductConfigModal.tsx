"use client";

import React, { useState, useTransition } from "react";
import { linkProductToService, unlinkProductFromService } from "@/lib/actions/salon-consumption";
import { useRouter } from "next/navigation";
import { Sparkles, Trash2, ShieldAlert } from "lucide-react";

export default function ServiceProductConfigModal({
  serviceId,
  serviceName,
  existingProducts,
  availableProducts,
  onClose,
}: {
  serviceId: number;
  serviceName: string;
  existingProducts: Array<{ id: number; productId: number; productName: string; defaultUsageVolume: number }>;
  availableProducts: Array<{ id: number; productName: string }>;
  onClose: () => void;
}) {
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [defaultVolume, setDefaultVolume] = useState(50);
  const [error, setError] = useState<string | null>(null);
  
  // 🌟 FIX: Use transition handling states to perfectly synchronize async router refreshes
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleAddProduct = async () => {
    if (!selectedProduct || defaultVolume <= 0) {
      setError("Please select a product and enter a valid baseline usage volume.");
      return;
    }

    if (existingProducts.some((p) => p.productId === selectedProduct)) {
      setError("This formula compound is already linked to this treatment profile.");
      return;
    }

    setError(null);

    startTransition(async () => {
      const result = await linkProductToService(serviceId, selectedProduct, defaultVolume);

      if (result.success) {
        // Reset states cleanly before firing closures
        setSelectedProduct(null);
        setDefaultVolume(50);
        
        // 🌟 FORCE LOCK: Wait for the layout cache to revalidate before closing view gates
        router.refresh();
        onClose();
      } else {
        setError(result.error || "Failed to commit service formula relation parameters.");
      }
    });
  };

  const handleRemoveProduct = async (linkId: number) => {
    if (!confirm("Remove this consumable product allocation configuration from this service layout?")) return;

    setError(null);

    startTransition(async () => {
      const result = await unlinkProductFromService(linkId);

      if (result.success) {
        router.refresh();
        onClose();
      } else {
        setError(result.error || "Failed to unlink target formula parameters.");
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl w-full max-w-md relative overflow-hidden text-slate-200">
        
        {/* Absolute Background Action Processing Shield */}
        {isPending && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-pink-400 animate-pulse select-none">
              <span className="h-2 w-2 rounded-full bg-pink-500 animate-ping" />
              Syncing Service Formulas & Cache States...
            </div>
          </div>
        )}

        <div className="flex items-start gap-3 mb-6">
          <div className="p-2 bg-pink-950/40 border border-pink-800/30 text-pink-400 rounded-xl shrink-0 mt-0.5">
            <Sparkles size={16} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-200 tracking-tight">Configure Products</h2>
            <p className="text-xs text-slate-400 mt-0.5">Set backbar stock deductions for: <span className="text-pink-400 font-bold">{serviceName}</span></p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs font-medium flex items-center gap-2">
            <ShieldAlert size={14} className="shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Existing Formula Links Row */}
        <div className="space-y-3 mb-6 max-h-[180px] overflow-y-auto pr-1">
          <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider">Currently Linked Consumables</label>
          {existingProducts.length === 0 ? (
            <div className="text-center py-6 Alexander text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/60 font-medium italic">
              No product relationships configured for this treatment.
            </div>
          ) : (
            existingProducts.map((product) => (
              <div key={product.id} className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex justify-between items-center transition hover:border-slate-700/80">
                <div>
                  <p className="text-xs font-bold text-slate-200">{product.productName}</p>
                  <p className="text-[10px] font-mono font-bold text-slate-400 mt-0.5">Auto Deduct: {product.defaultUsageVolume} ml/g</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveProduct(product.id)}
                  disabled={isPending}
                  className="p-1.5 rounded-lg bg-red-950/30 text-red-400 hover:bg-red-900/40 border border-red-900/30 transition disabled:opacity-40 cursor-pointer"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add Product Formula Form Block */}
        <div className="space-y-4 p-4 bg-slate-950/40 border border-slate-800/60 rounded-xl">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">
              Add Backbar Formulation Product
            </label>
            <select
              value={selectedProduct || ""}
              onChange={(e) => setSelectedProduct(parseInt(e.target.value) || null)}
              disabled={isPending}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs font-semibold focus:outline-none focus:border-pink-500/50 transition cursor-pointer"
            >
              <option value="">-- Choose item from stock index --</option>
              {availableProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.productName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">
              Default Auto-Deduction Metric (ml / grams)
            </label>
            <input
              type="number"
              value={defaultVolume || ""}
              onChange={(e) => setDefaultVolume(parseInt(e.target.value) || 0)}
              min="1"
              disabled={isPending}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs font-mono font-bold focus:outline-none focus:border-pink-500/50 transition"
            />
          </div>

          <button
            type="button"
            onClick={handleAddProduct}
            disabled={isPending || !selectedProduct || defaultVolume <= 0}
            className="w-full py-2.5 px-3 rounded-xl bg-pink-950/40 hover:bg-pink-900/50 text-pink-400 font-bold text-xs border border-pink-800/40 transition disabled:opacity-40 tracking-wide uppercase disabled:pointer-events-none cursor-pointer"
          >
            Link Product Formula
          </button>
        </div>

        <div className="flex gap-3 pt-6 border-t border-slate-800/60 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider transition disabled:opacity-50 cursor-pointer"
          >
            Close Configuration Panel
          </button>
        </div>
      </div>
    </div>
  );
}