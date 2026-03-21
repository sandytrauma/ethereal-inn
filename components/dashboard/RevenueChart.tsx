"use client";

import React, { useState, useMemo, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  TrendingUp, 
  UserCheck, 
  MessageSquare, 
  Calendar, 
  Activity,
  CreditCard,
  Banknote,
  Globe,
  ArrowUpRight,
  X,
  CheckCircle2,
  Phone,
  Clock,
  Zap,
  Loader2,
  Archive
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
import { updateInquiryStatus, deleteInquiry } from '@/lib/actions/finance';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend);

interface MarketIntelProps {
  logs: any[];
  inquiries: any[];
  guests: any[];
  tasks: any[]; 
}

export default function MarketIntelView({ logs = [], inquiries = [], guests = [], tasks = [] }: MarketIntelProps) {
  const router = useRouter();
  const [showLeadsModal, setShowLeadsModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  // --- ACTION HANDLERS ---
  async function handleStatusUpdate(id: number, newStatus: string, guestName: string) {
    setIsUpdating(id);
    try {
      const res = await updateInquiryStatus(id, newStatus);
      if (res?.success) {
        if (newStatus === 'in-house') {
          // FIX: Strict fallback to prevent 'undefined' string in URL
          const safeName = guestName && guestName !== "undefined" ? guestName : "Walk-In";
          
          startTransition(() => {
            router.push(`/occupancy?prefillGuest=${encodeURIComponent(safeName)}`);
          });
        }
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setIsUpdating(null);
    }
  }

  async function handleArchive(id: number) {
    if (!confirm("Are you sure you want to archive this inquiry?")) return;
    setIsUpdating(id);
    try {
      await deleteInquiry(id);
    } catch (error) {
      console.error("Failed to delete inquiry:", error);
    } finally {
      setIsUpdating(null);
    }
  }
  
  // 1. DATA AGGREGATION
  const stats = useMemo(() => {
    const revenue = (logs || []).reduce((acc, log) => ({
      upi: acc.upi + Number(log.upiRevenue || 0),
      cash: acc.cash + Number(log.cashRevenue || 0),
      ota: acc.ota + Number(log.otaPayouts || 0),
      total: acc.total + Number(log.totalCollection || 0),
    }), { upi: 0, cash: 0, ota: 0, total: 0 });

    const totalInquiries = inquiries?.length || 0;
    const pendingInquiries = (inquiries || []).filter(i => i.status === 'pending').length;
    const totalCheckouts = guests?.length || 0;
    
    const conversionRate = totalInquiries > 0 
      ? ((totalCheckouts / totalInquiries) * 100).toFixed(1) 
      : "0.0";

    return { ...revenue, conversionRate, totalInquiries, pendingInquiries, totalCheckouts };
  }, [logs, inquiries, guests]);

  // 2. CHART CONFIGURATION
  const chartData = {
    labels: (logs || []).slice(-15).map(l => new Date(l.date).getDate()),
    datasets: [{
      label: 'Daily Collection',
      data: (logs || []).slice(-15).map(l => Number(l.totalCollection || 0)),
      borderColor: '#fbbf24',
      backgroundColor: 'rgba(251, 191, 36, 0.05)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#fbbf24',
      borderWidth: 3,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { 
      x: { display: false }, 
      y: { 
        display: false,
        beginAtZero: true 
      } 
    }
  };

  return (
    <div className="space-y-6 pb-24">
      
      {/* SECTION 1: CONVERSION FUNNEL */}
      <motion.div 
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowLeadsModal(true)}
        className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-6 cursor-pointer group transition-all relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <Zap size={80} className="text-amber-400" />
        </div>

        <div className="flex justify-between items-center mb-8">
          <div className="space-y-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400 flex items-center gap-2">
              <Activity size={12} /> Lead Intelligence
            </h3>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Market Conversion Funnel</p>
          </div>
          <span className="text-[10px] font-black text-amber-400 bg-amber-400/10 px-3 py-1.5 rounded-full border border-amber-400/20 flex items-center gap-2">
            {stats.pendingInquiries} New Leads <ArrowUpRight size={12} />
          </span>
        </div>
        
        <div className="flex justify-between items-center relative px-4">
          <FunnelStep icon={MessageSquare} label="Inquiries" value={stats.totalInquiries} color="text-blue-400" />
          
          <div className="flex flex-col items-center flex-1 mx-4">
             <div className="px-3 py-1 bg-white/5 rounded-full border border-white/5 mb-2">
                <span className="text-[9px] font-black text-amber-500 uppercase italic tracking-tighter">{stats.conversionRate}% Conv.</span>
             </div>
             <div className="h-[2px] w-full bg-gradient-to-r from-blue-500/20 via-amber-500/60 to-emerald-500/20 rounded-full" />
          </div>

          <FunnelStep icon={UserCheck} label="Checkouts" value={stats.totalCheckouts} color="text-emerald-400" />
        </div>
      </motion.div>

      {/* SECTION 2: REVENUE TREND */}
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6 px-2">
           <div className="space-y-1">
             <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Revenue Analysis</h3>
             <p className="text-[9px] font-bold text-amber-400/60 uppercase">15-Day Collection Trend</p>
           </div>
           <TrendingUp size={16} className="text-amber-400" />
        </div>

        <div className="h-44 w-full mb-8">
          <Line data={chartData} options={chartOptions} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <SourceMini icon={CreditCard} label="UPI" value={stats.upi} color="text-blue-400" bg="bg-blue-400/10" />
          <SourceMini icon={Banknote} label="CASH" value={stats.cash} color="text-emerald-400" bg="bg-emerald-400/10" />
          <SourceMini icon={Globe} label="OTA" value={stats.ota} color="text-amber-400" bg="bg-amber-400/10" />
        </div>
      </div>

      {/* SECTION 3: RECENT VERIFIED CHECKOUTS */}
      <div className="space-y-4">
        <div className="flex justify-between items-end px-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Verified History</h3>
          <span className="text-[9px] font-bold text-slate-600 uppercase italic">Latest 5 Invoices</span>
        </div>
        
        <div className="space-y-3 px-1">
          {guests && guests.length > 0 ? guests.slice(0, 5).map((guest, idx) => (
            <motion.div 
              key={guest.id || idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-slate-950/40 backdrop-blur-md border border-white/5 p-4 rounded-[2rem] flex items-center justify-between group hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-amber-400 border border-white/10 font-black text-sm group-hover:scale-105 transition-transform">
                  {guest.roomNumber}
                </div>
                <div>
                  <p className="text-sm font-black text-white">{guest.guestName || "Guest"}</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1.5 mt-1">
                    <Calendar size={10} className="text-amber-500/50" /> 
                    {new Date(guest.checkoutDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-white">₹{Number(guest.totalAmount || 0).toLocaleString('en-IN')}</p>
                <div className="text-[8px] font-black text-emerald-500 uppercase tracking-widest flex items-center justify-end gap-1.5 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Finalized
                </div>
              </div>
            </motion.div>
          )) : (
            <div className="text-center py-12 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">No Recent Activity</p>
            </div>
          )}
        </div>
      </div>

      {/* --- LEADS MODAL --- */}
      <AnimatePresence>
        {showLeadsModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-3xl flex items-end sm:items-center justify-center"
          >
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              className="w-full max-w-xl bg-[#020617] border-t border-white/10 rounded-t-[3.5rem] sm:rounded-[3.5rem] overflow-hidden max-h-[90vh] flex flex-col shadow-2xl"
            >
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Market Inquiries</h3>
                  <p className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em]">{stats.pendingInquiries} Opportunities Found</p>
                </div>
                <button 
                  onClick={() => setShowLeadsModal(false)} 
                  className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 hover:bg-rose-500/20 hover:text-rose-500 transition-all border border-white/5"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                {inquiries && inquiries.length > 0 ? inquiries.map((lead, idx) => (
                  <motion.div 
                    key={lead.id || idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white/[0.03] border border-white/5 rounded-[2.5rem] p-6 space-y-5 shadow-xl hover:border-amber-400/20 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-400/10 flex items-center justify-center text-amber-400 border border-amber-400/20">
                            <MessageSquare size={20} />
                        </div>
                        <div>
                            <h4 className="text-white font-black uppercase text-sm tracking-tight">{lead.name || "Anonymous"}</h4>
                            <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1.5"><Phone size={10} /> {lead.phone}</span>
                            <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5">
                                <Clock size={10} /> 
                                {lead.createdAt ? new Date(lead.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently"}
                            </span>
                            </div>
                        </div>
                      </div>
                      <div className="bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20 text-[8px] font-black text-blue-400 uppercase tracking-widest">
                        {lead.status || 'Pending'}
                      </div>
                    </div>

                    <div className="bg-black/40 rounded-3xl p-5 border border-white/5">
                        <p className="text-[12px] leading-relaxed text-slate-400 italic font-medium">
                          "{lead.message || "Customer is requesting room rates and availability for a future stay."}"
                        </p>
                    </div>

                    <div className="flex gap-3">
                      <button 
                        disabled={isUpdating === lead.id}
                        onClick={() => handleStatusUpdate(lead.id, 'in-house', lead.name || "Guest")}
                        className="flex-2 grow bg-amber-400 text-slate-950 py-4 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-amber-400/20 disabled:opacity-50"
                      >
                        {isUpdating === lead.id ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : (
                          <CheckCircle2 size={16} />
                        )}
                        Mark as In-House
                      </button>
                      <button 
                        disabled={isUpdating === lead.id}
                        onClick={() => handleArchive(lead.id)}
                        className="flex-1 bg-white/5 text-slate-400 py-4 rounded-2xl text-[10px] font-black uppercase hover:bg-rose-500/10 hover:text-rose-500 transition-all border border-white/5 flex items-center justify-center gap-2"
                      >
                        {isUpdating === lead.id ? (
                          <Loader2 className="animate-spin" size={14} />
                        ) : (
                          <Archive size={14} />
                        )}
                        Archive
                      </button>
                    </div>
                  </motion.div>
                )) : (
                  <div className="py-20 text-center">
                    <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-white/5">
                        <MessageSquare size={24} className="text-slate-700" />
                    </div>
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">No Inquiries Found</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- REUSABLE SUB-COMPONENTS ---

function FunnelStep({ icon: Icon, label, value, color }: any) {
  return (
    <div className="flex flex-col items-center group">
      <div className={`p-5 bg-white/5 rounded-[2rem] border border-white/5 mb-3 ${color} shadow-inner group-hover:scale-110 transition-transform duration-500`}>
        <Icon size={24} />
      </div>
      <p className="text-2xl font-black text-white italic tracking-tighter">{value}</p>
      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5">{label}</p>
    </div>
  );
}

function SourceMini({ icon: Icon, label, value, color, bg }: any) {
  return (
    <div className="bg-white/5 p-4 rounded-[2rem] border border-white/5 shadow-xl hover:bg-white/[0.07] transition-colors group">
      <div className={`w-8 h-8 rounded-xl ${bg} ${color} flex items-center justify-center mb-3 group-hover:rotate-12 transition-transform`}>
        <Icon size={16} />
      </div>
      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-sm font-black text-white">₹{(Number(value || 0) / 1000).toFixed(1)}k</p>
    </div>
  );
}