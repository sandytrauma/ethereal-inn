"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  History,
  Settings,
  TrendingUp,
  TrendingDown,
  Plus,
  LogOut,
  Wallet,
  Zap,
  CheckCircle2,
  DoorOpen,
  LineChart,
  ConciergeBell,
  RefreshCcw,
  Clock,
  AlertCircle,
  ChevronDown,
  Globe,
  Database,
  CalendarDays,
} from "lucide-react";

// SERVER ACTIONS & COMPONENTS
import {
  getFinancialSummary,
  getFullHistory,
  getStaffMembers,
  getReportData,
} from "@/lib/actions/finance";
import { logout, switchProperty } from "@/lib/actions/auth";
import { SettingsTab } from "./dashboard/SettingsTab";
import { DayBookForm } from "./DayBookForm";
import RoomOccupancyClient from "@/app/(staff)/occupancy/RoomOccupancyClient";
import { getRoomsList, getLiveReceptionData } from "@/lib/actions/room-actions";
import DashboardBackground from "./dashboard/DashboardBackground";
import MarketIntelView from "./dashboard/RevenueChart";
import { ExportRecordsButton } from "./dashboard/ExportButton";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface DashboardProps {
  user: {
    id: string;
    name: string;
    role: string;
    email: string;
    propertyId?: string;
  };
  properties: Array<{ id: string; name: string }>;
  children?: React.ReactNode;
}

