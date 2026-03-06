"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, History, Settings, TrendingUp, TrendingDown, 
  Plus, BarChart3, LogOut, Wallet, IndianRupee, PieChart
} from 'lucide-react';

// SERVER ACTIONS
import { getFinancialSummary, getFullHistory, getStaffMembers } from '@/lib/actions/finance';
import { logout } from '@/lib/actions/auth';

// UI COMPONENTS
import { Card } from '@/components/ui/card';
import { SettingsTab } from './dashboard/SettingsTab';
import { DayBookForm } from './DayBookForm';

export default function Dashboard({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dbData, setDbData] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [allStaff, setAllStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // FETCH DATA FROM SERVER
 // Inside your refreshData function in Dashboard.tsx
const refreshData = async () => {
  setLoading(true);
  try {
    const [summary, history, staff] = await Promise.all([
      getFinancialSummary(),
      getFullHistory(),
      // Only fetch staff list if the current user is an admin
      user.role === 'admin' ? getStaffMembers() : Promise.resolve([]) 
    ]);
    
    if (summary.success) setDbData(summary.data);
    setLogs(history || []);
    setAllStaff(staff || []); // This ensures SettingsTab gets the data it needs
  } catch (error) {
    console.error("Data refresh failed:", error);
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
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-32 font-sans">
      {/* HEADER */}
      <header className="p-6 flex justify-between items-center border-b border-white/5 bg-slate-950/50 sticky top-0 z-50 backdrop-blur-xl">
        <div>
          <h1 className="text-xl font-black text-white tracking-tighter uppercase">
            Ethereal <span className="text-amber-400">Inn</span>
          </h1>
          <p className="text-[9px] text-slate-500 font-bold tracking-[0.2em] uppercase mt-0.5">Staff Portal</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black text-white leading-none">{user.name}</p>
            <p className="text-[8px] font-bold text-amber-400 uppercase tracking-widest mt-1">{user.role}</p>
          </div>
          <button 
            onClick={() => logout()} 
            className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all active:scale-90"
          >
            <LogOut size={18}/>
          </button>
        </div>
      </header>

      <main className="px-6 max-w-lg mx-auto mt-8">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <motion.div key="db" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              <div className="rounded-[3rem] bg-gradient-to-br from-slate-800 to-slate-950 p-10 border border-white/10 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                  <IndianRupee size={100} />
                </div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">Monthly Net Profit</p>
                <h2 className="text-5xl font-black text-white mt-4 tracking-tighter">
                  ₹{dbData?.netProfit?.toLocaleString('en-IN') || '0'}
                </h2>
                <div className="mt-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest">
                  <TrendingUp size={12} /> Positive Growth
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <StatCard title="Revenue" value={dbData?.revenue || 0} icon={Wallet} color="text-amber-400" />
                <StatCard title="Expenses" value={dbData?.expenses || 0} icon={TrendingDown} color="text-rose-400" />
              </div>
            </motion.div>
          )}

          {/* TAB 2: AUDIT HISTORY */}
          {activeTab === 'history' && (
            <motion.div key="hist" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <h2 className="text-2xl font-black text-white px-2 tracking-tight">Financial Logs</h2>
              {logs.length > 0 ? logs.map((log) => (
                <div key={log.id} className="bg-slate-900/40 border border-white/5 p-6 rounded-[2.5rem] backdrop-blur-sm group hover:border-amber-400/30 transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white font-black text-lg">
                        {new Date(log.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-widest">Entry by {log.staffName || 'System'}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-amber-400 font-black text-xl tracking-tighter">₹{Number(log.totalCollection).toLocaleString()}</p>
                       <span className="text-[8px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-black uppercase tracking-widest mt-1 inline-block">Audit Passed</span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-24 text-slate-600 font-black uppercase tracking-[0.3em] text-xs">No records available</div>
              )}
            </motion.div>
          )}

          {/* TAB 3: REVENUE ANALYSIS */}
          {activeTab === 'analytics' && (
            <motion.div key="anal" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <h2 className="text-2xl font-black text-white px-2 tracking-tight">Revenue Mix</h2>
              <Card className="bg-slate-900/50 border-white/5 p-10 rounded-[3rem] space-y-10 shadow-2xl backdrop-blur-xl">
                <ProgressBar label="UPI Payments" value={getPercent(analysisStats.upi)} color="bg-amber-400" />
                <ProgressBar label="Direct Cash" value={getPercent(analysisStats.cash)} color="bg-emerald-400" />
                <ProgressBar label="OTA Payouts" value={getPercent(analysisStats.ota)} color="bg-blue-500" />
                <div className="pt-4 border-t border-white/5">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Volume</p>
                    <p className="text-xl font-black text-white">₹{analysisStats.total.toLocaleString()}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* TAB 4: SETTINGS & STAFF (This is where "Add Staff" lives) */}
          {activeTab === 'settings' && (
            <motion.div key="sett" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SettingsTab user={user} allStaff={allStaff} />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* TAB 5: ADD NEW ENTRY (The Revenue/Expense Form) */}
{activeTab === 'add' && (
  <motion.div key="add-form" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
    <div className="mb-6 flex items-center justify-between px-2">
      <h2 className="text-2xl font-black text-white tracking-tight">Add Revenue</h2>
      <button 
        onClick={() => setActiveTab('dashboard')} 
        className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white"
      >
        Cancel
      </button>
    </div>
    <DayBookForm 
      onSuccess={() => { 
        setActiveTab('dashboard'); 
        refreshData(); 
      }} 
    />
  </motion.div>
)}

      {/* FLOATING NAVIGATION BAR */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-950/80 border border-white/10 p-2.5 rounded-[3.5rem] flex items-center gap-1 backdrop-blur-3xl shadow-2xl z-50">
        <NavIcon active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={LayoutDashboard} />
        <NavIcon active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={History} />
        
        {/* CENTER ACTION BUTTON */}
        <button 
  onClick={() => setActiveTab('add')} 
  className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all mx-3 active:scale-90 ${
    activeTab === 'add' 
      ? 'bg-white text-slate-950 scale-110' 
      : 'bg-amber-400 text-slate-950 shadow-amber-400/40 hover:bg-amber-300'
  }`}
>
  <Plus size={32} strokeWidth={3} />
</button>
        
        <NavIcon active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon={BarChart3} />
        <NavIcon active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={Settings} />
      </nav>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function NavIcon({ active, onClick, icon: Icon }: any) {
  return (
    <button 
      onClick={onClick} 
      className={`p-4 rounded-full transition-all duration-300 ${
        active ? 'text-amber-400 bg-amber-400/10' : 'text-slate-600 hover:text-slate-400 hover:bg-white/5'
      }`}
    >
      <Icon size={22} />
    </button>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  return (
    <div className="bg-slate-900/40 border border-white/5 p-6 rounded-[2.5rem] backdrop-blur-sm">
      <div className={`w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center mb-4 ${color}`}>
        <Icon size={20} />
      </div>
      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{title}</p>
      <p className="text-xl font-black text-white mt-1 tracking-tighter">₹{value.toLocaleString()}</p>
    </div>
  );
}

function ProgressBar({ label, value, color }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
        <span>{label}</span>
        <span className="text-white bg-white/5 px-2 py-0.5 rounded-md">{value}%</span>
      </div>
      <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-white/5 p-0.5">
        <motion.div 
          initial={{ width: 0 }} 
          animate={{ width: `${value}%` }} 
          transition={{ duration: 1.2, ease: "circOut" }}
          className={`h-full ${color} rounded-full shadow-lg`} 
        />
      </div>
    </div>
  );
}