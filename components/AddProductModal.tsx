"use client";

import React, { useState } from "react";
import { addInventoryItem } from "@/lib/actions/salon-inventory";
import { useRouter } from "next/navigation";

export default function AddProductModal({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    productName: "",
    sku: "",
    currentVolumeMlGrams: 0,
    alertThreshold: 100,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!formData.productName.trim()) {
      setError("Product name is required");
      setIsLoading(false);
      return;
    }

    if (formData.currentVolumeMlGrams < 0) {
      setError("Volume cannot be negative");
      setIsLoading(false);
      return;
    }

    const result = await addInventoryItem({
      productName: formData.productName,
      sku: formData.sku,
      currentVolumeMlGrams: formData.currentVolumeMlGrams,
      alertThreshold: formData.alertThreshold,
    });

    if (result.success) {
      router.refresh();
      onClose();
    } else {
      setError(result.error || "Failed to add product");
    }

    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl w-full max-w-md animate-in slide-in-from-bottom-4">
        <h2 className="text-xl font-bold text-slate-200 mb-6">Add New Product</h2>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs font-medium">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Product Name
            </label>
            <input
              type="text"
              value={formData.productName}
              onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
              placeholder="e.g., Retinol Revitalizing Serum"
              disabled={isLoading}
              className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-pink-500/80 focus:ring-1 focus:ring-pink-500/30 transition text-sm disabled:opacity-50"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              SKU (Optional)
            </label>
            <input
              type="text"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              placeholder="e.g., PROD-001"
              disabled={isLoading}
              className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-pink-500/80 focus:ring-1 focus:ring-pink-500/30 transition text-sm disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Current Volume (ml)
              </label>
              <input
                type="number"
                value={formData.currentVolumeMlGrams}
                onChange={(e) => setFormData({ ...formData, currentVolumeMlGrams: parseInt(e.target.value) || 0 })}
                placeholder="0"
                disabled={isLoading}
                className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-pink-500/80 focus:ring-1 focus:ring-pink-500/30 transition text-sm disabled:opacity-50"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Alert Threshold
              </label>
              <input
                type="number"
                value={formData.alertThreshold}
                onChange={(e) => setFormData({ ...formData, alertThreshold: parseInt(e.target.value) || 100 })}
                placeholder="100"
                disabled={isLoading}
                className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-pink-500/80 focus:ring-1 focus:ring-pink-500/30 transition text-sm disabled:opacity-50"
                required
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-400 text-white font-bold text-sm tracking-wide shadow-lg shadow-pink-950/20 transition transform active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {isLoading ? "Adding..." : "Add Product"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm transition disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
