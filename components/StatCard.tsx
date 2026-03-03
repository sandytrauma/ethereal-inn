import React from 'react';
import { LucideIcon } from 'lucide-react';

// 1. Define the missing interface
interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend: 'up' | 'down';
  change?: string; // Optional field
}

export function StatCard({ title, value, icon: Icon, trend, change }: StatCardProps) {
  // Ensure we have a valid number for formatting
  const numericValue = Number(value) || 0;

  return (
    <div className="bg-slate-900/40 border border-slate-800/50 p-5 rounded-[2rem] space-y-3 shadow-sm">
      <div className="flex justify-between items-start">
        <div className={`p-2 rounded-xl bg-slate-800 ${trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
          <Icon size={18} />
        </div>
        
        {change && (
          <div className={`text-[10px] font-black px-2 py-1 rounded-lg ${
            trend === 'up' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
          }`}>
            {change}
          </div>
        )}
      </div>

      <div>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest px-1">
          {title}
        </p>
        <p className="text-xl font-black text-white mt-1">
          ₹{numericValue.toLocaleString('en-IN')}
        </p>
      </div>
    </div>
  );
}