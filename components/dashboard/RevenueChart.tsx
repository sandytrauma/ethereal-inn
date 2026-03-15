"use client";

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  UserCheck, 
  MessageSquare, 
  Calendar, 
  Activity,
  CreditCard,
  Banknote,
  Globe,
  ArrowUpRight
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend);

interface MarketIntelProps {
  logs: any[];
  inquiries: any[];
  guests: any[];
  tasks: any[]; // <--- Add this line to fix the error
}

export default function MarketIntelView({ logs, inquiries = [], guests = [] }: MarketIntelProps) {
  
  // 1. DATA AGGREGATION
  const stats = useMemo(() => {
    const revenue = logs.reduce((acc, log) => ({
      upi: acc.upi + Number(log.upiRevenue || 0),
      cash: acc.cash + Number(log.cashRevenue || 0),
      ota: acc.ota + Number(log.otaPayouts || 0),
      total: acc.total + Number(log.totalCollection || 0),
    }), { upi: 0, cash: 0, ota: 0, total: 0 });

    const totalInquiries = inquiries.length || 0;
    const totalCheckouts = guests.length || 0;
    
    // Calculate conversion from lead (inquiry) to paid invoice (checkout)
    const conversionRate = totalInquiries > 0 
      ? ((totalCheckouts / totalInquiries) * 100).toFixed(1) 
      : "0.0";

    return { ...revenue, conversionRate, totalInquiries, totalCheckouts };
  }, [logs, inquiries, guests]);

  // 2. CHART CONFIGURATION
  const chartData = {
    labels: logs.slice(-15).map(l => new Date(l.date).getDate()),
    datasets: [
      {
        label: 'Daily Collection',
        data: logs.slice(-15).map(l => Number(l.totalCollection)),
        borderColor: '#fbbf24',
        backgroundColor: 'rgba(251, 191, 36, 0.05)',
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        borderWidth: 2,
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { display: false },
      y: { display: false }
    }
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* SECTION 1: CONVERSION FUNNEL */}
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400 flex items-center gap-2">
            <Activity size={12} /> Lead Conversion
          </h3>
          <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">
            {stats.conversionRate}% Efficiency
          </span>
        </div>
        
        <div className="flex justify-between items-center relative px-4">
          <FunnelStep icon={MessageSquare} label="Leads" value={stats.totalInquiries} color="text-blue-400" />
          <div className="h-[1px] flex-1 bg-gradient-to-r from-blue-500/20 to-emerald-500/20 mx-4" />
          <FunnelStep icon={UserCheck} label="Checkouts" value={stats.totalCheckouts} color="text-emerald-400" />
        </div>
      </div>

      {/* SECTION 2: REVENUE TREND & SOURCES */}
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-6">
        <div className="flex justify-between items-center mb-4 px-2">
           <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Revenue Intel</h3>
           <TrendingUp size={14} className="text-amber-400" />
        </div>
        <div className="h-40 w-full mb-6">
          <Line data={chartData} options={chartOptions} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <SourceMini icon={CreditCard} label="UPI" value={stats.upi} color="text-blue-400" bg="bg-blue-400/10" />
          <SourceMini icon={Banknote} label="Cash" value={stats.cash} color="text-emerald-400" bg="bg-emerald-400/10" />
          <SourceMini icon={Globe} label="OTA" value={stats.ota} color="text-amber-400" bg="bg-amber-400/10" />
        </div>
      </div>

      {/* SECTION 3: GUEST CHECKOUT HISTORY (The Ledger) */}
      <div className="space-y-4">
        <div className="flex justify-between items-end px-2">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Checkout History</h3>
          <span className="text-[9px] font-bold text-slate-600 uppercase">Verified Invoices</span>
        </div>
        
        <div className="space-y-3">
          {guests.length > 0 ? guests.slice(0, 10).map((guest, idx) => (
            <motion.div 
              key={guest.id || idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-slate-950/40 backdrop-blur-md border border-white/5 p-4 rounded-[2rem] flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-amber-400 border border-white/10">
                  <span className="text-xs font-black">{guest.roomNumber}</span>
                </div>
                <div>
                  <p className="text-sm font-black text-white">{guest.guestName || guest.name}</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1 mt-0.5">
                    <Calendar size={10} /> {new Date(guest.checkoutDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-white">₹{Number(guest.totalAmount).toLocaleString('en-IN')}</p>
                <div className="flex items-center justify-end gap-1">
                   <div className="w-1 h-1 rounded-full bg-emerald-500" />
                   <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Paid</p>
                </div>
              </div>
            </motion.div>
          )) : (
            <div className="text-center py-10 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">No Recent Checkouts</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function FunnelStep({ icon: Icon, label, value, color }: any) {
  return (
    <div className="flex flex-col items-center">
      <div className={`p-4 bg-white/5 rounded-[1.5rem] border border-white/5 mb-2 ${color}`}>
        <Icon size={20} />
      </div>
      <p className="text-lg font-black text-white">{value}</p>
      <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">{label}</p>
    </div>
  );
}

function SourceMini({ icon: Icon, label, value, color, bg }: any) {
  return (
    <div className="bg-white/5 p-3 rounded-3xl border border-white/5">
      <div className={`w-7 h-7 rounded-xl ${bg} ${color} flex items-center justify-center mb-2`}>
        <Icon size={14} />
      </div>
      <p className="text-[8px] font-black text-slate-500 uppercase mb-1">{label}</p>
      <p className="text-xs font-black text-white">₹{(value / 1000).toFixed(1)}k</p>
    </div>
  );
}