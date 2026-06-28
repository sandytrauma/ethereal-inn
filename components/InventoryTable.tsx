"use client";

import React, { useState } from "react";
import StockAdjustmentModal from "./StockAdjustmentModal";
import EditProductModal from "./EditProductModal";
import { deleteInventoryItem } from "@/lib/actions/salon-inventory";
import { useRouter } from "next/navigation";
import { Trash2, SlidersHorizontal, Edit2, Package } from "lucide-react";

interface InventoryTableProps {
  products: any[];
}

export default function InventoryTable({ products }: InventoryTableProps) {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<"all" | "consumable" | "fixed_asset">("all");
  const router = useRouter();

  // Filter logic based on the normalized category
  const filteredProducts = products.filter((p) => {
    if (categoryFilter === "all") return true;
    return p.assetCategory === categoryFilter;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const handleDelete = async (productId: number) => {
    if (!confirm("Are you sure you want to permanently delete this product?")) return;
    const result = await deleteInventoryItem(productId);
    if (result.success) router.refresh();
    else alert(result.error);
  };

  const getAlertBadgeColor = (level: string) => {
    if (level === "critical_empty") return "bg-red-500/10 text-red-400 border-red-500/20";
    if (level === "low_stock") return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  };

  return (
    <>
      <div className="p-6 bg-slate-900/30 border border-slate-800/80 rounded-2xl shadow-2xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8 pb-4 border-b border-slate-800/40">
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Package className="w-5 h-5 text-pink-500" /> Inventory Ledger
          </h3>
          <div className="flex bg-slate-950 border border-slate-800/90 p-1 rounded-xl">
            {["all", "consumable", "fixed_asset"].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat as any)}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  categoryFilter === cat ? "bg-slate-800 text-pink-400" : "text-slate-400"
                }`}
              >
                {cat === "all" ? "All" : cat === "consumable" ? "Consumables" : "Fixed Assets"}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left min-w-[1000px]">
            <thead>
              <tr className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
                <th className="px-6 py-3.5">Product Name</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">SKU</th>
                <th className="px-4 py-3.5 text-right">Cost Price</th>
                <th className="px-4 py-3.5 text-right">Retail Sale</th>
                <th className="px-4 py-3.5 text-right">Stock Qty</th>
                <th className="px-6 py-3.5 text-center">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-xs font-medium">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-900/30">
                  <td className="px-6 py-4 font-semibold text-slate-100">{p.productName}</td>
                  <td className="px-4 py-4 uppercase font-black text-[9px] text-purple-400">{p.assetCategory}</td>
                  <td className="px-4 py-4 font-mono text-slate-400">{p.sku}</td>
                  <td className="px-4 py-4 font-mono text-right text-slate-400">{formatCurrency(p.purchasePrice)}</td>
                  <td className="px-4 py-4 font-mono text-right font-bold text-slate-300">{formatCurrency(p.retailPrice)}</td>
                  <td className="px-4 py-4 font-mono font-black text-right text-slate-100">
                    {p.currentVolumeMlGrams.toLocaleString("en-IN")}
                    <span className="text-[10px] text-slate-500 font-normal ml-1 uppercase">{p.unitType}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-0.5 rounded-md border text-[9px] font-black uppercase ${getAlertBadgeColor(p.alertLevel)}`}>
                      {p.alertLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setSelectedProduct(p); setShowEditModal(true); }} className="p-2 bg-slate-800 rounded-lg"><Edit2 size={12}/></button>
                      <button onClick={() => { setSelectedProduct(p); setShowAdjustModal(true); }} className="p-2 bg-pink-950/30 text-pink-400 rounded-lg"><SlidersHorizontal size={12}/></button>
                      <button onClick={() => handleDelete(p.id)} className="p-2 text-slate-500 hover:text-red-400"><Trash2 size={12}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {showEditModal && selectedProduct && <EditProductModal product={selectedProduct} onClose={() => { setShowEditModal(false); setSelectedProduct(null); }} />}
      {showAdjustModal && selectedProduct && <StockAdjustmentModal product={selectedProduct} onClose={() => { setShowAdjustModal(false); setSelectedProduct(null); }} />}
    </>
  );
}