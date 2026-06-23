"use client";

import React, { useState, useTransition } from "react";
import { addInventoryItem } from "@/lib/actions/salon-inventory";
import { useRouter } from "next/navigation";
import { Layers, AlertCircle } from "lucide-react";

const MEASUREMENT_UNITS = [
  { value: "ml", label: "Milliliters (ml)" },
  { value: "g", label: "Grams (g)" },
  { value: "pcs", label: "Pieces (pcs)" },
  { value: "pkts", label: "Packets (pkts)" },
  { value: "kg", label: "Kilograms (kg)" },
];

export default function AddProductModal({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    productName: "",
    sku: "",
    unitType: "ml",
    assetCategory: "consumable",
    currentVolumeMlGrams: 0,
    alertThreshold: 100,
    purchasePrice: 0,
    retailPrice: 0,
  });
  
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.productName.trim()) {
      setError("Product name is required");
      return;
    }

    startTransition(async () => {
      // 🌟 FULLY MAPPED: All fields now match your Drizzle glam-schema
      const result = await addInventoryItem({
        productName: formData.productName,
        sku: formData.sku,
        unitType: formData.unitType,
        assetCategory: formData.assetCategory,
        currentVolumeMlGrams: formData.currentVolumeMlGrams,
        alertThreshold: formData.alertThreshold,
        purchasePrice: formData.purchasePrice,
        retailPrice: formData.retailPrice,
      } as any);

      if (result.success) {
        router.refresh();
        onClose();
      } else {
        setError(result.error || "Failed to add product asset.");
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl w-full max-w-md relative overflow-hidden text-slate-200">
        
        <div className="flex items-center gap-2.5 mb-6">
          <div className="p-2 bg-pink-950/40 border border-pink-800/30 text-pink-400 rounded-xl">
            <Layers size={16} />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-200">Add New Product</h2>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs font-medium flex items-center gap-2">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Category Selector */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Classification</label>
              <select
                value={formData.assetCategory}
                onChange={(e) => setFormData({ ...formData, assetCategory: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 focus:border-pink-500/50 transition cursor-pointer"
              >
                <option value="consumable">🧴 Consumable</option>
                <option value="fixed_asset">✂️ Fixed Asset</option>
              </select>
            </div>
            {/* SKU Input */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">SKU ID</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 text-xs font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Product Name</label>
            <input
              type="text"
              value={formData.productName}
              onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 text-xs font-semibold"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Unit</label>
              <select
                value={formData.unitType}
                onChange={(e) => setFormData({ ...formData, unitType: e.target.value })}
                className="w-full px-2 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold"
              >
                {MEASUREMENT_UNITS.map((u) => <option key={u.value} value={u.value}>{u.label.split(' ')[0]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Stock</label>
              <input type="number" value={formData.currentVolumeMlGrams} onChange={(e) => setFormData({...formData, currentVolumeMlGrams: parseInt(e.target.value) || 0})} className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-bold" required />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Alert</label>
              <input type="number" value={formData.alertThreshold} onChange={(e) => setFormData({...formData, alertThreshold: parseInt(e.target.value) || 0})} className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-bold" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Purchase Price</label>
              <input type="number" step="0.01" value={formData.purchasePrice} onChange={(e) => setFormData({...formData, purchasePrice: parseFloat(e.target.value) || 0})} className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-bold" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Retail Price</label>
              <input type="number" step="0.01" value={formData.retailPrice} onChange={(e) => setFormData({...formData, retailPrice: parseFloat(e.target.value) || 0})} className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-bold" />
            </div>
          </div>

          <div className="flex gap-3 pt-3">
            <button type="submit" disabled={isPending} className="flex-1 py-2.5 rounded-xl bg-pink-600 text-white font-black text-xs uppercase hover:bg-pink-500 transition">{isPending ? "Saving..." : "Add Product"}</button>
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-200 font-bold text-xs uppercase hover:bg-slate-700 transition">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}