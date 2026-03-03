"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, History, Settings, TrendingUp, TrendingDown, 
  CheckCircle2, BarChart3, LogOut 
} from 'lucide-react';

// SERVER ACTIONS
import { getFinancialSummary, getFullHistory, getStaffMembers } from '@/lib/actions/finance';
import { logout } from '@/lib/actions/auth';

// UI COMPONENTS
import { Card } from '@/components/ui/card';
import { DayBookForm } from './DayBookForm';
import { StatCard } from './StatCard';
import { SettingsTab } from './dashboard/SettingsTab'; // Import the high-control version

export default function Dashboard({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dbData, setDbData] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [allStaff, setAllStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // FETCH DATA FROM SERVER
  const refreshData = async () => {
    setLoading(true);
    try {
      const [summary, history, staff] = await Promise.all([
        getFinancialSummary(),
        getFullHistory(),
        getStaffMembers()
      ]);
      
      if (summary.success) setDbData(summary.data);
      setLogs(history || []);
      setAllStaff(staff || []);
    } catch (error) {
      console.error("Dashboard refresh error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refreshData(); }, []);

  // --- ANALYSIS LOGIC ---
  const analysisStats = useMemo(() => {
    if (!logs.length) return { upi: 0, cash: 0, ota: 0, total: 0 };
    return logs.reduce((acc, log) => {
      acc.upi += Number(log.upiRevenue || 0);
      acc.cash += Number(log.cashRevenue || 0);
      acc.ota += Number(log.otaPayouts || 0);
      acc.total += Number(log.totalCollection || 0);
      return acc;
    }, { upi: 0, cash: 0, ota: 0, total: 0 });
  }, [logs]);

  const getPercent = (val: number) => (analysisStats.total > 0 ? Math.round((val / analysisStats.total) * 100) : 0);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-32">
      {/* HEADER */}
      <header className="p-6 flex justify-between items-center border-b border-white/5 bg-slate-950/50 sticky top-0 z-50 backdrop-blur-md">
        <h1 className="text-xl font-bold text-white tracking-tight">
          Ethereal <span className="text-amber-400">Inn</span>
        </h1>
        <button 
          onClick={() => logout()} 
          className="p-2.5 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all"
        >
          <LogOut size={18}/>
        </button>
      </header>

      <main className="px-6 max-w-lg mx-auto mt-8">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <motion.div key="db" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              <div className="rounded-[2.5rem] bg-gradient-to-br from-slate-800 to-slate-950 p-8 border border-white/5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <TrendingUp size={80} />
                </div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Net Profit Breakdown</p>
                <h2 className="text-5xl font-black text-white mt-2 tracking-tighter">
                  ₹{dbData?.netProfit?.toLocaleString('en-IN') || '0'}
                </h2>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <StatCard title="Revenue" value={dbData?.revenue || 0} icon={TrendingUp} trend="up" change="Live" />
                <StatCard title="Expenses" value={dbData?.expenses || 0} icon={TrendingDown} trend="down" change="Petty" />
              </div>
            </motion.div>
          )}

          {/* TAB 2: AUDIT HISTORY */}
          {activeTab === 'history' && (
            <motion.div key="hist" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <h2 className="text-2xl font-black text-white px-2">Audit History</h2>
              {logs.length > 0 ? logs.map((log) => (
                <Card key={log.id} className="bg-slate-900/40 border-slate-800/50 p-5 rounded-[2rem] hover:border-amber-400/30 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white font-bold">
                        {new Date(log.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' })}
                      </p>
                      <p className="text-[10px] text-amber-400 font-bold uppercase mt-1 tracking-widest">By: {log.staffName || 'System'}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-emerald-400 font-black">₹{Number(log.totalCollection).toLocaleString()}</p>
                       <p className="text-[9px] text-slate-500 uppercase mt-1">Confirmed</p>
                    </div>
                  </div>
                </Card>
              )) : (
                <div className="text-center py-20 text-slate-600 font-bold">No records found</div>
              )}
            </motion.div>
          )}

          {/* TAB 3: REVENUE ANALYSIS */}
          {activeTab === 'analytics' && (
            <motion.div key="anal" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <h2 className="text-2xl font-black text-white px-2">Revenue Mix</h2>
              <Card className="bg-slate-900/50 border-slate-800 p-8 rounded-[2.5rem] space-y-8 shadow-2xl border-white/5">
                <ProgressBar label="UPI Payments" value={getPercent(analysisStats.upi)} color="bg-amber-400" />
                <ProgressBar label="Direct Cash" value={getPercent(analysisStats.cash)} color="bg-emerald-400" />
                <ProgressBar label="OTA Payouts" value={getPercent(analysisStats.ota)} color="bg-blue-500" />
              </Card>
            </motion.div>
          )}

          {/* TAB 4: SETTINGS & STAFF (Full Control) */}
          {activeTab === 'settings' && (
            <motion.div key="sett" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SettingsTab user={user} allStaff={allStaff} />
            </motion.div>
          )}

          {/* TAB 5: ADD NEW ENTRY */}
          {activeTab === 'add' && (
            <DayBookForm 
              onSuccess={() => { 
                setActiveTab('dashboard'); 
                refreshData(); 
              }} 
            />
          )}

        </AnimatePresence>
      </main>

      {/* FLOATING NAVIGATION BAR */}
      <nav className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-950/90 border border-white/10 p-2.5 rounded-[3rem] flex items-center gap-1 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50">
        <NavIcon active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={LayoutDashboard} />
        <NavIcon active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={History} />
        
        {/* CENTER ACTION BUTTON */}
        <button 
          onClick={() => setActiveTab('add')} 
          className="w-16 h-16 bg-amber-400 rounded-full flex items-center justify-center text-slate-950 shadow-[0_0_20px_rgba(251,191,36,0.3)] mx-2 active:scale-90 transition-transform hover:bg-amber-300"
        >
          <CheckCircle2 size={28} />
        </button>
        
        <NavIcon active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon={BarChart3} />
        <NavIcon active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={Settings} />
      </nav>
    </div>
  );
}

// --- SUB-COMPONENTS & HELPERS ---

function NavIcon({ active, onClick, icon: Icon }: any) {
  return (
    <button 
      onClick={onClick} 
      className={`p-4 rounded-full transition-all duration-300 ${
        active ? 'text-amber-400 bg-amber-400/10' : 'text-slate-600 hover:text-slate-400'
      }`}
    >
      <Icon size={20} />
    </button>
  );
}

function ProgressBar({ label, value, color }: any) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
        <span>{label}</span>
        <span className="text-white">{value}%</span>
      </div>
      <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-white/5">
        <motion.div 
          initial={{ width: 0 }} 
          animate={{ width: `${value}%` }} 
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full ${color} shadow-[0_0_10px_rgba(251,191,36,0.2)]`} 
        />
      </div>
    </div>
  );
}