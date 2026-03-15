"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, History, Settings, TrendingUp, TrendingDown, 
  Plus, BarChart3, LogOut, Wallet, Activity, Zap, CheckCircle2,
  DoorOpen 
} from 'lucide-react';

// SERVER ACTIONS & COMPONENTS
import { 
  getFinancialSummary, 
  getFullHistory, 
  getStaffMembers,
  getReportData 
} from '@/lib/actions/finance';
import { logout } from '@/lib/actions/auth';
import { SettingsTab } from './dashboard/SettingsTab';
import { DayBookForm } from './DayBookForm';
import RoomOccupancyClient from '@/app/(staff)/occupancy/RoomOccupancyClient';
import ReportView from "@/components/dashboard/ReportView";
import { getRoomsList } from '@/lib/actions/room-actions';

interface DashboardProps {
  user: { id: string | number; name: string; role: string; email?: string; };
}

// Define interface for better type safety during build
interface FinancialLog {
  id: number | string;
  date: string;
  totalCollection: number | string;
  roomRevenue: number | string;
  cashRevenue: number | string;
  upiRevenue: number | string;
  otaPayouts: number | string;
  pettyExpenses: number | string;
  serviceRevenue?: number | string;
  staffName?: string;
}

export default function Dashboard({ user }: DashboardProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [dbData, setDbData] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [allStaff, setAllStaff] = useState<any[]>([]);
  const [roomsFromState, setRoomsFromState] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [currentName, setCurrentName] = useState(user?.name || "User");

  const [reportLogs, setReportLogs] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  const isAdmin = useMemo(() => {
    if (!user || !user.role) return false;
    const r = user.role.toLowerCase().trim(); 
    return r === 'admin' || r === 'manager' || r === 'owner';
  }, [user?.role]);

  // --- DATA NORMALIZATION ---
  const normalizeData = (data: any[]) => {
    return data.map(item => ({
      ...item,
      totalCollection: Number(item.totalCollection || 0),
      roomRevenue: Number(item.roomRevenue || 0),
      cashRevenue: Number(item.cashRevenue || 0),
      upiRevenue: Number(item.upiRevenue || 0),
      otaPayouts: Number(item.otaPayouts || 0),
      pettyExpenses: Number(item.pettyExpenses || 0),
    }));
  };

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const [summary, history, staff, rooms] = await Promise.all([
        getFinancialSummary(period),
        getFullHistory(),
        isAdmin ? getStaffMembers() : Promise.resolve([]),
        getRoomsList() 
      ]);
      
      if (summary.success) setDbData(summary.data);
      
      const cleanHistory = history ? normalizeData(history) : [];
      setLogs(cleanHistory);
      
      setAllStaff(staff || []); 
      setRoomsFromState(rooms || []);
    } catch (error) {
      console.error("Refresh failed", error);
    } finally {
      setLoading(false);
    }
  }, [period, isAdmin]);

  const refreshRooms = async () => {
    const rooms = await getRoomsList();
    setRoomsFromState(rooms || []);
  };

  useEffect(() => {
    if (activeTab === "analytics") {
      const fetchReports = async () => {
        setLoadingReports(true);
        try {
          const data = await getReportData(period);
          setReportLogs(data ? normalizeData(data) : []);
        } catch (error) {
          console.error("Failed to fetch reports", error);
        } finally {
          setLoadingReports(false);
        }
      };
      fetchReports();
    }
  }, [activeTab, period]);

  useEffect(() => { 
    refreshData(); 
  }, [refreshData]);

  const liveInsights = useMemo(() => {
    if (!logs.length) return { upi: 0, cash: 0, ota: 0, total: 0, avgEntry: 0, roomRev: 0, serviceRev: 0, todayPerformance: "0" };
    
    const stats = logs.reduce((acc, log) => {
      acc.upi += log.upiRevenue;
      acc.cash += log.cashRevenue;
      acc.ota += log.otaPayouts;
      acc.total += log.totalCollection;
      acc.roomRev += log.roomRevenue; 
      acc.serviceRev += Number(log.serviceRevenue || 0);
      return acc;
    }, { upi: 0, cash: 0, ota: 0, total: 0, roomRev: 0, serviceRev: 0 });

    const avg = stats.total / logs.length;
    return {
      ...stats,
      avgEntry: avg,
      todayPerformance: logs[0] ? ((logs[0].totalCollection / avg) * 100).toFixed(0) : "0"
    };
  }, [logs]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-40 font-sans selection:bg-amber-400 selection:text-black">
      <header className="p-6 flex justify-between items-center border-b border-white/5 bg-slate-950/60 sticky top-0 z-50 backdrop-blur-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center text-slate-950 shadow-lg shadow-amber-400/20">
            <Zap size={20} strokeWidth={3} />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tighter uppercase leading-none">
              Ethereal <span className="text-amber-400 italic">Inn</span>
            </h1>
            <p className="text-[8px] text-emerald-500 font-bold tracking-[0.2em] uppercase mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> {isAdmin ? 'Admin Console' : 'Staff Portal'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black text-white leading-none">{currentName}</p>
            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">{user.role}</p>
          </div>
          <button onClick={() => logout()} className="p-3 bg-white/5 text-slate-400 rounded-2xl hover:bg-rose-500/10 hover:text-rose-500 transition-all border border-white/5">
            <LogOut size={18}/>
          </button>
        </div>
      </header>

      <main className="px-6 max-w-lg mx-auto mt-8">
        <AnimatePresence mode="wait">
          
          {activeTab === 'dashboard' && (
            <motion.div key="db" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              {isAdmin && (
                <div className="flex bg-slate-950/50 p-1.5 rounded-2xl border border-white/5 gap-1 shadow-inner">
                  {['month', 'quarter', 'year'].map((p) => (
                    <button key={p} onClick={() => setPeriod(p as any)} className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${period === p ? 'bg-amber-400 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                      {p}
                    </button>
                  ))}
                </div>
              )}

              <div className="rounded-[3rem] bg-slate-900 border border-white/10 p-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-400/10 blur-[80px] rounded-full" />
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">
                      {isAdmin ? `${period}ly Net Profit` : "Shift Status"}
                    </p>
                    {isAdmin ? (
                      <h2 className="text-5xl font-black text-white mt-3 tracking-tighter">
                        ₹{Number(dbData?.netProfit || 0).toLocaleString('en-IN')}
                      </h2>
                    ) : (
                      <div className="flex items-center gap-3 mt-4 text-emerald-400">
                        <CheckCircle2 size={32} />
                        <h2 className="text-2xl font-black uppercase tracking-tight text-white">Active</h2>
                      </div>
                    )}
                  </div>
                  {isAdmin && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-2xl text-emerald-400">
                      <TrendingUp size={24} />
                    </div>
                  )}
                </div>
                {isAdmin && (
                  <div className="mt-8 grid grid-cols-2 gap-4 border-t border-white/5 pt-6 relative z-10">
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Efficiency</p>
                      <p className="text-lg font-black text-white">{liveInsights.todayPerformance}% <span className="text-[10px] text-slate-600 font-bold">vs Avg</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Avg Ticket</p>
                      <p className="text-lg font-black text-white">₹{Math.round(liveInsights.avgEntry).toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>
              {isAdmin && (
                <div className="grid grid-cols-2 gap-4">
                  <StatCard title="Total Rev" value={Number(dbData?.revenue || 0)} icon={Wallet} color="text-amber-400" />
                  <StatCard title="Expenses" value={Number(dbData?.expenses || 0)} icon={TrendingDown} color="text-rose-400" />
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'occupancy' && (
            <motion.div key="occ" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="space-y-6">
              <div className="flex justify-between items-center px-2">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight italic uppercase">Inventory</h2>
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">Live Room Management</p>
                </div>
                <div className="bg-emerald-500/10 p-2 rounded-xl">
                  <Activity size={18} className="text-emerald-500" />
                </div>
              </div>
              <div className="bg-slate-900/40 rounded-[3rem] border border-white/5 p-4 overflow-hidden shadow-2xl">
                <RoomOccupancyClient initialRooms={roomsFromState} onRoomUpdate={refreshRooms} /> 
              </div>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div key="hist" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="flex justify-between items-center px-2">
                <h2 className="text-2xl font-black text-white tracking-tight italic uppercase">Audit Trail</h2>
                <History size={20} className="text-slate-700" />
              </div>
              {logs.length > 0 ? logs.map((log) => (
                <div key={log.id} className="bg-slate-900/30 border border-white/5 p-5 rounded-[2.5rem] group hover:bg-slate-900/60 transition-all">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-950 rounded-2xl flex flex-col items-center justify-center border border-white/5">
                        <span className="text-[10px] font-black text-amber-400 leading-none">{new Date(log.date).toLocaleDateString('en-IN', { day: '2-digit' })}</span>
                        <span className="text-[8px] font-bold text-slate-600 uppercase mt-1">{new Date(log.date).toLocaleDateString('en-IN', { month: 'short' })}</span>
                      </div>
                      <div>
                        <p className="text-white font-black text-sm">₹{log.totalCollection.toLocaleString()}</p>
                        <div className="flex gap-2 mt-1">
                           <span className="text-[7px] bg-white/5 px-1.5 py-0.5 rounded text-slate-400 font-bold uppercase">Room: ₹{log.roomRevenue}</span>
                           <span className="text-[7px] bg-white/5 px-1.5 py-0.5 rounded text-slate-400 font-bold uppercase">Cash: ₹{log.cashRevenue}</span>
                        </div>
                        <p className="text-[9px] text-slate-500 font-bold uppercase mt-1 tracking-tighter">Verified by {log.staffName || 'Admin'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-24 text-slate-600 font-black uppercase tracking-[0.3em] text-[10px]">No logs found</div>
              )}
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div key="anal" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-6 pb-12">
              {isAdmin ? (
                <>
                  {loadingReports ? (
                    <div className="py-24 text-center text-slate-500 font-black uppercase tracking-widest text-[10px] animate-pulse">
                      Generating Intelligence...
                    </div>
                  ) : (
                    <ReportView logs={reportLogs} />
                  )}
                </>
              ) : (
                <div className="py-24 text-center">
                  <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Analytics restricted to Admin</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div key="sett" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SettingsTab 
                user={{ ...user, name: currentName }} 
                allStaff={allStaff} 
                onNameChange={(newName) => setCurrentName(newName)}
              />
            </motion.div>
          )}

          {activeTab === 'add' && (
            <motion.div key="add-form" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <div className="mb-6 flex items-center justify-between px-2">
                <h2 className="text-2xl font-black text-white tracking-tight italic uppercase">New Entry</h2>
                <button onClick={() => setActiveTab('dashboard')} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl text-slate-500">
                  <LogOut size={18} className="rotate-180" />
                </button>
              </div>
              <DayBookForm onSuccess={() => { setActiveTab('dashboard'); refreshData(); }} />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-950/90 border border-white/10 p-2 rounded-[3.5rem] flex items-center gap-1 backdrop-blur-3xl shadow-2xl z-50 min-w-[340px] justify-between">
        <NavIcon active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={LayoutDashboard} />
        <NavIcon active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={History} />
        <NavIcon active={activeTab === 'occupancy'} onClick={() => setActiveTab('occupancy')} icon={DoorOpen} />

        <button onClick={() => setActiveTab('add')} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all mx-1 active:scale-90 ${activeTab === 'add' ? 'bg-white text-slate-950 scale-110' : 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20'}`}>
          <Plus size={28} strokeWidth={3} />
        </button>

        <NavIcon active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon={BarChart3} />
        <NavIcon active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={Settings} />
      </nav>
    </div>
  );
}

// --- SUB-COMPONENTS ---
function NavIcon({ active, onClick, icon: Icon }: { active: boolean, onClick: () => void, icon: any }) {
  return (
    <button onClick={onClick} className={`p-4 rounded-full transition-all duration-300 ${active ? 'text-amber-400 bg-amber-400/10' : 'text-slate-600 hover:text-white hover:bg-white/5'}`}>
      <Icon size={20} />
    </button>
  );
}

function StatCard({ title, value, icon: Icon, color }: { title: string, value: number, icon: any, color: string }) {
  return (
    <div className="bg-slate-900 border border-white/5 p-6 rounded-[2.5rem]">
      <div className={`w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center mb-3 ${color}`}><Icon size={18} /></div>
      <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{title}</p>
      <p className="text-xl font-black text-white mt-1">₹{value.toLocaleString('en-IN')}</p>
    </div>
  );
}