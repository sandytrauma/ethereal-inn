"use client";

import React from "react";

export default function InventoryAlerts({ alerts }: { alerts: any[] }) {
  const criticalItems = alerts.filter((a) => a.alertLevel === "critical_empty");
  const lowStockItems = alerts.filter((a) => a.alertLevel === "low_stock");

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
                    • {item.productName}: {item.currentVolumeMlGrams}ml
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
                    • {item.productName}: {item.currentVolumeMlGrams}ml
                  </p>
                ))}
                {lowStockItems.length > 5 && (
                  <p className="text-xs text-amber-300 pt-1">
                    +{lowStockItems.length - 5} more items
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {alerts.length === 0 && (
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
