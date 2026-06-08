"use client";

import React, { useState, useEffect, useTransition } from "react";
import { checkoutWithProductConsumption } from "@/lib/actions/salon-consumption";
import { getInventoryList } from "@/lib/actions/salon-inventory";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Minus, AlertTriangle } from "lucide-react";

interface ConsumedProductRow {
  rowId: string; // Unique transient key to insulate client row mutation updates
  productId: number;
  productName: string;
  volume: number;
}

interface InventoryProductItem {
  id: number;
  productName: string;
  sku: string | null;
  currentVolumeMlGrams: number;
}

export default function ProductConsumptionModal({
  appointmentId,
  onClose,
  onSuccess,
}: {
  appointmentId: string;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [availableInventory, setAvailableInventory] = useState<InventoryProductItem[]>([]);
  const [consumedProducts, setConsumedProducts] = useState<ConsumedProductRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  // =========================================================================
  // 🔄 FETCH SYSTEM STOCKS ON LAYER INITIALIZATION
  // =========================================================================
  useEffect(() => {
    async function loadCatalog() {
      const res = await getInventoryList();
      if (res.success && res.data) {
        setAvailableInventory(res.data as any);
      } else {
        setError(res.error || "Failed to sync backbar product inventory selections.");
      }
    }
    loadCatalog();
  }, []);

  // Handle precise manual volume tweaks safely
  const handleVolumeChange = (rowId: string, volume: number) => {
    setConsumedProducts((prev) =>
      prev.map((p) => (p.rowId === rowId ? { ...p, volume: Math.max(0, volume) } : p))
    );
  };

  // Map chosen inventory dropdown item properties into the active tracking state row
  const handleProductSelection = (rowId: string, targetId: number) => {
    const matchedAsset = availableInventory.find((item) => item.id === targetId);
    setConsumedProducts((prev) =>
      prev.map((p) =>
        p.rowId === rowId
          ? {
              ...p,
              productId: targetId,
              productName: matchedAsset ? matchedAsset.productName : "Unknown Item",
            }
          : p
      )
    );
  };

  const handleAddProduct = () => {
    setConsumedProducts([
      ...consumedProducts,
      {
        rowId: `row_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        productId: 0,
        productName: "",
        volume: 0,
      },
    ]);
  };

  const handleRemoveProduct = (rowId: string) => {
    setConsumedProducts((prev) => prev.filter((p) => p.rowId !== rowId));
  };

  const handleSubmit = async () => {
    const validProducts = consumedProducts.filter((p) => p.productId > 0 && p.volume > 0);

    if (validProducts.length === 0) {
      setError("Please add at least one valid backbar product with an allocation greater than 0 ml/g.");
      return;
    }

    setError(null);
    
    startTransition(async () => {
      const result = await checkoutWithProductConsumption(
        appointmentId,
        validProducts.map((p) => ({ productId: p.productId, volume: p.volume }))
      );

      if (result.success) {
        router.refresh();
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError(result.error || "Transactional checkout loop failed.");
      }
    });
  };

  const totalVolume = consumedProducts.reduce((sum, p) => sum + p.volume, 0);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative text-slate-200">
        
        {isPending && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 rounded-2xl">
            <div className="text-xs font-mono font-bold text-pink-400 animate-pulse">
              ⚡ Executing Transactional Checkout & Stock Deductions...
            </div>
          </div>
        )}

        <h2 className="text-xl font-bold text-slate-200 mb-1">Product Consumption Ledger</h2>
        <p className="text-xs text-slate-400 mb-6">
          Record specific consumable usage totals applied during treatment. Values decrement material stocks atomically.
        </p>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs font-medium flex items-center gap-2">
            <AlertTriangle size={14} className="shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Dynamic Items Mapping Array Grid */}
        <div className="space-y-4 mb-6">
          {consumedProducts.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/60 font-medium italic">
              No backbar products added to this timeline bundle yet. Click below to add.
            </div>
          ) : (
            consumedProducts.map((product) => (
              <div key={product.rowId} className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-4">
                <div className="flex flex-col sm:flex-row justify-between gap-3 sm:items-center">
                  
                  {/* LIVE SELECTION SELECT ELEMENT DROPDOWN CONTAINER */}
                  <div className="flex-1">
                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5">
                      Select Stock Consumable
                    </label>
                    <select
                      value={product.productId}
                      onChange={(e) => handleProductSelection(product.rowId, parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-pink-500/50 transition font-semibold"
                    >
                      <option value={0}>-- Select Product Item From Shelf --</option>
                      {availableInventory.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.productName} {item.sku ? `(${item.sku})` : ""} — Instock: {item.currentVolumeMlGrams}ml/g
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveProduct(product.rowId)}
                    className="self-end sm:self-center p-2 rounded-lg bg-red-950/30 text-red-400 hover:bg-red-900/40 border border-red-900/30 transition cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* VOLUME STEPMATRIX CONTROLS */}
                {product.productId > 0 && (
                  <div className="pt-1">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">
                      Deduction Volume Quantities (ml / grams)
                    </label>
                    <div className="flex items-center gap-3 max-w-xs">
                      <button
                        type="button"
                        onClick={() => handleVolumeChange(product.rowId, product.volume - 5)}
                        className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 transition cursor-pointer"
                      >
                        <Minus size={14} />
                      </button>
                      <input
                        type="number"
                        value={product.volume || ""}
                        onChange={(e) => handleVolumeChange(product.rowId, parseInt(e.target.value) || 0)}
                        placeholder="0"
                        className="w-20 px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs font-mono font-bold text-center focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleVolumeChange(product.rowId, product.volume + 5)}
                        className="p-2 rounded-lg bg-pink-950/40 hover:bg-pink-900/40 border border-pink-900/30 text-pink-400 transition cursor-pointer"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Master Accumulator Summary Banner */}
        <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl mb-4">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-medium">Accumulated Volumetric Footprint:</span>
            <span className="font-mono font-black text-pink-400 bg-pink-950/20 px-2.5 py-1 border border-pink-900/30 rounded-md">
              {totalVolume} ml / g
            </span>
          </div>
        </div>

        {/* Action Controls Toolbar Layout */}
        <button
          type="button"
          onClick={handleAddProduct}
          disabled={isPending}
          className="w-full mb-4 py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition border border-slate-700/40 cursor-pointer"
        >
          <Plus size={14} /> Add Product Allocation Row
        </button>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || consumedProducts.length === 0}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-400 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-pink-950/20 transition transform active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            {isPending ? "Processing..." : "Complete Invoice Checkout"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider transition disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}