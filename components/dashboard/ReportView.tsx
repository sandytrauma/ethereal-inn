"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Download } from "lucide-react";

interface ReportLog {
  id: number;
  date: Date | string;
  propertyName?: string | null; 
  cashRevenue: string | number;
  upiRevenue: string | number;
  otaPayouts: string | number;
  roomRevenue: string | number;
  serviceRevenue: string | number;
  totalCollection: string | number;
  status: string;
}

interface ReportViewProps {
  logs: ReportLog[];
  previousLogs?: ReportLog[];
}

export default function ReportView({ logs = [], previousLogs = [] }: ReportViewProps) {
  // 1. Export Logic
  const exportToCSV = () => {
    if (logs.length === 0) return;

    const headers = "Date,Property,Room Revenue,Cash,UPI,OTA,Total Collection,Status\n";
    const rows = logs
      .map((log) => {
        const date = new Date(log.date).toLocaleDateString("en-IN");
        const property = log.propertyName || "Main Depot";
        return `${date},${property},${log.roomRevenue},${log.cashRevenue},${log.upiRevenue},${log.otaPayouts},${log.totalCollection},${log.status}`;
      })
      .join("\n");

    const blob = new Blob([headers + rows], {
      type: "text/csv;charset=utf-8;",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `Finance_Report_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url); 
  };

  // 2. Aggregate current stats
  const stats = useMemo(() => {
    return logs.reduce(
      (acc, curr) => {
        acc.upi += Number(curr.upiRevenue || 0);
        acc.cash += Number(curr.cashRevenue || 0);
        acc.ota += Number(curr.otaPayouts || 0);
        acc.rooms += Number(curr.roomRevenue || 0);
        acc.total += Number(curr.totalCollection || 0);
        return acc;
      },
      { upi: 0, cash: 0, ota: 0, rooms: 0, total: 0 },
    );
  }, [logs]);

  // 3. Growth Logic
  const growth = useMemo(() => {
    if (!previousLogs.length || !stats.total) return 0;
    const prevTotal = previousLogs.reduce(
      (acc, curr) => acc + Number(curr.totalCollection || 0),
      0
    );
    if (prevTotal === 0) return 100;
    return ((stats.total - prevTotal) / prevTotal) * 100;
  }, [stats.total, previousLogs]);

  // 🌟 FIXED: Clamped percentage logic to prevent unrounded layout overflows
  const calcPercent = (val: number) => {
    if (stats.total <= 0) return 0;
    const calculated = (val / stats.total) * 100;
    return Math.min(100, Math.max(0, parseFloat(calculated.toFixed(2))));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-20 font-sans selection:bg-amber-400 selection:text-black"
    >
      {/* --- HEADER & EXPORT --- */}
      <div className="flex justify-between items-center px-1">
        <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">
          Market <span className="text-amber-400">Intel</span>
        </h2>
        <button
          onClick={exportToCSV}
          disabled={logs.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-40 disabled:pointer-events-none rounded-xl text-[10px] font-black text-white uppercase transition-all active:scale-95"
        >
          <Download size={14} className="text-blue-400" />
          Export CSV
        </button>
      </div>

      {/* --- ANALYTICS CARD --- */}
      <section>
        <div className="bg-slate-900/40 border border-white/5 p-6 md:p-8 rounded-[2.5rem] shadow-2xl backdrop-blur-md relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />
          
          {/* Revenue Summary & Growth */}
          <div className="mb-8">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Portfolio Collection</p>
            <div className="flex items-baseline gap-3">
              <p className="text-4xl font-black text-white tracking-tighter italic">
                ₹{stats.total.toLocaleString("en-IN")}
              </p>
              <div className={`flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                growth >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
              }`}>
                {growth >= 0 ? "↑" : "↓"} {Math.abs(growth).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Breakdown Progress Bars */}
          <div className="space-y-7">
            <ProgressBar
              label="UPI Transactions"
              percent={calcPercent(stats.upi)}
              amount={stats.upi}
              color="bg-blue-500"
            />
            <ProgressBar
              label="Direct Cash"
              percent={calcPercent(stats.cash)}
              amount={stats.cash}
              color="bg-emerald-500"
            />
            <ProgressBar
              label="OTA Payouts"
              percent={calcPercent(stats.ota)}
              amount={stats.ota}
              color="bg-amber-400"
            />
          </div>

          {/* Footer Stats */}
          <div className="mt-10 grid grid-cols-2 gap-4 pt-8 border-t border-white/5 text-left">
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Room Revenue
              </p>
              <p className="text-xl font-black text-white italic">
                ₹{stats.rooms.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Daily Avg
              </p>
              <p className="text-xl font-black text-white italic">
                ₹
                {logs.length > 0
                  ? Math.round(stats.total / logs.length).toLocaleString("en-IN")
                  : 0}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- AUDIT LOG TABLE --- */}
      <section className="space-y-4">
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">
          Entry Audit
        </h3>
        <div className="overflow-hidden rounded-3xl border border-white/5 bg-slate-950/40 backdrop-blur-sm shadow-xl overflow-x-auto">
          <table className="w-full text-left text-[11px] min-w-[500px]">
            <thead className="bg-white/5 text-slate-400 uppercase font-black tracking-wider border-b border-white/5">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Property</th>
                <th className="p-4">Room Rev</th>
                <th className="p-4">Total</th>
                <th className="p-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-14 text-center text-slate-600 font-black uppercase italic tracking-widest"
                  >
                    No records found for this period
                  </td>
                </tr>
              ) : (
                logs.map((row, idx) => {
                  // 🌟 FIXED: Created deterministic dynamic key vectors to block item list reconciliation bugs
                  const safeRowKey = row.id ? `report-row-${row.id}` : `report-idx-${idx}`;
                  
                  return (
                    <tr
                      key={safeRowKey}
                      className="hover:bg-white/5 transition-colors group"
                    >
                      <td className="p-4 text-white font-black italic">
                        {new Date(row.date).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </td>
                      <td className="p-4 text-slate-400 uppercase font-bold tracking-tight">
                        {row.propertyName || "Main Depot"}
                      </td>
                      <td className="p-4 text-slate-400 font-medium">
                        ₹{Number(row.roomRevenue).toLocaleString("en-IN")}
                      </td>
                      <td className="p-4 text-white font-black">
                        ₹{Number(row.totalCollection).toLocaleString("en-IN")}
                      </td>
                      <td className="p-4 text-right">
                        <span
                          className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider ${
                            row.status === "reconciled"
                              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </motion.div>
  );
}

function ProgressBar({
  label,
  percent,
  amount,
  color,
}: {
  label: string;
  percent: number;
  amount: number;
  color: string;
}) {
  return (
    <div className="space-y-2 text-left">
      <div className="flex justify-between items-end text-[10px] font-black uppercase tracking-tight">
        <span className="text-slate-400">{label}</span>
        <span className="text-white font-bold">
          ₹{amount.toLocaleString("en-IN")}
          <span className="text-slate-500 ml-1 font-black">({Math.round(percent)}%)</span>
        </span>
      </div>
      <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full ${color} shadow-[0_0_12px_rgba(0,0,0,0.3)]`}
        />
      </div>
    </div>
  );
}