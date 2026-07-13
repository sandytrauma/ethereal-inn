import React, { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import { FinancialRecord } from './RevenueVelocityChart'; // Ensure this is exported from your chart file

interface VelocityTabProps {
  financeRecords: FinancialRecord[];
  opexTarget: number;
}

export const OperationalVelocityTab: React.FC<VelocityTabProps> = ({ financeRecords, opexTarget }) => {


    console.log("DEBUG: financeRecords received:", financeRecords);
  // 1. Data Processing Logic (MTD Burn-down)
const chartData = useMemo(() => {
  const now = new Date();
  // Format: "2026-07"
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  return financeRecords
    .filter((r) => {
      // Data in your console shows 'date' exists as 'YYYY-MM-DD'
      // We no longer filter by status, as your data doesn't seem to have one
      return r.date && r.date.startsWith(currentMonth);
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((r, index, arr) => {
      // Calculate daily total by summing the two known fields
      const dailyTotal = Number(r.cashRevenue || 0) + Number(r.upiRevenue || 0);
      
      // Calculate cumulative sum based on the same fields
      const cumulativeRevenue = arr
        .slice(0, index + 1)
        .reduce((sum, item) => 
          sum + Number(item.cashRevenue || 0) + Number(item.upiRevenue || 0), 0
        );
        
      return {
        // Get day of month (e.g., 13)
        date: new Date(r.date).getDate(),
        revenue: cumulativeRevenue,
      };
    });
}, [financeRecords]);

  const totalMTD = chartData.length > 0 ? chartData[chartData.length - 1].revenue : 0;
  const isProfitable = totalMTD >= opexTarget;

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Operational Velocity</h2>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">MTD Reconciled Revenue vs OPEX Threshold</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
              <YAxis tick={{fontSize: 10}} axisLine={false} tickLine={false} />
              <Tooltip />
              <ReferenceLine y={opexTarget} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: 'OPEX', fontSize: 10, fill: '#ef4444' }} />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="#eff6ff" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="p-8 bg-slate-900 rounded-[2rem] text-white flex flex-col justify-center border border-white/5">
          <h4 className="text-xs font-black uppercase tracking-widest text-amber-400 mb-4">Velocity Status</h4>
          <p className="text-4xl font-black tracking-tighter">{isProfitable ? "PROFITABLE" : "OPERATING LOSS"}</p>
          <p className="text-xs text-slate-400 mt-6 leading-relaxed">
            MTD Revenue: ₹{totalMTD.toLocaleString("en-IN")}<br/>
            Target OPEX: ₹{opexTarget.toLocaleString("en-IN")}
          </p>
        </div>
      </div>
    </div>
  );
};