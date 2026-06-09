"use client";

import React, { useState, useTransition } from "react";
import StockAdjustmentModal from "./StockAdjustmentModal";
import EditProductModal from "./EditProductModal";
import { deleteInventoryItem } from "@/lib/actions/salon-inventory";
import { useRouter } from "next/navigation";
import { Trash2, SlidersHorizontal, AlertTriangle, Coins, Edit2, Package } from "lucide-react";

export default function InventoryTable({ products }: { products: any[] }) {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<"all" | "consumable" | "fixed_asset">("all");

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
    if (alertLevel === "critical_empty") return "bg-red-500/10 text-red-400 border-red-500/20";
    if (alertLevel === "low_stock") return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  };

  const getAlertLabel = (alertLevel: string) => {
    if (alertLevel === "critical_empty") return "Critical";
    if (alertLevel === "low_stock") return "Low Stock";
    return "Good";
  };

  const formatCurrency = (amount: string | number) => {
    const numericAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    return `₹${(numericAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const filteredProducts = products.filter((product) => {
    if (categoryFilter === "all") return true;
    return product.assetCategory === categoryFilter;
  });

  return (
    <>
      <div className="p-6 bg-slate-900/30 border border-slate-800/80 rounded-2xl shadow-2xl relative overflow-hidden text-slate-200 backdrop-blur-md">
        
        {/* Master Mutation Transition Spinner Overlay */}
        {isPending && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 rounded-2xl">
            <div className="text-xs font-mono font-bold text-pink-400 bg-slate-900/90 px-4 py-2.5 rounded-xl border border-slate-800 tracking-wider shadow-xl animate-pulse">
              🔄 Synced Matrix Operations Active...
            </div>
          </div>
        )}

        {/* Dashboard Header Bar Configuration Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8 pb-4 border-b border-slate-800/40">
          <div>
            <h3 className="text-lg font-bold text-slate-100 tracking-tight flex items-center gap-2">
              <Package className="w-5 h-5 text-pink-500" />
              Product Inventory Ledger
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
              Manage backbar consumable stock layers, equipment fixed assets, financial metrics, and adaptive reorder thresholds.
            </p>
          </div>

          {/* Segment Selector Navigation Tabs */}
          <div className="flex bg-slate-950 border border-slate-800/90 p-1 rounded-xl self-start lg:self-center shadow-inner">
            <button
              type="button"
              onClick={() => setCategoryFilter("all")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer select-none ${
                categoryFilter === "all" ? "bg-slate-800 text-pink-400 shadow-md" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All Items ({products.length})
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter("consumable")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer select-none ${
                categoryFilter === "consumable" ? "bg-slate-800 text-pink-400 shadow-md" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              🧴 Consumables
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter("fixed_asset")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer select-none ${
                categoryFilter === "fixed_asset" ? "bg-slate-800 text-pink-400 shadow-md" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              ✂️ Fixed Assets
            </button>
          </div>
        </div>

        {/* SCROLLABLE SCENE CONTAINER WRAPPER WITH SEAMLESS SPACING GAPS */}
        <div className="overflow-x-auto rounded-xl border border-slate-800/60 bg-slate-950/20 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-800/80 hover:scrollbar-thumb-slate-700/80 transition-colors pr-1">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 text-xs font-medium text-slate-500 select-none flex flex-col items-center justify-center gap-3">
              <AlertTriangle size={22} className="text-slate-600 animate-pulse" />
              <span className="max-w-xs leading-relaxed">No product assets found matching the targeted classification layer parameters.</span>
            </div>
          ) : (
            /* 🌟 FIXED: Changed to table-auto to let layout allocate column sizes dynamically without cutting lines */
            <table className="w-full border-collapse text-left table-auto min-w-[1000px]">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-900/10 select-none">
                  {/* 🌟 FIXED: Allocated structured padding constraints across headers to isolate actions column */}
                  <th className="px-6 py-3.5 font-semibold text-left">Product Name</th>
                  <th className="px-4 py-3.5 font-semibold text-left w-32">Classification</th>
                  <th className="px-4 py-3.5 font-semibold text-left w-32">SKU</th>
                  <th className="px-4 py-3.5 font-semibold text-right w-28">Cost Price</th>
                  <th className="px-4 py-3.5 font-semibold text-right w-28">Retail Sale</th>
                  <th className="px-4 py-3.5 font-semibold text-right w-28">Stock Qty</th> 
                  <th className="px-6 py-3.5 font-semibold text-center w-28">Status</th> {/* 🌟 FIXED: Switched to center align */}
                  <th className="px-6 py-3.5 font-semibold text-right w-44">Actions</th> {/* 🌟 FIXED: Expanded column space */}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-xs font-medium">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="group hover:bg-slate-900/30 transition-colors duration-150">
                    
                    {/* Primary Identity Cell */}
                    <td className="px-6 py-4 font-semibold text-slate-100 whitespace-normal max-w-xs">
                      {product.productName}
                    </td>
                    
                    {/* Accounting Classification Badge Cell */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] uppercase font-black tracking-wider border select-none ${
                        product.assetCategory === "fixed_asset" 
                          ? "bg-blue-500/5 text-blue-400 border-blue-500/20" 
                          : "bg-purple-500/5 text-purple-400 border-purple-500/20"
                      }`}>
                        {product.assetCategory === "fixed_asset" ? "Asset" : "Consumable"}
                      </span>
                    </td>

                    {/* Technical Tag String Cell */}
                    <td className="px-4 py-4 font-mono text-slate-400 tracking-tight whitespace-nowrap">
                      {product.sku || "—"}
                    </td>
                    
                    {/* Currency Calculation Values Cells */}
                    <td className="px-4 py-4 font-mono text-right text-slate-400 whitespace-nowrap">
                      {formatCurrency(product.purchasePrice)}
                    </td>
                    <td className="px-4 py-4 font-mono text-right font-bold text-slate-300 whitespace-nowrap">
                      {formatCurrency(product.retailPrice)}
                    </td>
                    
                    {/* Dynamic Vector Quantity Allocation Cell */}
                    <td className="px-4 py-4 font-mono font-black text-right text-slate-100 whitespace-nowrap">
                      {product.currentVolumeMlGrams?.toLocaleString("en-IN")}{" "}
                      <span className="text-[10px] text-slate-500 lowercase font-sans font-normal ml-0.5">
                        {product.unitType || "ml"}
                      </span>
                    </td>

                    {/* Operational Safety Alert Badge Cell */}
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-wider select-none ${getAlertBadgeColor(
                          product.alertLevel
                        )}`}
                      >
                        {product.assetCategory === "fixed_asset" ? "Good" : getAlertLabel(product.alertLevel)}
                      </span>
                    </td>
                    
                    {/* Action Operations Controller Strip Row */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {/* 🌟 FIXED: Standard button text tracking structure with isolated spaces inside action layout row */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowEditModal(true);
                          }}
                          disabled={isPending}
                          className="px-2 py-1.5 rounded-lg text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/50 transition-all cursor-pointer flex items-center gap-1 disabled:opacity-30 disabled:pointer-events-none shadow-sm"
                        >
                          <Edit2 size={11} />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowAdjustModal(true);
                          }}
                          disabled={isPending}
                          className="px-2 py-1.5 rounded-lg text-[11px] font-bold bg-pink-950/30 hover:bg-pink-900/40 text-pink-400 border border-pink-900/40 transition-all cursor-pointer flex items-center gap-1 disabled:opacity-30 disabled:pointer-events-none shadow-sm"
                        >
                          <SlidersHorizontal size={11} />
                          Adjust
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(product.id)}
                          disabled={isPending}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/20 border border-transparent hover:border-red-900/30 transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                          title="Delete Catalog Row Entry"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Aggregate Reporting Bottom Summary Navbar Bar Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800/40 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-500 font-medium select-none">
          <span className="text-slate-400">
            Showing <span className="text-slate-200 font-bold font-mono">{filteredProducts.length}</span> of{" "}
            <span className="text-slate-300 font-bold font-mono">{products.length}</span> uniquely tracked matrix items
          </span>
          <span className="font-mono text-[10px] text-pink-500/70 flex items-center gap-1 bg-pink-950/10 border border-pink-900/20 px-2.5 py-0.5 rounded-md">
            <Coins size={11} /> Multi-Vector Asset Valuation Active
          </span>
        </div>
      </div>

      {/* Conditional Interface Modals Presentation Mounting Layer */}
      {showEditModal && selectedProduct && (
        <EditProductModal
          product={selectedProduct}
          onClose={() => {
            setShowEditModal(false);
            setSelectedProduct(null);
          }}
        />
      )}

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