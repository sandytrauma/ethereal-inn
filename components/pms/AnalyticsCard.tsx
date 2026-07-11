import React from 'react';

// Define the Props interface
interface AnalyticsCardProps {
  title: string;
  value: string;
  label: string;
  icon: React.ElementType;
  color: 'blue' | 'purple' | 'pink';
}

export function AnalyticsCard({ title, value, label, icon: Icon, color }: AnalyticsCardProps) {
  // Define color map
  const colorStyles = {
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    pink: "bg-pink-50 text-pink-600",
  };

  return (
    <div className="p-6 bg-white border border-slate-200 rounded-[2rem] shadow-sm flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{title}</span>
        <div className={`p-2 rounded-lg ${colorStyles[color]}`}>
          <Icon size={16} />
        </div>
      </div>
      <div>
        <h4 className="text-3xl font-black text-slate-900 italic">{value}</h4>
        <p className="text-[8px] text-slate-400 font-bold mt-2 uppercase">{label}</p>
      </div>
    </div>
  );
}