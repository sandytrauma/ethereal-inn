"use client";

import React, { useState } from "react";
import InventoryTable from "./InventoryTable";
import InventoryAlerts from "./InventoryAlerts";
import AddProductModal from "./AddProductModal";

export default function InventoryDashboard({
  products,
  alerts,
  totalConsumedToday,
}: {
  products: any[];
  alerts: any[];
  totalConsumedToday: number;
}) {
  const [showAddModal, setShowAddModal] = useState(false);

  // 🌟 DATA NORMALIZATION LAYER: Maps database snake_case to UI camelCase
 const normalizedProducts = (products || []).map((p) => ({
  id: p.id,
  productName: p.product_name || p.productName || "Unnamed",
  assetCategory: p.asset_category || p.assetCategory || "consumable",
  sku: p.sku || "—",
  // Ensure we parse the numeric values from the database decimals
  purchasePrice: Number(p.purchase_price || p.purchasePrice || 0),
  retailPrice: Number(p.retail_price || p.retailPrice || 0),
  currentVolumeMlGrams: Number(p.current_volume_ml_grams || p.currentVolumeMlGrams || 0),
  unitType: p.unit_type || p.unitType || "units",
  alertLevel: p.alert_level || p.alertLevel || "good",
}));

  const criticalCount = alerts.filter((a) => a.alertLevel === "critical_empty" || a.alert_level === "critical_empty").length;
  const lowStockCount = alerts.filter((a) => a.alertLevel === "low_stock" || a.alert_level === "low_stock").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl shadow-lg space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Products</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black tracking-tight text-pink-400">{normalizedProducts.length}</span>
            <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              IN STOCK
            </span>
          </div>
        </div>

        <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl shadow-lg space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Critical Stock</p>
          <div className="flex items-baseline justify-between">
            <span className={`text-2xl font-black tracking-tight ${criticalCount > 0 ? "text-red-400" : "text-emerald-400"}`}>
              {criticalCount}
            </span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
              criticalCount > 0
                ? "bg-red-950/40 text-red-400 border-red-800/40"
                : "bg-emerald-950/40 text-emerald-400 border-emerald-800/40"
            }`}>
              ALERT
            </span>
          </div>
        </div>

        <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl shadow-lg space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Low Stock</p>
          <div className="flex items-baseline justify-between">
            <span className={`text-2xl font-black tracking-tight ${lowStockCount > 0 ? "text-amber-400" : "text-emerald-400"}`}>
              {lowStockCount}
            </span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
              lowStockCount > 0
                ? "bg-amber-950/40 text-amber-400 border-amber-800/40"
                : "bg-emerald-950/40 text-emerald-400 border-emerald-800/40"
            }`}>
              WARNING
            </span>
          </div>
        </div>

        <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl shadow-lg space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Usage</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black tracking-tight text-indigo-400">{totalConsumedToday}ml</span>
            <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              USAGE
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          {/* Passing the normalized data to the table */}
          <InventoryTable products={normalizedProducts} />
        </div>

        <div className="space-y-4">
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-400 text-white font-bold text-sm tracking-wide shadow-lg shadow-pink-950/20 transition transform active:scale-[0.98] cursor-pointer select-none"
          >
            + Add Product
          </button>

          <InventoryAlerts alerts={alerts} />
        </div>
      </div>

      {showAddModal && <AddProductModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
}