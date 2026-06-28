"use client";

import React from "react";

export default function InventoryAlerts({ alerts }: { alerts: any[] }) {
  // Normalize the alert data: check for both camelCase and snake_case keys
  const normalizedAlerts = alerts.map((a) => ({
    ...a,
    id: a.id,
    productName: a.product_name || a.productName || "Unnamed Item",
    alertLevel: a.alert_level || a.alertLevel || "good",
    currentVolumeMlGrams: Number(a.current_volume_ml_grams || a.currentVolumeMlGrams || 0),
    unitType: a.unit_type || a.unitType || "units",
  }));

  const criticalItems = normalizedAlerts.filter((a) => a.alertLevel === "critical_empty");
  const lowStockItems = normalizedAlerts.filter((a) => a.alertLevel === "low_stock");

  return (
    <div className="space-y-4">
      {criticalItems.length > 0 && (
        <div className="p-4 bg-red-950/20 border border-red-800/40 rounded-2xl shadow-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-red-500/20">
                <span className="text-lg">🚨</span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider">Critical Stock</h3>
              <div className="mt-2 space-y-1">
                {criticalItems.map((item) => (
                  <p key={item.id} className="text-xs text-red-300">
                    • {item.productName}: {item.currentVolumeMlGrams.toLocaleString()} {item.unitType}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {lowStockItems.length > 0 && (
        <div className="p-4 bg-amber-950/20 border border-amber-800/40 rounded-2xl shadow-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-amber-500/20">
                <span className="text-lg">⚠️</span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Low Stock</h3>
              <div className="mt-2 space-y-1">
                {lowStockItems.slice(0, 5).map((item) => (
                  <p key={item.id} className="text-xs text-amber-300">
                    • {item.productName}: {item.currentVolumeMlGrams.toLocaleString()} {item.unitType}
                  </p>
                ))}
                {lowStockItems.length > 5 && (
                  <p className="text-xs text-amber-300 pt-1 font-bold">
                    +{lowStockItems.length - 5} more items
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {normalizedAlerts.length === 0 && (
        <div className="p-4 bg-emerald-950/20 border border-emerald-800/40 rounded-2xl shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-lg">✓</span>
            <div>
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">All Stock Levels Good</p>
              <p className="text-xs text-emerald-300 mt-1">No critical or low stock items</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}