export default function Dashboard({
  user,
  properties = [],
  children,
}: DashboardProps) {
  // --- STATE INITIALIZATION ---
  const [activeTab, setActiveTab] = useState("dashboard");
  const [period, setPeriod] = useState<"month" | "quarter" | "year">("month");
  const [dbData, setDbData] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [allStaff, setAllStaff] = useState<any[]>([]);
  const [roomsFromState, setRoomsFromState] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const [intelData, setIntelData] = useState<{
    logs: any[];
    inquiries: any[];
    guests: any[];
    tasks: any[];
  }>({ logs: [], inquiries: [], guests: [], tasks: [] });

  const [loadingReports, setLoadingReports] = useState(false);

  // --- PERMISSION LOGIC ---
  const isAdmin = useMemo(() => {
    if (!user?.role) return false;
    const r = user.role.toLowerCase().trim();
    return ["admin", "manager", "owner"].includes(r);
  }, [user]);

  // --- PROPERTY SELECTION ---
  // FIXED: Improved normalization to ensure UI updates when user.propertyId changes
  const activePropertyName = useMemo(() => {
    const currentId = user?.propertyId;

    if (!currentId || currentId === "global" || currentId === "") {
      return "EIH Global Portfolio";
    }

    const found = properties.find((p) => p.id === currentId);
    return found ? found.name : "Loading Unit...";
  }, [user?.propertyId, properties]);

  const router = useRouter();

  const handlePropertyChange = async (propertyId: string) => {
    setIsSelectorOpen(false);
    setLoading(true);

    try {
      // 1. Update the session/cookie via Server Action
      const result = await switchProperty(propertyId);

      if (result?.success) {
        // 2. Force Next.js to re-fetch server components/session
        router.refresh();

        // 3. Data will be refreshed by the useEffect watching user.propertyId
      }
    } catch (error) {
      console.error("Property Switch Failed:", error);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  // --- DATA NORMALIZATION ---
  const normalizeData = useCallback((data: any[]) => {
    if (!data) return [];
    return data.map((item) => ({
      ...item,
      totalCollection: Number(item.totalCollection || 0),
      roomRevenue: Number(item.roomRevenue || 0),
      cashRevenue: Number(item.cashRevenue || 0),
      upiRevenue: Number(item.upiRevenue || 0),
      otaPayouts: Number(item.otaPayouts || 0),
      pettyExpenses: Number(item.pettyExpenses || 0),
    }));
  }, []);

  // --- REFRESH LOGIC ---
  const refreshRooms = useCallback(async () => {
    const pid = user?.propertyId || "global";
    const rooms = await getRoomsList(pid);
    setRoomsFromState(rooms || []);
    setLastUpdated(new Date());
  }, [user?.propertyId]);

  const syncReception = useCallback(async () => {
    const pid = user?.propertyId || "global";
    try {
      const res = await getLiveReceptionData(pid);
      if (res.success && res.data) {
        setRoomsFromState(res.data.rooms || []);
        setIntelData((prev) => ({
          ...prev,
          tasks: res.data.tasks || [],
          inquiries: res.data.inquiries || [],
        }));
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error("Sync reception error:", err);
    }
  }, [user?.propertyId]);

  const refreshData = useCallback(async () => {
    // Normalize the ID: If it's "global", set to undefined so the DB doesn't try to filter by a non-UUID string
    const pid = user?.propertyId === "global" ? undefined : user?.propertyId;

    setLoading(true);
    try {
      const [summary, history, staff, rooms] = await Promise.all([
        getFinancialSummary(pid!, period), // pid is now either a valid UUID or undefined
        getFullHistory(pid!),
        isAdmin ? getStaffMembers() : Promise.resolve([]),
        getRoomsList(pid),
      ]);

      if (summary.success) setDbData(summary.data);
      setLogs(history ? normalizeData(history) : []);
      setAllStaff(staff || []);
      setRoomsFromState(rooms || []);
    } catch (error) {
      console.error("Critical Refresh Failure:", error);
    } finally {
      setLoading(false);
    }
  }, [period, isAdmin, normalizeData, user?.propertyId]); // Dependency on user.propertyId ensures refresh on switch

  // --- SIDE EFFECTS ---
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    const pid = user?.propertyId || "global";

    if (activeTab === "reception" || activeTab === "occupancy") {
      syncReception();
      const interval = setInterval(syncReception, 30000);
      return () => clearInterval(interval);
    }

    if (activeTab === "intel") {
      const fetchReports = async () => {
        setLoadingReports(true);
        try {
          const response = await getReportData(pid, period);
          if (response.success) {
            setIntelData({
              logs: normalizeData(response.logs),
              inquiries: response.inquiries || [],
              guests: response.guests || [],
              tasks: response.tasks || [],
            });
          }
        } catch (error) {
          console.error("Failed to fetch reports:", error);
        } finally {
          setLoadingReports(false);
        }
      };
      fetchReports();
    }
  }, [activeTab, period, user?.propertyId, syncReception, normalizeData]);

  const liveInsights = useMemo(() => {
    if (!logs.length) return { total: 0, avgEntry: 0, todayPerformance: "0" };
    const total = logs.reduce((acc, log) => acc + log.totalCollection, 0);
    const avg = total / logs.length;
    return {
      total,
      avgEntry: avg,
      todayPerformance: logs[0]
        ? ((logs[0].totalCollection / (avg || 1)) * 100).toFixed(0)
        : "0",
    };
  }, [logs]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-transparent text-slate-200 pb-32 md:pb-44 font-sans selection:bg-amber-400 selection:text-black overflow-x-hidden">
      <DashboardBackground />

      {/* HEADER WITH PROPERTY SELECTOR */}
      <header className="p-4 md:p-6 flex justify-between items-center border-b border-white/5 bg-slate-950/40 sticky top-0 z-[100] backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center text-slate-950 shadow-lg shadow-amber-400/20">
            <Zap className="w-5 h-5" strokeWidth={3} />
          </div>

          <div className="relative">
            <button
              onClick={() => setIsSelectorOpen(!isSelectorOpen)}
              className="flex flex-col items-start group"
            >
              <h1 className="text-lg md:text-xl font-black text-white flex items-center gap-2 tracking-tighter uppercase leading-none">
                {activePropertyName.split(" ")[0]}{" "}
                <span className="text-amber-400 italic">
                  {activePropertyName.split(" ")[1] || ""}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-amber-400 transition-transform ${isSelectorOpen ? "rotate-180" : ""}`}
                />
              </h1>
              <p className="text-[7px] md:text-[8px] text-emerald-500 font-bold tracking-[0.2em] uppercase mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                {isAdmin ? "Global Drizzle Sync" : "Unit PMS Active"}
              </p>
            </button>

            <AnimatePresence>
              {isSelectorOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 mt-4 w-64 bg-slate-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-2xl z-[110]"
                >
                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => handlePropertyChange("global")}
                      className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl text-left transition-all"
                    >
                      <Globe className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-tight">
                        All Properties
                      </span>
                    </button>
                    <div className="h-px bg-white/5 my-1" />
                    {properties.map((prop) => (
                      <button
                        key={prop.id}
                        onClick={() => handlePropertyChange(prop.id)}
                        className={`w-full flex items-center gap-3 p-3 hover:bg-amber-400/10 rounded-xl text-left transition-all ${user?.propertyId === prop.id ? "bg-amber-400/10" : ""}`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${user?.propertyId === prop.id ? "bg-amber-400" : "bg-slate-600"}`}
                        />
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-tight">
                          {prop.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-6">
  {/* Separate Page Navigation */}
  <nav className="hidden lg:flex items-center gap-2 pr-4 border-r border-white/10">
    <Link 
      href="/occupancy"
      className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-amber-400 hover:bg-amber-400/5 transition-all"
    >
      <DoorOpen className="w-3.5 h-3.5" />
      Occupancy
    </Link>

    <Link 
      href="/pms"
      className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-amber-400 hover:bg-amber-400/5 transition-all"
    >
      <CalendarDays className="w-3.5 h-3.5" />
      PMS
    </Link>
  </nav>

  {/* Actions: Export & Logout */}
  <div className="flex items-center gap-2 pl-2">
    <ExportRecordsButton 
      propertyId={user?.propertyId} 
      label={user?.propertyId === 'global' ? "Portfolio Export" : "Export This Unit"}
    />
    
    <button 
      onClick={() => logout()} 
      className="p-2.5 bg-rose-500/10 text-rose-500 rounded-xl border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all group"
      title="Logout"
    >
      <LogOut className="w-[18px] h-[18px] group-hover:-translate-x-1 transition-transform"/>
    </button>
  </div>
</div>
      </header>

      {/* RENDER CHILDREN IF PROVIDED */}
      <section className="px-4 mt-2 md:px-0">{children}</section>

      <main className="px-4 md:px-6 w-full max-w-2xl mx-auto mt-6 md:mt-8">
        <AnimatePresence mode="wait">
          {activeTab === "dashboard" && (
            <motion.div
              key="db"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4 md:space-y-6"
            >
              {isAdmin && (
                <div className="flex bg-slate-950/20 backdrop-blur-md p-1 rounded-xl md:rounded-2xl border border-white/5 gap-1">
                  {["month", "quarter", "year"].map((p) => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p as any)}
                      className={`flex-1 py-2 text-[8px] md:text-[9px] font-black uppercase tracking-widest rounded-lg md:rounded-xl transition-all ${period === p ? "bg-amber-400 text-slate-950 shadow-lg" : "text-slate-500 hover:text-slate-300"}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}

              <div className="rounded-[2rem] md:rounded-[3rem] bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-6 md:p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-400/10 blur-[80px] rounded-full" />
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <p className="text-slate-500 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em]">
                      {isAdmin ? `${period}ly Net Profit` : "Shift Overview"}
                    </p>
                    {isAdmin ? (
                      <h2 className="text-3xl md:text-5xl font-black text-white mt-2 md:mt-3 tracking-tighter">
                        ₹
                        {Number(dbData?.netProfit || 0).toLocaleString("en-IN")}
                      </h2>
                    ) : (
                      <div className="flex items-center gap-2 md:gap-3 mt-3 md:mt-4 text-emerald-400">
                        <CheckCircle2 className="w-6 h-6 md:w-8 md:h-8" />
                        <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white">
                          System Active
                        </h2>
                      </div>
                    )}
                  </div>
                  {isAdmin && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 md:p-3 rounded-xl md:rounded-2xl text-emerald-400">
                      <TrendingUp className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                  )}
                </div>
                {isAdmin && (
                  <div className="mt-6 md:mt-8 grid grid-cols-2 gap-4 border-t border-white/5 pt-4 md:pt-6 relative z-10">
                    <div>
                      <p className="text-[8px] md:text-[9px] text-slate-500 uppercase font-black tracking-widest">
                        Efficiency
                      </p>
                      <p className="text-md md:text-lg font-black text-white">
                        {liveInsights.todayPerformance}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] md:text-[9px] text-slate-500 uppercase font-black tracking-widest">
                        Avg Collection
                      </p>
                      <p className="text-md md:text-lg font-black text-white">
                        ₹{Math.round(liveInsights.avgEntry).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {isAdmin && (
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <StatCard
                    title="Revenue"
                    value={Number(dbData?.revenue || 0)}
                    icon={Wallet}
                    color="text-amber-400"
                  />
                  <StatCard
                    title="Expenses"
                    value={Number(dbData?.expenses || 0)}
                    icon={TrendingDown}
                    color="text-rose-400"
                  />
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "occupancy" && (
            <motion.div
              key="occ"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full"
            >
              <div className="bg-white/[0.02] backdrop-blur-xl rounded-[2rem] border border-white/5 p-2 md:p-4 shadow-2xl">
                <header className="flex justify-between items-center mb-4 px-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-amber-400">
                    Inventory Status
                  </h3>
                  <div className="px-3 py-1 bg-amber-400/10 rounded-full border border-amber-400/20 text-[8px] font-black text-amber-400 uppercase tracking-tighter">
                    {
                      roomsFromState.filter((r) => r.status === "occupied")
                        .length
                    }{" "}
                    / {roomsFromState.length} Booked
                  </div>
                </header>
                <RoomOccupancyClient
                  initialRooms={roomsFromState}
                  onRoomUpdate={refreshRooms}
                  properties={
                    properties.length > 0
                      ? properties
                      : [
                          {
                            id: user?.propertyId || "def",
                            name: "Current Unit",
                          },
                        ]
                  }
                  currentPropertyId={user?.propertyId || "global"}
                  prefillName={null}
                  onlySwitcher={false}
                />
              </div>
            </motion.div>
          )}

          {activeTab === "reception" && (
            <motion.div
              key="recep"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 md:space-y-6"
            >
              <header className="flex justify-between items-end px-2">
                <div>
                  <h1 className="text-2xl md:text-3xl font-black italic text-white">
                    Reception <span className="text-amber-400">Live</span>
                  </h1>
                  <p className="text-[7px] md:text-[8px] text-slate-500 uppercase tracking-widest flex items-center gap-2 mt-1">
                    <Database className="w-[10px] h-[10px]" /> Global Drizzle
                    Sync Active
                  </p>
                </div>
                <button
                  onClick={syncReception}
                  className="p-2 md:p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 text-amber-400 shadow-xl active:rotate-180 transition-transform duration-500"
                >
                  <RefreshCcw className="w-[18px] h-[18px]" />
                </button>
              </header>

              <ReceptionCalendar
                rooms={roomsFromState}
                tasks={intelData.tasks}
              />

              <div className="bg-white/[0.05] backdrop-blur-3xl border border-white/10 p-5 md:p-6 rounded-[2rem] shadow-2xl">
                <h3 className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-amber-400 mb-4">
                  PMS Maintenance Alerts
                </h3>
                <div className="space-y-3">
                  {intelData.tasks.filter((t) => t.status !== "completed")
                    .length > 0 ? (
                    intelData.tasks
                      .filter((t) => t.status !== "completed")
                      .map((task: any) => (
                        <div
                          key={task.id}
                          className="p-3 bg-white/[0.03] rounded-xl border-l-2 border-amber-400/50 flex justify-between items-center"
                        >
                          <div>
                            <p className="text-[11px] md:text-xs font-bold text-white leading-tight">
                              {task.description || "Room Service Required"}
                            </p>
                            <p className="text-[8px] md:text-[9px] text-slate-500 mt-1 uppercase font-bold">
                              Unit: {task.roomNumber}
                            </p>
                          </div>
                          <div className="px-2 py-1 bg-white/5 rounded-lg text-[7px] font-black text-slate-400 uppercase">
                            Pending
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-6">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-2 opacity-20" />
                      <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                        Clean Sweep - No Alerts
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "intel" && (
            <motion.div
              key="intel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {loadingReports ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-500 animate-pulse gap-3">
                  <LineChart className="w-8 h-8 opacity-20" />
                  <p className="font-black uppercase text-[9px]">
                    Analyzing Market Data...
                  </p>
                </div>
              ) : (
                <div className="bg-white/[0.03] backdrop-blur-xl rounded-[2rem] border border-white/10 p-2 md:p-4">
                  <MarketIntelView
                    logs={intelData.logs}
                    inquiries={intelData.inquiries}
                    guests={intelData.guests}
                    tasks={intelData.tasks}
                  />
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "history" && (
            <motion.div
              key="hist"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3 md:space-y-4"
            >
              <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                Property Audit Log
              </h3>
              {logs.length > 0 ? (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-white/[0.03] backdrop-blur-lg border border-white/5 p-4 md:p-5 rounded-2xl md:rounded-[2.5rem] hover:bg-white/[0.05] transition-all"
                  >
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-950/60 rounded-xl flex flex-col items-center justify-center border border-white/5 text-amber-400 shrink-0">
                        <span className="text-[9px] md:text-[10px] font-black">
                          {new Date(log.date).getDate()}
                        </span>
                        <span className="text-[7px] md:text-[8px] font-bold uppercase">
                          {new Date(log.date).toLocaleDateString("en-IN", {
                            month: "short",
                          })}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-black text-sm">
                          ₹{log.totalCollection.toLocaleString("en-IN")}
                        </p>
                        <p className="text-[8px] md:text-[9px] text-slate-500 font-bold uppercase tracking-tight truncate">
                          Sync by {log.staffName || "System"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-[8px] font-black uppercase ${log.cashRevenue > 0 ? "text-emerald-400" : "text-slate-600"}`}
                        >
                          {log.cashRevenue > 0 ? "Cash Entry" : "Digital Only"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center text-[10px] font-black uppercase text-slate-600 tracking-widest">
                  Empty Audit Trail
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "settings" && (
            <motion.div
              key="sett"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <SettingsTab
                user={user}
                allStaff={allStaff}
                onNameChange={() => refreshData()}
              />
            </motion.div>
          )}

          {activeTab === "add" && (
            <motion.div
              key="add-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="bg-slate-950/40 backdrop-blur-3xl rounded-[2rem] border border-white/10 p-5 md:p-6 shadow-2xl">
                <div className="mb-6">
                  <h2 className="text-xl font-black text-white italic">
                    New <span className="text-amber-400">Entry</span>
                  </h2>
                  <p className="text-[8px] text-slate-500 uppercase font-bold tracking-widest mt-1">
                    Recording to {activePropertyName}
                  </p>
                </div>
                {/* FIXED: The form now reacts to the current user property context */}
                <DayBookForm
                  onSuccess={() => {
                    setActiveTab("dashboard");
                    refreshData();
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* DOCK NAVIGATION */}
      <nav className="fixed bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-[500px] bg-slate-950/80 backdrop-blur-3xl border border-white/10 p-1.5 md:p-2 rounded-[2.5rem] md:rounded-[3.5rem] flex items-center justify-between z-[120] shadow-2xl">
        <div className="flex items-center justify-between flex-1 px-1">
          <NavIcon
            active={activeTab === "dashboard"}
            onClick={() => setActiveTab("dashboard")}
            icon={LayoutDashboard}
            label="Home"
          />
          <NavIcon
            active={activeTab === "history"}
            onClick={() => setActiveTab("history")}
            icon={History}
            label="Audit"
          />
          <NavIcon
            active={activeTab === "occupancy"}
            onClick={() => setActiveTab("occupancy")}
            icon={DoorOpen}
            label="Rooms"
          />
        </div>

        <div className="relative w-12 md:w-14 h-10 flex justify-center items-center">
          <button
            onClick={() => setActiveTab("add")}
            className={`absolute -top-8 md:-top-11 w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90
              ${activeTab === "add" ? "bg-white text-slate-950 shadow-white/20" : "bg-amber-400 text-slate-950 shadow-amber-400/40"} shadow-xl md:shadow-2xl z-10`}
          >
            <Plus className="w-6 h-6 md:w-7 md:h-7" strokeWidth={3} />
          </button>
        </div>

        <div className="flex items-center justify-between flex-1 px-1">
          <NavIcon
            active={activeTab === "reception"}
            onClick={() => setActiveTab("reception")}
            icon={ConciergeBell}
            label="PMS"
          />
          <NavIcon
            active={activeTab === "intel"}
            onClick={() => setActiveTab("intel")}
            icon={LineChart}
            label="Intel"
          />
          <NavIcon
            active={activeTab === "settings"}
            onClick={() => setActiveTab("settings")}
            icon={Settings}
            label="User"
          />
        </div>
      </nav>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function ReceptionCalendar({
  rooms = [],
  tasks = [],
}: {
  rooms: any[];
  tasks: any[];
}) {
  const days = Array.from({ length: 5 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div className="bg-white/[0.04] backdrop-blur-3xl rounded-[1.5rem] border border-white/10 overflow-hidden shadow-2xl">
      <div className="grid grid-cols-6 border-b border-white/10 bg-white/[0.02]">
        <div className="p-3 md:p-4 border-r border-white/10 text-[7px] md:text-[8px] font-black uppercase text-slate-400 tracking-widest flex items-center">
          Unit
        </div>
        {days.map((d, i) => (
          <div
            key={i}
            className="p-2 md:p-3 text-center border-r border-white/10 last:border-0"
          >
            <p className="text-[6px] md:text-[7px] font-black uppercase text-slate-500 mb-0.5">
              {d.toLocaleDateString("en-IN", { weekday: "short" })}
            </p>
            <p className="text-[9px] md:text-[10px] font-black text-white">
              {d.getDate()}
            </p>
          </div>
        ))}
      </div>

      <div className="max-h-[280px] md:max-h-[320px] overflow-y-auto scrollbar-hide">
        {rooms.length > 0 ? (
          rooms.map((room) => (
            <div
              key={room.id}
              className="grid grid-cols-6 border-b border-white/5 last:border-0 transition-colors hover:bg-white/[0.02]"
            >
              <div className="p-3 md:p-4 border-r border-white/10 bg-white/[0.03] text-[10px] md:text-xs font-black text-white italic">
                {room.number}
              </div>
              {days.map((_, i) => {
                const isOccupied = i === 0 && room.status === "occupied";
                const roomTask = tasks.find(
                  (t) =>
                    t.roomNumber === room.number && t.status !== "completed",
                );

                return (
                  <div
                    key={i}
                    className="p-1 border-r border-white/5 last:border-0 relative min-h-[40px] md:min-h-[50px]"
                  >
                    {isOccupied && (
                      <div className="absolute inset-x-1 inset-y-1 bg-amber-400 rounded-lg p-1 flex flex-col justify-center shadow-lg shadow-amber-400/20 active:scale-95 transition-transform overflow-hidden">
                        <p className="text-[5px] md:text-[6px] font-black text-slate-950 uppercase truncate leading-none">
                          {room.guestName}
                        </p>
                      </div>
                    )}
                    {i === 0 && roomTask && !isOccupied && (
                      <div className="absolute inset-1 border border-blue-400/30 bg-blue-500/10 backdrop-blur-sm rounded-lg flex items-center justify-center animate-pulse">
                        <AlertCircle className="w-2.5 h-2.5 text-blue-400" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        ) : (
          <div className="p-10 text-center text-[10px] font-black uppercase text-slate-700 tracking-widest">
            Scanning Drizzle Database...
          </div>
        )}
      </div>
    </div>
  );
}

function NavIcon({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: any;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-0.5 group outline-none"
    >
      <div
        className={`p-1.5 md:p-2 rounded-xl md:rounded-2xl transition-all duration-300 group-active:scale-90
        ${active ? "text-amber-400 bg-amber-400/10 backdrop-blur-md" : "text-slate-500 hover:text-slate-300"}`}
      >
        <Icon className="w-4 h-4 md:w-[18px] md:h-[18px]" />
      </div>
      <span
        className={`text-[6px] md:text-[7px] font-black uppercase tracking-tighter transition-all duration-300 ${active ? "opacity-100 text-amber-400 translate-y-0" : "opacity-0 translate-y-1"}`}
      >
        {label}
      </span>
    </button>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  icon: any;
  color: string;
}) {
  return (
    <div className="bg-white/[0.05] backdrop-blur-xl border border-white/10 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] shadow-xl">
      <div
        className={`w-7 h-7 md:w-9 md:h-9 rounded-lg md:rounded-xl bg-white/5 flex items-center justify-center mb-2 md:mb-3 ${color}`}
      >
        <Icon className="w-3.5 h-3.5 md:w-[18px] md:h-[18px]" />
      </div>
      <p className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
        {title}
      </p>
      <p className="text-md md:text-xl font-black text-white mt-0.5 md:mt-1">
        ₹{value.toLocaleString("en-IN")}
      </p>
    </div>
  );
}
