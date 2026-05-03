import React from 'react';
import { LucideIcon } from 'lucide-react';

// 1. Enhanced interface to handle currency vs. count logic
interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend: 'up' | 'down';
  change?: string;      // Optional percentage or text change
  isCurrency?: boolean; // Flag to toggle the ₹ symbol
}

/**
 * StatCard: Specialized for Hotel Analytics
 * Features strictly black/heavy font weights and a unique 2rem border radius.
 */
export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  change, 
  isCurrency = true 
}: StatCardProps) {
  
  // Ensure we have a valid number for formatting logic
  const numericValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]+/g, "")) : value;
  const safeValue = isNaN(numericValue) ? 0 : numericValue;

  return (
    <div className="bg-slate-900/40 border border-slate-800/50 p-5 rounded-[2rem] space-y-3 shadow-sm backdrop-blur-md hover:border-slate-700/50 transition-colors group">
      <div className="flex justify-between items-start">
        {/* Dynamic Icon Background based on Trend */}
        <div className={`p-2.5 rounded-xl bg-slate-800 transition-transform group-hover:scale-110 ${
          trend === 'up' ? 'text-emerald-400' : 'text-rose-400'
        }`}>
          <Icon size={18} />
        </div>
        
        {/* Trend Indicator Badge */}
        {change && (
          <div className={`text-[10px] font-black px-2 py-1 rounded-lg tracking-tighter ${
            trend === 'up' 
              ? 'bg-emerald-500/10 text-emerald-500' 
              : 'bg-rose-500/10 text-rose-500'
          }`}>
            {trend === 'up' ? '↑' : '↓'} {change}
          </div>
        )}
      </div>

      <div>
        {/* Section Label */}
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest px-1">
          {title}
        </p>
        
        {/* Formatted Value with Indian Locale Support */}
        <p className="text-2xl font-black text-white mt-1 tracking-tighter italic">
          {isCurrency && "₹"}
          {safeValue.toLocaleString('en-IN')}
        </p>
      </div>
    </div>
  );
}