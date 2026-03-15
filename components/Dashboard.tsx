"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, History, Settings, TrendingUp, TrendingDown, 
  Plus, BarChart3, LogOut, Wallet, Activity, Zap, CheckCircle2,
  DoorOpen, LineChart
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
import DashboardBackground from './dashboard/DashboardBackground';
import MarketIntelView from './dashboard/RevenueChart';

interface DashboardProps {
  user: { id: string | number; name: string; role: string; email?: string; };
}

export default function Dashboard({ user }: DashboardProps) {
  // Tabs: dashboard, history, occupancy, intel, analytics, settings, add
  const [activeTab, setActiveTab] = useState('dashboard');
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [dbData, setDbData] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [allStaff, setAllStaff] = useState<any[]>([]);
  const [roomsFromState, setRoomsFromState] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [currentName, setCurrentName] = useState(user?.name || "User");

  // NEW: Expanded state for Intel View
  const [intelData, setIntelData] = useState<{
    logs: any[],
    inquiries: any[],
    guests: any[],
    tasks: any[]
  }>({ logs: [], inquiries: [], guests: [], tasks: [] });
  
  const [loadingReports, setLoadingReports] = useState(false);

  const isAdmin = useMemo(() => {
    if (!user || !user.role) return false;
    const r = user.role.toLowerCase().trim(); 
    return ['admin', 'manager', 'owner'].includes(r);
  }, [user?.role]);

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

  // EFFECT: Fetching multi-table report data for Intel/Analytics
  useEffect(() => {
    if (activeTab === "analytics" || activeTab === "intel") {
      const fetchReports = async () => {
        setLoadingReports(true);
        try {
          const response = await getReportData(period);
          if (response.success) {
            setIntelData({
              logs: normalizeData(response.logs),
              inquiries: response.inquiries || [],
              guests: response.guests || [],
              tasks: response.tasks || []
            });
          }
        } catch (error) {
          console.error("Failed to fetch reports", error);
        } finally {
          setLoadingReports(false);
        }
      };
      fetchReports();
    }
  }, [activeTab, period]);

  useEffect(() => { refreshData(); }, [refreshData]);

  const liveInsights = useMemo(() => {
    if (!logs.length) return { total: 0, avgEntry: 0, todayPerformance: "0" };
    const total = logs.reduce((acc, log) => acc + log.totalCollection, 0);
    const avg = total / logs.length;
    return {
      total,
      avgEntry: avg,
      todayPerformance: logs[0] ? ((logs[0].totalCollection / avg) * 100).toFixed(0) : "0"
    };
  }, [logs]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-transparent text-slate-200 pb-44 font-sans selection:bg-amber-400 selection:text-black">
      <DashboardBackground />
      
      <header className="p-6 flex justify-between items-center border-b border-white/5 bg-slate-950/40 sticky top-0 z-50 backdrop-blur-xl">
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
                <div className="flex bg-slate-950/20 backdrop-blur-md p-1.5 rounded-2xl border border-white/5 gap-1">
                  {['month', 'quarter', 'year'].map((p) => (
                    <button key={p} onClick={() => setPeriod(p as any)} className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${period === p ? 'bg-amber-400 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                      {p}
                    </button>
                  ))}
                </div>
              )}

              <div className="rounded-[3rem] bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-400/10 blur-[80px] rounded-full" />
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">{isAdmin ? `${period}ly Net Profit` : "Shift Status"}</p>
                    {isAdmin ? (
                      <h2 className="text-5xl font-black text-white mt-3 tracking-tighter">₹{Number(dbData?.netProfit || 0).toLocaleString('en-IN')}</h2>
                    ) : (
                      <div className="flex items-center gap-3 mt-4 text-emerald-400">
                        <CheckCircle2 size={32} />
                        <h2 className="text-2xl font-black uppercase tracking-tight text-white">Active</h2>
                      </div>
                    )}
                  </div>
                  {isAdmin && <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-2xl text-emerald-400"><TrendingUp size={24} /></div>}
                </div>
                {isAdmin && (
                  <div className="mt-8 grid grid-cols-2 gap-4 border-t border-white/5 pt-6 relative z-10">
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Efficiency</p>
                      <p className="text-lg font-black text-white">{liveInsights.todayPerformance}%</p>
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
            <motion.div key="occ" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="bg-white/[0.02] backdrop-blur-xl rounded-[3rem] border border-white/5 p-4 shadow-2xl">
                <RoomOccupancyClient initialRooms={roomsFromState} onRoomUpdate={refreshRooms} /> 
              </div>
            </motion.div>
          )}

          {activeTab === 'intel' && (
            <motion.div key="intel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              {loadingReports ? (
                <div className="h-64 flex items-center justify-center text-slate-500 animate-pulse font-black uppercase text-[10px]">
                  Analyzing Market Data...
                </div>
              ) : (
                <MarketIntelView 
                  logs={intelData.logs} 
                  inquiries={intelData.inquiries} 
                  guests={intelData.guests}
                  tasks={intelData.tasks} 
                />
              )}
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div key="hist" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="bg-white/[0.03] backdrop-blur-lg border border-white/5 p-5 rounded-[2.5rem] hover:bg-white/[0.05] transition-all">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-950/60 rounded-2xl flex flex-col items-center justify-center border border-white/5 text-amber-400">
                        <span className="text-[10px] font-black">{new Date(log.date).getDate()}</span>
                        <span className="text-[8px] font-bold uppercase">{new Date(log.date).toLocaleDateString('en-IN', { month: 'short' })}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-black text-sm">₹{log.totalCollection.toLocaleString()}</p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">Verified by {log.staffName || 'Admin'}</p>
                      </div>
                   </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div key="anal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {isAdmin ? (
                loadingReports ? (
                   <div className="h-64 flex items-center justify-center text-slate-500 animate-pulse font-black uppercase text-[10px]">Processing Reports...</div>
                ) : (
                  <ReportView logs={intelData.logs} />
                )
              ) : (
                <div className="text-center py-20 text-slate-500 font-black uppercase text-xs">Admin Only</div>
              )}
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div key="sett" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <SettingsTab user={{ ...user, name: currentName }} allStaff={allStaff} onNameChange={setCurrentName} />
            </motion.div>
          )}

          {activeTab === 'add' && (
            <motion.div key="add-form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="bg-white/[0.03] backdrop-blur-3xl rounded-[3rem] border border-white/10 p-6 shadow-2xl">
                <DayBookForm onSuccess={() => { setActiveTab('dashboard'); refreshData(); }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* RE-DESIGNED 6-TAB GLASS NAVIGATION */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-[480px] bg-white/[0.05] backdrop-blur-2xl border border-white/10 p-2 rounded-[3.5rem] flex items-center justify-between z-50 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        
        {/* Left Side: Home, History, Occupancy */}
        <div className="flex items-center justify-between flex-[1.5] px-2">
          <NavIcon active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={LayoutDashboard} label="Home" />
          <NavIcon active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={History} label="Audit" />
          <NavIcon active={activeTab === 'occupancy'} onClick={() => setActiveTab('occupancy')} icon={DoorOpen} label="Rooms" />
        </div>

        {/* Center: Action Button */}
        <div className="relative w-14 h-10 flex justify-center items-center">
          <button 
            onClick={() => setActiveTab('add')} 
            className={`absolute -top-11 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90
              ${activeTab === 'add' ? 'bg-white text-slate-950 shadow-white/20' : 'bg-amber-400 text-slate-950 shadow-amber-400/40'} shadow-2xl`}
          >
            <Plus size={28} strokeWidth={3} />
          </button>
        </div>

        {/* Right Side: Intel, Analytics, Settings */}
        <div className="flex items-center justify-between flex-[1.5] px-2">
          <NavIcon active={activeTab === 'intel'} onClick={() => setActiveTab('intel')} icon={LineChart} label="Intel" />
          <NavIcon active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon={BarChart3} label="Data" />
          <NavIcon active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={Settings} label="User" />
        </div>
      </nav>
    </div>
  );
}

function NavIcon({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 group">
      <div className={`p-2 rounded-2xl transition-all duration-300 group-active:scale-90
        ${active ? 'text-amber-400 bg-amber-400/10' : 'text-slate-500 hover:text-slate-300'}`}>
        <Icon size={20} />
      </div>
      <span className={`text-[7px] font-black uppercase tracking-tighter transition-opacity duration-300 ${active ? 'opacity-100 text-amber-400' : 'opacity-0'}`}>
        {label}
      </span>
    </button>
  );
}

function StatCard({ title, value, icon: Icon, color }: { title: string, value: number, icon: any, color: string }) {
  return (
    <div className="bg-white/[0.03] backdrop-blur-lg border border-white/5 p-6 rounded-[2.5rem] shadow-xl">
      <div className={`w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center mb-3 ${color}`}><Icon size={18} /></div>
      <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{title}</p>
      <p className="text-xl font-black text-white mt-1">₹{value.toLocaleString('en-IN')}</p>
    </div>
  );
}