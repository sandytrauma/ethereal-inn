"use client";

import React, { useState } from "react";
import StockAdjustmentModal from "./StockAdjustmentModal";
import { deleteInventoryItem } from "@/lib/actions/salon-inventory";
import { useRouter } from "next/navigation";

export default function InventoryTable({ products }: { products: any[] }) {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const router = useRouter();

  const handleDelete = async (productId: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    const result = await deleteInventoryItem(productId);
    if (result.success) {
      router.refresh();
    } else {
      alert(result.error || "Failed to delete product");
    }
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

  return (
    <>
      <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl shadow-xl">
        <div className="mb-6">
          <h3 className="text-md font-bold text-slate-200 tracking-wide">Product Inventory</h3>
          <p className="text-xs text-slate-500 mt-0.5">Manage salon product stock levels and alerts.</p>
        </div>

        <div className="overflow-x-auto">
          {products.length === 0 ? (
            <div className="text-center py-12 text-xs font-medium text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/60 select-none">
              📭 No products in inventory. Add your first product to get started.
            </div>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 select-none">
                  <th className="pb-3 font-semibold">Product Name</th>
                  <th className="pb-3 font-semibold">SKU</th>
                  <th className="pb-3 font-semibold text-right">Volume (ml)</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-sm">
                {products.map((product) => (
                  <tr key={product.id} className="group hover:bg-slate-900/20 transition">
                    <td className="py-3.5 font-medium text-slate-200">{product.productName}</td>
                    <td className="py-3.5 font-mono text-xs text-slate-400">{product.sku || "—"}</td>
                    <td className="py-3.5 font-semibold text-right text-slate-300">
                      {product.currentVolumeMlGrams}
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider select-none ${getAlertBadgeColor(
                          product.alertLevel
                        )}`}
                      >
                        {getAlertLabel(product.alertLevel)}
                      </span>
                    </td>
                    <td className="py-3.5 text-right font-medium text-xs space-x-2 flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setShowAdjustModal(true);
                        }}
                        className="px-2 py-1 rounded text-xs font-bold bg-pink-950/30 text-pink-400 hover:bg-pink-900/50 border border-pink-800/40 transition cursor-pointer"
                      >
                        Adjust
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="px-2 py-1 rounded text-xs font-bold bg-red-950/30 text-red-400 hover:bg-red-900/50 border border-red-800/40 transition cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-800/50 flex justify-between items-center text-xs text-slate-500 select-none">
          <span>Total Products: {products.length}</span>
          <span className="font-mono text-[10px] text-pink-500/80">Real-time Tracking</span>
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
