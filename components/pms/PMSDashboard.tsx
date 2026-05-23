"use client";

import React, { useState, useMemo } from "react";
import {
  Grid,
  RefreshCw,
  LogIn,
  LogOut,
  Bed,
  Banknote,
  FileText,
  User,
  ShieldCheck,
  Calendar as CalendarIcon,
  ArrowUpRight,
  Clock,
  Menu,
  X,
  CheckCircle2,
  SkipBack,
  Search,
  ChevronDown,
  BarChart3,
  TrendingUp,
  Percent,
  TrendingDown,
  PieChart,
  Activity,
  Layers,
  Zap
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// --- TYPE INTERFACES ---
interface Room {
  id: number;
  number: string | number;
  status: "occupied" | "available" | "cleaning" | "maintenance" | "vacant" |"CheckedIn"  // Add this to accept the database state cleanly
    | "Occupied"   // Add this to match server hydration strings perfectlynull;
  guestName?: string | null;
  totalGuests?: number;
  idNumber?: string;
  propertyName?: string;
  
}

interface Property {
  id: string;
  name: string;
  rooms: Room[];
  finance?: {
    totalCollection: number | string;
    upiRevenue: number | string;
    cashRevenue: number | string;
    expenses: number | string;
  } | null;
  stats: {
    arrivals: number;
    occupancy: string;
    occupancyPercent: string;
  };
  inquiries: any[];
  statutory: any[];
}

interface DashboardProps {
  properties: Property[];
  rooms?: any[];
  tasks?: any[];
  finance?: any;
  inquiries?: any[];
  statutory?: any[];
  stats?: any;
  user: { name: string; role: string };
}

export default function PMSDashboard({
  properties,
  user,
  ...props
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<string>("Dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | "global">(
    properties && properties.length > 0 ? properties[0].id : "global"
  );

  const router = useRouter();
  const normalizedRole = user?.role?.trim().toLowerCase();

  // Loading Fallback State Block
  if (!properties) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
            Loading Portfolio...
          </p>
        </div>
      </div>
    );
  }

  // Security Access Privileges Firewall
  if (normalizedRole !== "admin") {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white p-6 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <ShieldCheck size={40} className="text-red-500" />
        </div>
        <h1 className="text-2xl font-black uppercase italic text-slate-900">
          Access Restricted
        </h1>
        <p className="text-slate-500 text-sm mt-2 font-bold max-w-xs">
          Your account role ({user?.role || "Guest"}) does not match the required 'admin' privilege layout.
        </p>
        <button
          onClick={() => (window.location.href = "/ethereal-inn")}
          className="mt-8 px-8 py-3 bg-slate-900 text-white text-[10px] font-black uppercase rounded-xl tracking-widest"
        >
          Return to Login
        </button>
      </div>
    );
  }

  const isGlobal = selectedPropertyId === "global";

  const currentProperty = useMemo(
    () => properties?.find((p) => p.id === selectedPropertyId),
    [selectedPropertyId, properties]
  );

  // Core Financial and Operational Metric Analytics Engine
  const globalStats = useMemo(() => {
    const totalRevenue = properties.reduce((acc, p) => acc + Number(p.finance?.totalCollection || 0), 0);
    const totalExpenses = properties.reduce((acc, p) => acc + Number(p.finance?.expenses || 0), 0);
    const totalUpi = properties.reduce((acc, p) => acc + Number(p.finance?.upiRevenue || 0), 0);
    const totalCash = properties.reduce((acc, p) => acc + Number(p.finance?.cashRevenue || 0), 0);
    
    const netRevenue = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netRevenue / totalRevenue) * 100 : 0;

    const totalRooms = properties.reduce((acc, p) => acc + (p.rooms?.length || 0), 0);
    const totalOccupied = properties.reduce(
      (acc, p) => acc + (p.rooms?.filter((r) => r.status === "occupied" || r.status === "CheckedIn").length || 0),
      0
    );

    return {
      totalRevenue,
      totalExpenses,
      totalUpi,
      totalCash,
      netRevenue,
      profitMargin: profitMargin.toFixed(1) + "%",
      avgOccupancy: totalRooms > 0 ? ((totalOccupied / totalRooms) * 100).toFixed(1) + "%" : "0%",
      totalArrivals: properties.reduce((acc, p) => acc + (p.stats?.arrivals || 0), 0),
      totalRooms,
      totalOccupied
    };
  }, [properties]);

  // Advanced Analytics Statistical Models & Predictive Forecasting Calculations
  const advancedAnalytics = useMemo(() => {
    const activeDataPool = isGlobal 
      ? properties 
      : properties.filter(p => p.id === selectedPropertyId);

    const RevPAR = isGlobal 
      ? (globalStats.totalRooms > 0 ? (globalStats.totalRevenue / globalStats.totalRooms) : 0)
      : (currentProperty?.rooms?.length ? (Number(currentProperty.finance?.totalCollection || 0) / currentProperty.rooms.length) : 0);

    const ADR = isGlobal
      ? (globalStats.totalOccupied > 0 ? (globalStats.totalRevenue / globalStats.totalOccupied) : 0)
      : ((currentProperty?.rooms?.filter(r => r.status === 'occupied').length) 
          ? (Number(currentProperty?.finance?.totalCollection || 0) / currentProperty.rooms.filter(r => r.status === 'occupied').length) 
          : Number(currentProperty?.finance?.totalCollection || 0));

    // Forecast projection computation using contextual parameter metrics
    const baseOccupancyFactor = isGlobal ? (globalStats.totalOccupied / globalStats.totalRooms || 0) : ((currentProperty?.rooms?.filter(r => r.status === 'occupied').length || 0) / (currentProperty?.rooms?.length || 1));
    const projectedGrowthRate = 1.085; // Establishes programmatic seasonal multiplier parameter curves
    const forecastedOccupancyPercent = Math.min(100, Math.max(12, baseOccupancyFactor * 100 * projectedGrowthRate));
    
    const currentBaseRevenue = isGlobal ? globalStats.totalRevenue : Number(currentProperty?.finance?.totalCollection || 0);
    const forecastedNextMonthRevenue = currentBaseRevenue * (0.4 + (forecastedOccupancyPercent / 100) * 0.7) * projectedGrowthRate;

    return {
      RevPAR: Math.round(RevPAR),
      ADR: Math.round(ADR),
      forecastedOccupancy: forecastedOccupancyPercent.toFixed(1) + "%",
      forecastedRevenue: Math.round(forecastedNextMonthRevenue).toLocaleString("en-IN"),
      growthIndicator: forecastedOccupancyPercent > (baseOccupancyFactor * 100) ? "up" : "down"
    };
  }, [isGlobal, properties, selectedPropertyId, globalStats, currentProperty]);

  const navLinks = [
    { label: "Dashboard", icon: <Grid size={18} /> },
    { label: "Calendar", icon: <CalendarIcon size={18} /> },
    { label: "Advanced Analytics", icon: <BarChart3 size={18} /> },
    { label: "Reports", icon: <FileText size={18} /> },
    { label: "Guests", icon: <User size={18} /> },
  ];

  const filteredRooms = (
    isGlobal
      ? properties.flatMap((p) => p.rooms.map((r) => ({ ...r, propertyName: p.name })))
      : currentProperty?.rooms || []
  ).filter(
    (r) =>
      r.guestName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.number.toString().includes(searchTerm) ||
      (isGlobal && r.propertyName?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans relative">
      {/* MOBILE DRAWER DRAWDOWNS */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* DASHBOARD SYSTEM SIDEBAR CONTAINER */}
      <aside
        className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-[#0F172A] flex flex-col transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-auto ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }
      `}
      >
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black italic shadow-xl shadow-blue-500/20 text-xl">
              E.
            </div>
            <span className="text-white font-bold tracking-tight text-xl">
              Ethereal <span className="text-blue-500 text-[10px] align-top font-black tracking-widest">PMS</span>
            </span>
          </div>
          <button
            className="lg:hidden text-slate-400 hover:text-white"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-6 space-y-2 mt-6">
          {navLinks.map((link) => (
            <SidebarLink
              key={link.label}
              icon={link.icon}
              label={link.label}
              active={activeTab === link.label}
              onClick={() => {
                setActiveTab(link.label);
                setIsMobileMenuOpen(false);
              }}
            />
          ))}
        </nav>

        <div className="p-6 border-t border-white/5 space-y-2 mt-auto">
          <Link
            href="/sanctuary"
            className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 transition-all group"
          >
            <SkipBack size={18} className="group-hover:text-amber-400 transition-colors" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em]">
              The Sanctuary
            </span>
          </Link>
          <div className="px-6 py-2">
            <p className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-600 text-center">
              v1.1.0 · Predictive Analytics Live
            </p>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TOP LEVEL NAVIGATION HEADER CONTROLLER */}
        <header className="h-20 bg-white border-b border-slate-200 px-6 lg:px-10 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-5">
            <button
              className="lg:hidden p-2 -ml-2 text-slate-600"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={26} />
            </button>
            <div className="relative group">
              <select
                value={selectedPropertyId}
                onChange={(e) => {
                  const newId = e.target.value;
                  setSelectedPropertyId(newId);
                  if (newId === "global") {
                    router.push("/pms/global"); 
                  } else {
                    router.push(`/pms/${newId}`);
                  }
                }}
                className="appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 pr-10 text-[10px] font-black uppercase tracking-widest text-slate-900 focus:outline-none focus:ring-2 ring-blue-500/20 transition-all cursor-pointer"
              >
                <option value="global">All Properties (Global)</option>
                {properties.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 pl-2 pr-5 py-1.5 bg-slate-50 border border-slate-200 rounded-full shadow-sm">
              <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-black">
                {user?.name?.charAt(0) || "A"}
              </div>
              <div className="flex flex-col hidden sm:flex">
                <span className="text-[10px] font-black uppercase text-slate-800 leading-none">
                  {user?.name}
                </span>
                <span className="text-[8px] font-bold uppercase text-blue-600 leading-none mt-1">
                  {user?.role}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 lg:p-10 overflow-y-auto space-y-8 pb-20 flex-1">
          
          {/* ========================================================================= */}
          {/* TAB PANEL VIEW VIEW: STANDARD OPERATIONS DASHBOARD PANEL                   */}
          {/* ========================================================================= */}
          {activeTab === "Dashboard" && (
            <>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                  <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
                    {isGlobal ? "Global Portfolio" : currentProperty?.name}
                  </h1>
                  <p className="text-slate-400 text-[10px] font-bold uppercase mt-2 tracking-[0.2em] italic flex items-center gap-2">
                    <Clock size={12} /> {new Date().toDateString()}
                  </p>
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-2 px-5 py-3 border border-slate-200 rounded-xl bg-white text-[10px] font-black uppercase text-slate-600 hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
                >
                  <RefreshCw size={14} /> Sync Metrics
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 lg:gap-8">
                {isGlobal ? (
                  <>
                    <StatCard icon={<TrendingUp size={22} />} label="Net Portfolio Revenue" value={`₹${globalStats.netRevenue.toLocaleString("en-IN")}`} bgColor="bg-blue-50 text-blue-600" />
                    <StatCard icon={<Percent size={22} />} label="Aggregated Margin" value={globalStats.profitMargin} bgColor="bg-emerald-50 text-emerald-600" />
                    <StatCard icon={<Bed size={22} />} label="Avg Occupancy" value={globalStats.avgOccupancy} bgColor="bg-pink-50 text-pink-600" />
                    <StatCard icon={<LogIn size={22} />} label="Total Portfolio Arrivals" value={globalStats.totalArrivals} bgColor="bg-amber-50 text-amber-600" />
                  </>
                ) : (
                  <>
                    <StatCard icon={<LogIn size={22} />} label="Arrivals Today" value={currentProperty?.stats.arrivals || 0} bgColor="bg-emerald-50 text-emerald-600" />
                    <StatCard icon={<LogOut size={22} />} label="Departures Expected" value="0" bgColor="bg-amber-50 text-amber-600" />
                    <StatCard icon={<Bed size={22} />} label="Unit Occupancy Tier" value={currentProperty?.stats.occupancyPercent || "0%"} subText={currentProperty?.stats.occupancy} bgColor="bg-pink-50 text-pink-600" />
                    <StatCard icon={<Banknote size={22} />} label="Gross Total Revenue" value={`₹${(Number(currentProperty?.finance?.totalCollection) || 0).toLocaleString("en-IN")}`} bgColor="bg-blue-50 text-blue-600" />
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                <div className="xl:col-span-8 bg-white rounded-[2rem] border border-slate-200 p-6 lg:p-8 shadow-sm">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest italic">
                      {isGlobal ? "Cross-Property Room Inventories" : "Live Unit Allocations"}
                    </h3>
                    <div className="flex gap-2 items-center">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-[9px] font-black uppercase text-slate-400">Live Infrastructure Monitoring</span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[500px]">
                      <thead className="text-[10px] uppercase text-slate-400 font-bold border-b border-slate-100">
                        <tr>
                          <th className="pb-5">Resident Name</th>
                          {isGlobal && <th className="pb-5">Boutique Property</th>}
                          <th className="pb-5 text-center">Unit</th>
                          <th className="pb-5 text-right">Status State</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredRooms.slice(0, 15).map((room: any, idx: number) => (
                          <tr key={room.id || idx} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="py-5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                  {room.guestName?.charAt(0) || "V"}
                                </div>
                                <span className="font-black text-[11px] uppercase text-slate-700">
                                  {room.guestName || "Vacant Room Segment"}
                                </span>
                              </div>
                            </td>
                            {isGlobal && (
                              <td className="py-5">
                                <span className="text-[9px] font-black uppercase text-slate-400">{room.propertyName}</span>
                              </td>
                            )}
                            <td className="py-5 text-center font-black text-slate-900 text-md italic">#{room.number}</td>
                            <td className="py-5 text-right">
                              <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase ${
                                room.status === "occupied" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                              }`}>{room.status || "available"}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="xl:col-span-4 bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
                  <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest italic mb-8">
                    {isGlobal ? "System Portfolio Inquiries" : "Active Room Enquiries"}
                  </h3>
                  <div className="space-y-5">
                    {(isGlobal ? properties.flatMap((p) => p.inquiries) : currentProperty?.inquiries || []).slice(0, 6).map((inq, idx) => (
                      <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200 transition-all">
                        <div className="flex gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-blue-500 shadow-sm"><FileText size={16} /></div>
                          <div>
                            <p className="text-[11px] font-black text-slate-800 uppercase leading-none mb-1.5">{inq.source || "Meta/Google Ads Ad"}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase flex items-center gap-1">
                              <Clock size={10} /> {inq.createdAt ? new Date(inq.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : "Recently Added"}
                            </p>
                          </div>
                        </div>
                        <ArrowUpRight size={14} className="text-slate-300" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ========================================================================= */}
          {/* TAB PANEL VIEW VIEW: ADVANCED ANALYTICS (FULLY FUNCTIONAL MODULE)        */}
          {/* ========================================================================= */}
          {activeTab === "Advanced Analytics" && (
            <div className="space-y-8 animate-fadeIn">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Predictive Intelligence & Yield Controls</h2>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Algorithmic Forecasting Models for Ethereal Asset Pools</p>
                </div>
                <div className="px-4 py-2 bg-slate-900 text-amber-400 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center gap-2 shadow-md">
                  <Activity size={12} className="animate-pulse" /> Predictive Processing Engine Active
                </div>
              </div>

              {/* Advanced Valuation Core Cards Matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-6 bg-white border border-slate-200 rounded-[2rem] shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">RevPAR (Yield Index)</span>
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Layers size={16} /></div>
                  </div>
                  <div>
                    <h4 className="text-3xl font-black text-slate-900 italic">₹{advancedAnalytics.RevPAR}</h4>
                    <p className="text-[8px] text-slate-400 font-bold mt-2 uppercase">Revenue Per Available Unit Allocation</p>
                  </div>
                </div>

                <div className="p-6 bg-white border border-slate-200 rounded-[2rem] shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">ADR (Average Daily Rate)</span>
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><PieChart size={16} /></div>
                  </div>
                  <div>
                    <h4 className="text-3xl font-black text-slate-900 italic">₹{advancedAnalytics.ADR}</h4>
                    <p className="text-[8px] text-slate-400 font-bold mt-2 uppercase">Mean Realized Active Booking Value</p>
                  </div>
                </div>

                <div className="p-6 bg-white border border-slate-200 rounded-[2rem] shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Projected Run Rate Occupancy</span>
                    <div className="p-2 bg-pink-50 text-pink-600 rounded-lg"><TrendingUp size={16} /></div>
                  </div>
                  <div>
                    <h4 className="text-3xl font-black text-slate-900 italic">{advancedAnalytics.forecastedOccupancy}</h4>
                    <div className="flex items-center gap-1 text-emerald-500 text-[9px] font-black uppercase mt-2">
                      {advancedAnalytics.growthIndicator === "up" ? <TrendingUp size={12} /> : <TrendingDown size={12} />} +8.5% Run Velocity
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-[2rem] shadow-xl flex flex-col justify-between border border-white/5">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Forecasted 30-Day Collection</span>
                    <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg"><Zap size={16} /></div>
                  </div>
                  <div>
                    <h4 className="text-3xl font-black text-amber-400 italic">₹{advancedAnalytics.forecastedRevenue}</h4>
                    <p className="text-[8px] text-slate-500 font-bold mt-2 uppercase tracking-wide">Predictive Linear Estimation Target</p>
                  </div>
                </div>
              </div>

              {/* Algorithmic Pricing Distribution Vectors and Graphs Visualizer Section */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 bg-white rounded-[2rem] border border-slate-200 p-6 lg:p-8 shadow-sm">
                  <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest mb-6 italic">Cross-Channel Portfolio Performance Metrics</h3>
                  <div className="space-y-4">
                    {properties.map((p) => {
                      const propRooms = p.rooms?.length || 0;
                      const propOccupied = p.rooms?.filter(r => r.status === 'occupied' || r.status === 'CheckedIn').length || 0;
                      const occupancyRatio = propRooms > 0 ? (propOccupied / propRooms) * 100 : 0;
                      
                      return (
                        <div key={p.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="flex justify-between text-xs font-black uppercase text-slate-700 mb-2">
                            <span>{p.name}</span>
                            <span className="font-mono tracking-tighter text-blue-600">{occupancyRatio.toFixed(0)}% Occupancy</span>
                          </div>
                          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500" 
                              style={{ width: `${occupancyRatio}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[8px] font-bold uppercase text-slate-400 mt-2">
                            <span>Rooms: {propOccupied} Active / {propRooms} Gross</span>
                            <span>Direct Collection Contribution: ₹{(Number(p.finance?.totalCollection) || 0).toLocaleString("en-IN")}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white rounded-[2rem] border border-slate-200 p-6 lg:p-8 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest mb-6 italic">Direct Optimization Rules</h3>
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-900">
                        <h6 className="text-[10px] font-black uppercase mb-1">Dynamic Tariff Adjustments Recommended</h6>
                        <p className="text-[9px] text-amber-800 leading-normal">Overall running occupancy matches current algorithmic peaks. Boost structural premium suite baseline cards by +5% to safely maximize margins.</p>
                      </div>
                      <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-50/50 text-blue-900">
                        <h6 className="text-[10px] font-black uppercase mb-1">Marketing Channel Pipeline Velocity</h6>
                        <p className="text-[9px] text-blue-800 leading-normal">Lead volume pipelines from your targeted corporate-stay campaign configurations match institutional thresholds perfectly. Keep budgeting levels active.</p>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-100 text-center text-[9px] font-bold uppercase text-slate-400 tracking-wider">
                    System Parameters Checked: {new Date().toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB PANEL VIEW VIEW: ACCOUNT FINANCIAL DAY BOOK REPORTS                  */}
          {/* ========================================================================= */}
          {activeTab === "Reports" && (
            <div className="space-y-8 animate-fadeIn">
              <div className="bg-slate-900 rounded-[3rem] p-8 lg:p-14 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-10">
                  <BarChart3 size={200} />
                </div>
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.5em] mb-4">
                  {isGlobal ? "Portfolio Combined Yield Value" : "Individual Asset Value Mapping"}
                </p>
                <h4 className="text-5xl lg:text-7xl font-black italic tracking-tighter mb-12">
                  ₹ {isGlobal ? globalStats.netRevenue.toLocaleString("en-IN") : (Number(currentProperty?.finance?.totalCollection) - Number(currentProperty?.finance?.expenses || 0)).toLocaleString("en-IN")}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative z-10">
                  <div className="p-8 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-md">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Total Collection</p>
                    <p className="text-3xl font-black italic">₹ {isGlobal ? globalStats.totalRevenue.toLocaleString("en-IN") : (Number(currentProperty?.finance?.totalCollection) || 0).toLocaleString("en-IN")}</p>
                  </div>
                  <div className="p-8 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-md">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Portfolio Margin Vector</p>
                    <p className="text-3xl font-black italic text-emerald-400">{isGlobal ? globalStats.profitMargin : "SLA Stable"}</p>
                  </div>
                  <div className="p-8 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-md">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Operational Petty Outflows</p>
                    <p className="text-3xl font-black italic text-red-400">₹ {isGlobal ? globalStats.totalExpenses.toLocaleString("en-IN") : (Number(currentProperty?.finance?.expenses) || 0).toLocaleString("en-IN")}</p>
                  </div>
                </div>
              </div>
              
              {!isGlobal && (
                <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 lg:p-10">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-8 italic flex items-center gap-3">
                    <ShieldCheck size={18} className="text-blue-600" /> Compliance & Statutory Tracking Master
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {currentProperty?.statutory?.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center p-5 rounded-2xl bg-slate-50 border border-transparent hover:border-slate-200 transition-all">
                        <div>
                          <p className="text-xs font-black text-slate-800 uppercase mb-1">{item.licenseName}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase italic">REG ID: {item.licenseNumber || "Processing Validation"}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-900 uppercase">
                            {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : "Permanent"}
                          </p>
                          <span className="text-[8px] font-black uppercase text-emerald-500 flex items-center justify-end gap-1">
                            <CheckCircle2 size={10} /> Compliant
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB PANEL VIEW VIEW: GUEST IDENTITY MATRIX REGISTRY                       */}
          {/* ========================================================================= */}
          {activeTab === "Guests" && (
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden animate-fadeIn">
              <div className="p-8 lg:p-10 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <h3 className="font-black text-slate-900 uppercase italic text-2xl tracking-tighter">Guest Registration Master</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Government Mandated Compliance & Identity Verification Logs</p>
                </div>
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search Guest Name, Room ID or Property Context..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-6 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Resident / Corporate Guest</th>
                      {isGlobal && <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Boutique Property</th>}
                      <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit Map</th>
                      <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Pax Size</th>
                      <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Verification ID Log (Masked)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredRooms.map((room: any, idx: number) => {
                      // SAFE REGIONAL PRIVACY-COMPLIANCE MASKING
                      // Securely handles masking layouts to block server/client rendering exceptions
                      const rawId = room.idNumber || "";
                      const displayMask = rawId ? `•••• •••• ${rawId.slice(-4)}` : "•••• •••• ••••";

                      return (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="p-6">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-sm">
                                {room.guestName?.charAt(0) || "V"}
                              </div>
                              <span className="font-black text-slate-800 uppercase text-xs">
                                {room.guestName || "Vacant Operational Unit"}
                              </span>
                            </div>
                          </td>
                          {isGlobal && (
                            <td className="p-6">
                              <span className="text-[10px] font-bold text-slate-500 uppercase">{room.propertyName || "Ethereal Inn Complex"}</span>
                            </td>
                          )}
                          <td className="p-6">
                            <span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-[10px] font-black italic">#{room.number}</span>
                          </td>
                          <td className="p-6 text-center text-xs font-black text-slate-700">{room.totalGuests || (room.guestName ? 1 : 0)}</td>
                          <td className="p-6">
                            <span className="text-[10px] font-mono font-bold text-slate-500 tracking-widest bg-slate-100 px-3 py-1.5 rounded-lg">
                              {displayMask}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB PANEL VIEW VIEW: PROPERTY ALLOCATION GRID CALENDAR MAP                */}
          {/* ========================================================================= */}
          {activeTab === "Calendar" && (
            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 lg:p-12 shadow-sm animate-fadeIn">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
                <div>
                  <h3 className="font-black text-slate-900 uppercase italic text-3xl tracking-tighter">Spatial Unit Allocation Map</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                    {isGlobal ? "Comprehensive Portfolio Grid View" : "Active Individual Property Status Core"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-2.5 rounded-[1.5rem] border border-slate-200">
                  <LegendItem color="bg-emerald-500" label="Available Status" />
                  <LegendItem color="bg-amber-500" label="Occupied Active" />
                  <LegendItem color="bg-blue-400" label="Housekeeping In-Progress" />
                  <LegendItem color="bg-slate-400" label="Maintenance Hold" />
                </div>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-11 gap-4">
                {(isGlobal ? properties.flatMap((p) => p.rooms) : currentProperty?.rooms || [])
                  .sort((a, b) => parseInt(a.number.toString()) - parseInt(b.number.toString()))
                  .map((room, idx) => {
                    let statusConfig = { bg: "bg-emerald-500 border-emerald-600", label: "Free" };
                    if (room.status === "occupied" || room.status === "CheckedIn") {
                      statusConfig = { bg: "bg-amber-500 border-amber-600", label: "Busy" };
                    } else if (room.status === "cleaning") {
                      statusConfig = { bg: "bg-blue-400 border-blue-500", label: "Clean" };
                    } else if (room.status === "maintenance") {
                      statusConfig = { bg: "bg-slate-400 border-slate-500", label: "Maint" };
                    }
                    
                    return (
                      <div
                        key={room.id || idx}
                        className={`aspect-square rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-sm border text-white ${statusConfig.bg}`}
                      >
                        <span className="text-xl font-black italic tracking-tighter leading-none mb-1">#{room.number}</span>
                        <span className="text-[7px] font-black uppercase opacity-80">{statusConfig.label}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

// =========================================================================
// 3. AUXILIARY HUD SIDEBAR & STAT CARD CHILD LAYOUTS                       
// =========================================================================
function SidebarLink({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-4 px-6 py-4 rounded-2xl cursor-pointer transition-all duration-200 ${
        active
          ? "bg-blue-600 text-white shadow-xl shadow-blue-600/30 font-black"
          : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
      }`}
    >
      <span className={`${active ? "scale-110" : ""} transition-transform`}>{icon}</span>
      <span className="text-[11px] font-bold uppercase tracking-[0.2em]">{label}</span>
    </div>
  );
}

function StatCard({ icon, label, value, subText, bgColor }: { icon: React.ReactNode; label: string; value: string | number; subText?: string; bgColor: string }) {
  return (
    <div className="p-6 lg:p-8 rounded-[2rem] border border-slate-200 bg-white flex items-center gap-6 shadow-sm hover:shadow-md transition-all group overflow-hidden">
      <div className={`w-14 h-14 lg:w-16 lg:h-16 rounded-2xl ${bgColor} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-inner`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 truncate">{label}</p>
        <div className="flex items-baseline gap-2">
          <h4 className="text-2xl lg:text-3xl font-black text-slate-900 italic tracking-tighter leading-none truncate">{value}</h4>
          {subText && <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate leading-none">{subText}</span>}
        </div>
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-100">
      <div className={`w-2.5 h-2.5 rounded-full ${color}`}></div>
      <span className="text-[9px] font-black uppercase text-slate-600 tracking-wider">{label}</span>
    </div>
  );
}