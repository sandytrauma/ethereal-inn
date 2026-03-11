"use client";

import { motion } from "framer-motion";
import { BedDouble, CalendarCheck, CheckCircle2, TrendingUp } from "lucide-react";

interface StatsProps {
  stats: {
    current: number;    // Rooms currently occupied
    totalToday: number; // Total check-ins today
    reconciled: number; // Total check-outs/settlements today
    revenue: number;    // Sum of revenue from tasks
  };
}

export default function OccupancyStats({ stats }: StatsProps) {
  const cards = [
    { label: "Live Occupancy", value: stats.current, icon: BedDouble, color: "text-amber-400" },
    { label: "Daily Bookings", value: stats.totalToday, icon: CalendarCheck, color: "text-emerald-500" },
    { label: "Reconciled", value: stats.reconciled, icon: CheckCircle2, color: "text-blue-500" },
    { label: "Revenue Today", value: `₹${stats.revenue}`, icon: TrendingUp, color: "text-white" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="bg-white/5 border border-white/10 p-6 rounded-[2rem] backdrop-blur-sm group hover:border-white/20 transition-all"
        >
          <div className="flex justify-between items-start mb-4">
            <div className={`p-2 rounded-xl bg-white/5 ${card.color}`}>
              <card.icon size={20} />
            </div>
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500">Live Metric</span>
          </div>
          <div>
            <h4 className={`text-3xl font-black tracking-tighter italic leading-none mb-1 ${card.color}`}>
              {card.value}
            </h4>
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 opacity-60">
              {card.label}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}