"use client";

import React, { useState } from "react";
import { linkProductToService, unlinkProductFromService } from "@/lib/actions/salon-consumption";
import { useRouter } from "next/navigation";

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleAddProduct = async () => {
    if (!selectedProduct || defaultVolume <= 0) {
      setError("Please select a product and enter valid volume");
      return;
    }

    if (existingProducts.some((p) => p.productId === selectedProduct)) {
      setError("This product is already linked to this service");
      return;
    }

    setError(null);
    setIsLoading(true);

    const result = await linkProductToService(serviceId, selectedProduct, defaultVolume);

    if (result.success) {
      setSelectedProduct(null);
      setDefaultVolume(50);
      router.refresh();
      onClose();
    } else {
      setError(result.error || "Failed to link product");
    }

    setIsLoading(false);
  };

  const handleRemoveProduct = async (linkId: number) => {
    if (!confirm("Remove this product from the service?")) return;

    setIsLoading(true);
    const result = await unlinkProductFromService(linkId);

    if (result.success) {
      router.refresh();
      onClose();
    } else {
      setError(result.error || "Failed to remove product");
    }

    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl w-full max-w-md">
        <h2 className="text-xl font-bold text-slate-200 mb-2">Configure Products</h2>
        <p className="text-xs text-slate-400 mb-6">Set default products for: {serviceName}</p>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs font-medium">
            ⚠️ {error}
          </div>
        )}

        <div className="space-y-4 mb-6">
          {existingProducts.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/60">
              No products configured. Add one below.
            </div>
          ) : (
            existingProducts.map((product) => (
              <div key={product.id} className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg flex justify-between items-center">
                <div>
                  <p className="text-xs font-semibold text-slate-200">{product.productName}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Default: {product.defaultUsageVolume}ml</p>
                </div>
                <button
                  onClick={() => handleRemoveProduct(product.id)}
                  disabled={isLoading}
                  className="text-[10px] px-2 py-1 rounded bg-red-950/30 text-red-400 hover:bg-red-900/50 border border-red-800/40 transition disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>

        <div className="space-y-4 p-4 bg-slate-950/40 border border-slate-800/60 rounded-xl">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Add Product
            </label>
            <select
              value={selectedProduct || ""}
              onChange={(e) => setSelectedProduct(parseInt(e.target.value) || null)}
              disabled={isLoading}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-pink-500/80"
            >
              <option value="">Select a product...</option>
              {availableProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.productName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Default Usage (ml)
            </label>
            <input
              type="number"
              value={defaultVolume}
              onChange={(e) => setDefaultVolume(parseInt(e.target.value) || 0)}
              min="1"
              disabled={isLoading}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-pink-500/80"
            />
          </div>

          <button
            onClick={handleAddProduct}
            disabled={isLoading || !selectedProduct}
            className="w-full py-2 px-3 rounded-lg bg-pink-950/30 hover:bg-pink-900/50 text-pink-400 font-semibold text-sm border border-pink-800/40 transition disabled:opacity-50"
          >
            Link Product
          </button>
        </div>

        <div className="flex gap-3 pt-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm transition disabled:opacity-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
