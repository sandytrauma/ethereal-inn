"use client";

import React, { useState, useEffect } from "react";
import { checkoutWithProductConsumption } from "@/lib/actions/salon-consumption";
import { useRouter } from "next/navigation";

export default function ProductConsumptionModal({
  appointmentId,
  onClose,
  onSuccess,
}: {
  appointmentId: string;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [consumedProducts, setConsumedProducts] = useState<
    Array<{ productId: number; productName: string; volume: number }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleVolumeChange = (productId: number, volume: number) => {
    setConsumedProducts((prev) =>
      prev.map((p) => (p.productId === productId ? { ...p, volume: Math.max(0, volume) } : p))
    );
  };

  const handleAddProduct = () => {
    setConsumedProducts([
      ...consumedProducts,
      { productId: 0, productName: "Select Product", volume: 0 },
    ]);
  };

  const handleRemoveProduct = (index: number) => {
    setConsumedProducts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const validProducts = consumedProducts.filter((p) => p.productId > 0 && p.volume > 0);

    if (validProducts.length === 0) {
      setError("Please add at least one product with volume > 0");
      return;
    }

    setError(null);
    setIsLoading(true);

    const result = await checkoutWithProductConsumption(
      appointmentId,
      validProducts.map((p) => ({ productId: p.productId, volume: p.volume }))
    );

    if (result.success) {
      router.refresh();
      if (onSuccess) onSuccess();
      onClose();
    } else {
      setError(result.error || "Failed to process checkout");
    }

    setIsLoading(false);
  };

  const totalVolume = consumedProducts.reduce((sum, p) => sum + p.volume, 0);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-slate-200 mb-2">Product Consumption</h2>
        <p className="text-xs text-slate-400 mb-6">
          Record products used during this appointment. These will be deducted from inventory.
        </p>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs font-medium">
            ⚠️ {error}
          </div>
        )}

        <div className="space-y-4 mb-6">
          {consumedProducts.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/60">
              No products added. Click below to add products.
            </div>
          ) : (
            consumedProducts.map((product, index) => (
              <div key={index} className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-300">{product.productName}</span>
                  <button
                    onClick={() => handleRemoveProduct(index)}
                    className="text-xs px-2 py-1 rounded bg-red-950/30 text-red-400 hover:bg-red-900/50 border border-red-800/40 transition"
                  >
                    Remove
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Volume (ml) - Current: {product.volume}
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleVolumeChange(product.productId, product.volume - 5)}
                      className="flex-1 py-2 px-3 rounded-lg bg-red-950/20 hover:bg-red-900/30 text-red-400 font-bold text-sm border border-red-800/30"
                    >
                      -5ml
                    </button>
                    <input
                      type="number"
                      value={product.volume}
                      onChange={(e) =>
                        handleVolumeChange(product.productId, parseInt(e.target.value) || 0)
                      }
                      placeholder="0"
                      className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-sm text-center"
                    />
                    <button
                      onClick={() => handleVolumeChange(product.productId, product.volume + 5)}
                      className="flex-1 py-2 px-3 rounded-lg bg-emerald-950/20 hover:bg-emerald-900/30 text-emerald-400 font-bold text-sm border border-emerald-800/30"
                    >
                      +5ml
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Total Consumed:</span>
            <span className="font-mono font-bold text-pink-400">{totalVolume} ml</span>
          </div>
        </div>

        <button
          onClick={handleAddProduct}
          disabled={isLoading}
          className="w-full mb-4 py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition disabled:opacity-50"
        >
          + Add Product
        </button>

        <div className="flex gap-3 pt-4">
          <button
            onClick={handleSubmit}
            disabled={isLoading || consumedProducts.length === 0}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-400 text-white font-bold text-sm tracking-wide shadow-lg shadow-pink-950/20 transition transform active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            {isLoading ? "Processing..." : "Complete Checkout"}
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
  );
}
