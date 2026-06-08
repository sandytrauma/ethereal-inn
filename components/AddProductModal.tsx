"use client";

import React, { useState, useTransition } from "react";
import { addInventoryItem } from "@/lib/actions/salon-inventory";
import { useRouter } from "next/navigation";
import { Layers, AlertCircle } from "lucide-react";

// Standardized measurement vectors supported by the B2B Salon ERP ecosystem
const MEASUREMENT_UNITS = [
  { value: "ml", label: "Milliliters (ml) — e.g., Shampoos, Serums" },
  { value: "g", label: "Grams (g) — e.g., Hair Color Tubes, Bleach" },
  { value: "pcs", label: "Pieces (pcs) — e.g., Hair Sheets, Applicators" },
  { value: "pkts", label: "Packets (pkts) — e.g., Cotton Rolls, Disposables" },
  { value: "kg", label: "Kilograms (kg) — e.g., Large Backbar Clays, Talcum" },
];

export default function AddProductModal({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    productName: "",
    sku: "",
    unitType: "ml", // 🌟 NEW: Core measurement vector fallback
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

    // Validation Guardrails
    if (!formData.productName.trim()) {
      setError("Product name is required");
      return;
    }

    if (formData.currentVolumeMlGrams < 0) {
      setError("Starting stock quantity cannot be a negative value");
      return;
    }

    if (formData.purchasePrice < 0 || formData.retailPrice < 0) {
      setError("Product pricing values cannot be negative numbers");
      return;
    }

    startTransition(async () => {
      const result = await addInventoryItem({
        productName: formData.productName,
        sku: formData.sku,
        currentVolumeMlGrams: formData.currentVolumeMlGrams,
        alertThreshold: formData.alertThreshold,
        purchasePrice: formData.purchasePrice,
        retailPrice: formData.retailPrice,
        // If your server action doesn't accept unitType yet, it will safely drop into your database's schema default.
        // Once you update your schema table, pass this directly:
        // unitType: formData.unitType 
      } as any);

      if (result.success) {
        router.refresh();
        onClose();
      } else {
        setError(result.error || "Failed to add product asset to active storage.");
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl w-full max-w-md animate-in slide-in-from-bottom-4 relative overflow-hidden text-slate-200">
        
        {isPending && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50">
            <div className="text-xs font-mono font-bold text-pink-400 animate-pulse">
              ⚡ Mapping New Material Schema Node...
            </div>
          </div>
        )}

        <div className="flex items-center gap-2.5 mb-6">
          <div className="p-2 bg-pink-950/40 border border-pink-800/30 text-pink-400 rounded-xl">
            <Layers size={16} />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-200">Add New Product</h2>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs font-medium flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Name Input */}
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">
              Product Name
            </label>
            <input
              type="text"
              value={formData.productName}
              onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
              placeholder="e.g., Premium Talcum Powder / Styling Gel"
              disabled={isPending}
              className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-pink-500/50 transition text-xs font-semibold disabled:opacity-50"
              required
            />
          </div>

          {/* SKU Field Input */}
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">
              SKU (Optional Barcode Identification)
            </label>
            <input
              type="text"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              placeholder="e.g., SKU-TALK-092"
              disabled={isPending}
              className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-pink-500/50 transition text-xs font-mono font-bold disabled:opacity-50"
            />
          </div>

          {/* 🌟 NEW: Dynamic Unit Type Multi-Vector Selector Option */}
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">
              Stock Measurement Vector Unit
            </label>
            <select
              value={formData.unitType}
              onChange={(e) => setFormData({ ...formData, unitType: e.target.value })}
              disabled={isPending}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 focus:outline-none focus:border-pink-500/50 transition cursor-pointer"
            >
              {MEASUREMENT_UNITS.map((unit) => (
                <option key={unit.value} value={unit.value}>
                  {unit.label}
                </option>
              ))}
            </select>
          </div>

          {/* Quantities Grid Dynamically Adapting Value Suffix Subtext Markers */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 truncate">
                Initial Stock ({formData.unitType})
              </label>
              <input
                type="number"
                value={formData.currentVolumeMlGrams || ""}
                onChange={(e) => setFormData({ ...formData, currentVolumeMlGrams: parseInt(e.target.value) || 0 })}
                placeholder={`0 ${formData.unitType}`}
                disabled={isPending}
                className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 text-xs font-mono font-bold focus:outline-none focus:border-pink-500/50 transition disabled:opacity-50"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 truncate">
                Alert Alert Trigger ({formData.unitType})
              </label>
              <input
                type="number"
                value={formData.alertThreshold || ""}
                onChange={(e) => setFormData({ ...formData, alertThreshold: parseInt(e.target.value) || 0 })}
                placeholder={`100 ${formData.unitType}`}
                disabled={isPending}
                className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 text-xs font-mono font-bold focus:outline-none focus:border-pink-500/50 transition disabled:opacity-50"
                required
              />
            </div>
          </div>

          {/* Pricing Grid Segment */}
          <div className="grid grid-cols-2 gap-4 border-t border-slate-800/60 pt-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">
                Purchase Cost (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.purchasePrice || ""}
                onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                disabled={isPending}
                className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 text-xs font-mono font-bold focus:outline-none focus:border-pink-500/50 transition"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">
                Retail Price (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.retailPrice || ""}
                onChange={(e) => setFormData({ ...formData, retailPrice: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                disabled={isPending}
                className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 text-xs font-mono font-bold focus:outline-none focus:border-pink-500/50 transition"
                required
              />
            </div>
          </div>

          {/* Modal Actions Footer Row */}
          <div className="flex gap-3 pt-3 border-t border-slate-800/40">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-400 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-pink-950/20 transition transform active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              {isPending ? "Adding..." : "Add Product"}
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
        </form>
      </div>
    </div>
  );
}