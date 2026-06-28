"use client";

import React, { useState, useEffect, useTransition } from "react";
import { checkoutWithProductConsumption } from "@/lib/actions/salon-consumption";
import { getInventoryList } from "@/lib/actions/salon-inventory";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Minus, AlertTriangle } from "lucide-react";

interface ConsumedProductRow {
  rowId: string;
  productId: number;
  productName: string;
  volume: number;
}

// Updated interface to match DB snake_case keys after normalization
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

  useEffect(() => {
    async function loadCatalog() {
      const data = await getInventoryList();
      if (Array.isArray(data)) {
        // NORMALIZATION: Map snake_case DB response to camelCase expected by component
        const normalized = data.map((item: any) => ({
          id: item.id,
          productName: item.product_name || item.productName,
          sku: item.sku,
          currentVolumeMlGrams: Number(item.current_volume_ml_grams || item.currentVolumeMlGrams || 0),
        }));
        setAvailableInventory(normalized);
      } else {
        setError("Failed to sync inventory.");
      }
    }
    loadCatalog();
  }, []);

  const handleVolumeChange = (rowId: string, volume: number) => {
    setConsumedProducts((prev) =>
      prev.map((p) => (p.rowId === rowId ? { ...p, volume: Math.max(0, volume) } : p))
    );
  };

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
        rowId: `row_${Date.now()}`,
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
      setError("Please add at least one valid product with an allocation > 0.");
      return;
    }

    startTransition(async () => {
      const result = await checkoutWithProductConsumption(
        appointmentId,
        validProducts.map((p) => ({ productId: p.productId, volume: p.volume }))
      );

      if (result.success) {
        router.refresh();
        onSuccess?.();
        onClose();
      } else {
        setError(result.error || "Checkout failed.");
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
              ⚡ Processing Stock Deductions...
            </div>
          </div>
        )}

        <h2 className="text-xl font-bold text-slate-200 mb-1">Product Consumption Ledger</h2>
        <p className="text-xs text-slate-400 mb-6">
          Record usage totals. Atomic stock decrements applied on checkout.
        </p>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs font-medium flex items-center gap-2">
            <AlertTriangle size={14} /> <span>{error}</span>
          </div>
        )}

        <div className="space-y-4 mb-6">
          {consumedProducts.map((product) => (
            <div key={product.rowId} className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-4">
              <div className="flex flex-col sm:flex-row justify-between gap-3 sm:items-center">
                <div className="flex-1">
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5">Stock Item</label>
                  <select
                    value={product.productId}
                    onChange={(e) => handleProductSelection(product.rowId, parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs"
                  >
                    <option value={0}>-- Select Product --</option>
                    {availableInventory.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.productName} — Stock: {item.currentVolumeMlGrams}
                      </option>
                    ))}
                  </select>
                </div>
                <button onClick={() => handleRemoveProduct(product.rowId)} className="p-2 rounded-lg bg-red-950/30 text-red-400">
                  <Trash2 size={14} />
                </button>
              </div>

              {product.productId > 0 && (
                <div className="flex items-center gap-3">
                  <button onClick={() => handleVolumeChange(product.rowId, product.volume - 5)} className="p-2 bg-slate-900 border border-slate-800 rounded-lg"><Minus size={14} /></button>
                  <input type="number" value={product.volume || ""} onChange={(e) => handleVolumeChange(product.rowId, parseInt(e.target.value) || 0)} className="w-20 px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-center text-xs" />
                  <button onClick={() => handleVolumeChange(product.rowId, product.volume + 5)} className="p-2 bg-pink-950/40 border border-pink-900/30 rounded-lg text-pink-400"><Plus size={14} /></button>
                </div>
              )}
            </div>
          ))}
        </div>

        <button onClick={handleAddProduct} className="w-full mb-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700/40">
          <Plus size={14} /> Add Product Row
        </button>

        <div className="flex gap-3">
          <button onClick={handleSubmit} disabled={isPending || consumedProducts.length === 0} className="flex-1 py-3 rounded-xl bg-pink-600 text-white font-black text-xs uppercase">
            {isPending ? "Processing..." : "Complete Checkout"}
          </button>
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-200 font-bold text-xs uppercase">Cancel</button>
        </div>
      </div>
    </div>
  );
}