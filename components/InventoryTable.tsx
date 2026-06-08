"use client";

import React, { useState, useTransition } from "react";
import StockAdjustmentModal from "./StockAdjustmentModal";
import { deleteInventoryItem } from "@/lib/actions/salon-inventory";
import { useRouter } from "next/navigation";
import { Trash2, SlidersHorizontal, AlertTriangle, Coins } from "lucide-react";

export default function InventoryTable({ products }: { products: any[] }) {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  
  // 🌟 FIX: Add transition handlers to guarantee clean server cache synchronization on modifications
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = async (productId: number) => {
    if (!confirm("Are you sure you want to permanently delete this product from the inventory database?")) return;

    startTransition(async () => {
      const result = await deleteInventoryItem(productId);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || "Failed to remove product from catalog.");
      }
    });
  };

  const getAlertBadgeColor = (alertLevel: string) => {
    if (alertLevel === "critical_empty") return "bg-red-500/10 text-red-400 border-red-500/30";
    if (alertLevel === "low_stock") return "bg-amber-500/10 text-amber-400 border-amber-500/30";
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
  };

  const getAlertLabel = (alertLevel: string) => {
    if (alertLevel === "critical_empty") return "Critical";
    if (alertLevel === "low_stock") return "Low Stock";
    return "Good";
  };

  // Helper utility to safely format raw numeric decimal string values coming from Drizzle
  const formatCurrency = (amount: string | number) => {
    const numericAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    return `₹${(numericAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <>
      <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl shadow-xl relative overflow-hidden">
        
        {/* Global Mutation Transition Spinner */}
        {isPending && (
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-40 rounded-2xl">
            <div className="text-xs font-mono font-bold text-pink-400 animate-pulse">
              🔄 Synced Matrix Operations Active...
            </div>
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-md font-bold text-slate-200 tracking-wide">Product Inventory Ledger</h3>
          <p className="text-xs text-slate-500 mt-0.5">Manage backbar consumable stock layers, financial metrics, and threshold alerts.</p>
        </div>

        <div className="overflow-x-auto">
          {products.length === 0 ? (
            <div className="text-center py-12 text-xs font-medium text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/60 select-none flex flex-col items-center justify-center gap-2">
              <AlertTriangle size={18} className="text-slate-600 animate-pulse" />
              <span>No product assets logged inside active inventory logs. Add a product item to populate sheets.</span>
            </div>
          ) : (
            <table className="w-full border-collapse text-left whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 select-none">
                  <th className="pb-3 font-semibold">Product Name</th>
                  <th className="pb-3 font-semibold">SKU</th>
                  <th className="pb-3 font-semibold text-right">Cost Price</th> {/* 🌟 NEW FINANCIAL COLUMN */}
                  <th className="pb-3 font-semibold text-right">Retail Sale</th> {/* 🌟 NEW FINANCIAL COLUMN */}
                  <th className="pb-3 font-semibold text-right">Volume (ml/g)</th>
                  <th className="pb-3 font-semibold pl-6">Status</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-sm">
                {products.map((product) => (
                  <tr key={product.id} className="group hover:bg-slate-900/20 transition">
                    <td className="py-3.5 font-medium text-slate-200 max-w-xs truncate">{product.productName}</td>
                    <td className="py-3.5 font-mono text-xs text-slate-400">{product.sku || "—"}</td>
                    
                    {/* 🌟 FINANCIAL RENDER CELLS MAPPED AND SECURED */}
                    <td className="py-3.5 font-mono text-xs text-right text-slate-400">
                      {formatCurrency(product.purchasePrice)}
                    </td>
                    <td className="py-3.5 font-mono text-xs text-right font-bold text-pink-400/90">
                      {formatCurrency(product.retailPrice)}
                    </td>
                    
                    <td className="py-3.5 font-mono font-bold text-right text-slate-300">
                      {product.currentVolumeMlGrams?.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5切换 pl-6">
                      <span
                        className={`px-2 py-0.5 rounded-md border text-[10px] font-black uppercase tracking-wider select-none ${getAlertBadgeColor(
                          product.alertLevel
                        )}`}
                      >
                        {getAlertLabel(product.alertLevel)}
                      </span>
                    </td>
                    
                    {/* BUTTON ACTIONS CONTROL STRIP ROW */}
                    <td className="py-3.5 text-right font-medium text-xs">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowAdjustModal(true);
                          }}
                          disabled={isPending}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-pink-950/30 text-pink-400 hover:bg-pink-900/50 border border-pink-800/40 transition flex items-center gap-1 cursor-pointer disabled:opacity-40"
                        >
                          <SlidersHorizontal size={12} />
                          Adjust
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(product.id)}
                          disabled={isPending}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-red-950/30 text-red-400 hover:bg-red-900/50 border border-red-800/40 transition flex items-center gap-1 cursor-pointer disabled:opacity-40"
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Aggregate Asset Footer Summary Bar */}
        <div className="mt-4 pt-4 border-t border-slate-800/50 flex justify-between items-center text-xs text-slate-500 select-none font-medium">
          <span className="flex items-center gap-1.5">
            Total Unique Items: <span className="text-slate-300 font-bold font-mono">{products.length}</span>
          </span>
          <span className="font-mono text-[10px] text-pink-500/80 flex items-center gap-1">
            <Coins size={12} /> Live Stock Valuation Active
          </span>
        </div>
      </div>

      {showAdjustModal && selectedProduct && (
        <StockAdjustmentModal
          product={selectedProduct}
          onClose={() => {
            setShowAdjustModal(false);
            setSelectedProduct(null);
          }}
        />
      )}
    </>
  );
}