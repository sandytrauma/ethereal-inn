"use client";

import React, { useState, useTransition } from "react";
import { updateInventoryItem } from "@/lib/actions/salon-inventory";
import { useRouter } from "next/navigation";
import { Edit3, AlertCircle } from "lucide-react";

const MEASUREMENT_UNITS = [
  { value: "ml", label: "Milliliters (ml)" },
  { value: "g", label: "Grams (g)" },
  { value: "pcs", label: "Pieces (pcs)" },
  { value: "pkts", label: "Packets (pkts)" },
  { value: "kg", label: "Kilograms (kg)" },
];

export default function EditProductModal({ product, onClose }: { product: any; onClose: () => void }) {
  const [formData, setFormData] = useState({
    productName: product.productName || "",
    sku: product.sku || "",
    assetCategory: product.assetCategory || "consumable",
    unitType: product.unitType || "ml",
    alertThreshold: product.alertThreshold ?? 10,
    purchasePrice: product.purchasePrice ? parseFloat(product.purchasePrice) : 0,
    retailPrice: product.retailPrice ? parseFloat(product.retailPrice) : 0,
  });

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.productName.trim()) {
      setError("Product name cannot be empty.");
      return;
    }

    if (formData.purchasePrice < 0 || formData.retailPrice < 0) {
      setError("Pricing structures cannot be negative values.");
      return;
    }

    startTransition(async () => {
      // 🛡️ BUSINESS LOGIC ENFORCEMENT
      // Fixed Assets: Force unitType to 'pcs', alertThreshold to 0, disable metric selection
      const payload = {
        productName: formData.productName,
        sku: formData.sku,
        assetCategory: formData.assetCategory as "consumable" | "fixed_asset",
        unitType: formData.assetCategory === "fixed_asset" ? "pcs" : formData.unitType,
        alertThreshold: formData.assetCategory === "fixed_asset" ? 0 : formData.alertThreshold,
        purchasePrice: formData.purchasePrice,
        retailPrice: formData.retailPrice,
      };

      const result = await updateInventoryItem(product.id, payload);

      if (result.success) {
        router.refresh();
        onClose();
      } else {
        setError(result.error || "Failed to update product details.");
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900/90 border border-slate-800/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto text-slate-200 relative">
        
        {isPending && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 rounded-2xl">
            <div className="text-xs font-mono font-bold text-pink-400 animate-pulse">
              ⚡ Updating Ledger...
            </div>
          </div>
        )}

        <div className="flex items-center gap-2.5 mb-6">
          <div className="p-2 bg-pink-950/40 border border-pink-800/30 text-pink-400 rounded-xl">
            <Edit3 size={16} />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-200">Edit Product Matrix</h2>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs font-medium flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category Switcher */}
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Category</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, assetCategory: "consumable" })}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${
                  formData.assetCategory === "consumable" ? "bg-pink-950/40 border-pink-500/50 text-pink-400" : "bg-slate-950 border-slate-800 text-slate-400"
                }`}
              >
                🧴 Consumable
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, assetCategory: "fixed_asset", unitType: "pcs", alertThreshold: 0 })}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${
                  formData.assetCategory === "fixed_asset" ? "bg-pink-950/40 border-pink-500/50 text-pink-400" : "bg-slate-950 border-slate-800 text-slate-400"
                }`}
              >
                ✂️ Fixed Asset
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Product Name</label>
            <input type="text" value={formData.productName} onChange={(e) => setFormData({...formData, productName: e.target.value})} className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-semibold" required />
          </div>

          {/* Consumable Only Fields */}
          {formData.assetCategory === "consumable" && (
            <>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Measurement Unit</label>
                <select value={formData.unitType} onChange={(e) => setFormData({...formData, unitType: e.target.value})} className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold">
                  {MEASUREMENT_UNITS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Alert Trigger</label>
                <input type="number" value={formData.alertThreshold} onChange={(e) => setFormData({...formData, alertThreshold: parseInt(e.target.value) || 0})} className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-mono font-bold" required />
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4 border-t border-slate-800/60 pt-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Cost Price (₹)</label>
              <input type="number" step="0.01" value={formData.purchasePrice} onChange={(e) => setFormData({...formData, purchasePrice: parseFloat(e.target.value) || 0})} className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-mono font-bold" required />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Retail Price (₹)</label>
              <input type="number" step="0.01" value={formData.retailPrice} onChange={(e) => setFormData({...formData, retailPrice: parseFloat(e.target.value) || 0})} className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-mono font-bold" required />
            </div>
          </div>

          <div className="flex gap-3 pt-3 border-t border-slate-800/40">
            <button type="submit" disabled={isPending} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-500 text-white font-black text-xs uppercase tracking-wider">Save</button>
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-200 font-bold text-xs uppercase">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}