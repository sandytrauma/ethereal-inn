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
} from "lucide-react";
import { useRouter } from "next/navigation";

// --- INTERFACES ---
interface Room {
  id: number;
  number: string | number;
  status:
    | "occupied"
    | "available"
    | "cleaning"
    | "maintenance"
    | "vacant"
    | null;
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

// --- MAIN COMPONENT ---
export default function PMSDashboard({
  properties,
  user,
  ...props
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | "global">(
    properties && properties.length > 0 ? properties[0].id : "global"
  );

  const router = useRouter(); // 2. Initialize the router

  const normalizedRole = user?.role?.trim().toLowerCase();

  // Loading State
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

  // Authentication Guard
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
          Your account role ({user?.role || "Guest"}) does not match the
          required 'admin' privilege.
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

  // Data Selectors
 const isGlobal = selectedPropertyId === "global";

const currentProperty = useMemo(
  () => properties?.find((p) => p.id === selectedPropertyId),
  [selectedPropertyId, properties]
);

  const globalStats = useMemo(() => {
    const totalRevenue = properties.reduce(
      (acc, p) => acc + Number(p.finance?.totalCollection || 0),
      0
    );
    const totalExpenses = properties.reduce(
      (acc, p) => acc + Number(p.finance?.expenses || 0),
      0
    );
    const netRevenue = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netRevenue / totalRevenue) * 100 : 0;

    const totalRooms = properties.reduce((acc, p) => acc + (p.rooms?.length || 0), 0);
    const totalOccupied = properties.reduce(
      (acc, p) =>
        acc + (p.rooms?.filter((r) => r.status === "occupied").length || 0),
      0
    );
    return {
      totalRevenue,
      netRevenue,
      profitMargin: profitMargin.toFixed(1) + "%",
      avgOccupancy:
        totalRooms > 0
          ? ((totalOccupied / totalRooms) * 100).toFixed(1) + "%"
          : "0%",
      totalArrivals: properties.reduce((acc, p) => acc + (p.stats?.arrivals || 0), 0),
    };
  }, [properties]);

  const navLinks = [
    { label: "Dashboard", icon: <Grid size={18} /> },
    { label: "Calendar", icon: <CalendarIcon size={18} /> },
    { label: "Reports", icon: <FileText size={18} /> },
    { label: "Guests", icon: <User size={18} /> },
  ];

  const filteredRooms = (
    isGlobal
      ? properties.flatMap((p) =>
          p.rooms.map((r) => ({ ...r, propertyName: p.name }))
        )
      : currentProperty?.rooms || []
  ).filter(
    (r) =>
      r.guestName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.number.toString().includes(searchTerm) ||
      (isGlobal &&
        r.propertyName?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans relative">
      {/* MOBILE DRAWER OVERLAY */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-[#0F172A] transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-auto ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }
      `}
      >
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black italic shadow-xl shadow-blue-500/20 text-xl">
              H.
            </div>
            <span className="text-white font-bold tracking-tight text-xl">
              Core <span className="text-blue-500 text-[10px] align-top">PMS</span>
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
          <button
            onClick={() => (window.location.href = "/")}
            className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 transition-all group"
          >
            <SkipBack
              size={18}
              className="group-hover:text-red-400 transition-colors"
            />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em]">
              Etherealinn
            </span>
          </button>
          <div className="px-6 py-2">
            <p className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-600 text-center">
              v1.0.5 - Portfolio Ready
              
            </p>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* ADAPTIVE NAVBAR */}
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
          
          // 3. Navigate to the specific route
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
      <ChevronDown
        size={14}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
      />
    </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 pl-2 pr-5 py-1.5 bg-slate-50 border border-slate-200 rounded-full shadow-sm">
              <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-black">
                {user?.name?.charAt(0)}
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

        <div className="p-6 lg:p-10 overflow-y-auto space-y-8 pb-20">
          {/* VIEW: DASHBOARD */}
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
                  <RefreshCw size={14} /> Sync Data
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 lg:gap-8">
                {isGlobal ? (
                  <>
                    <StatCard
                      icon={<TrendingUp size={22} />}
                      label="Net Revenue"
                      value={`₹${globalStats.netRevenue}`}
                      bgColor="bg-blue-50 text-blue-600"
                    />
                    <StatCard
                      icon={<Percent size={22} />}
                      label="Profit Margin"
                      value={globalStats.profitMargin}
                      bgColor="bg-emerald-50 text-emerald-600"
                    />
                    <StatCard
                      icon={<Bed size={22} />}
                      label="Avg Occupancy"
                      value={globalStats.avgOccupancy}
                      bgColor="bg-pink-50 text-pink-600"
                    />
                    <StatCard
                      icon={<LogIn size={22} />}
                      label="Total Arrivals"
                      value={globalStats.totalArrivals}
                      bgColor="bg-amber-50 text-amber-600"
                    />
                  </>
                ) : (
                  <>
                    <StatCard
                      icon={<LogIn size={22} />}
                      label="Arrivals"
                      value={currentProperty?.stats.arrivals}
                      bgColor="bg-emerald-50 text-emerald-600"
                    />
                    <StatCard
                      icon={<LogOut size={22} />}
                      label="Departures"
                      value="0"
                      bgColor="bg-amber-50 text-amber-600"
                    />
                    <StatCard
                      icon={<Bed size={22} />}
                      label="Occupancy"
                      value={currentProperty?.stats.occupancyPercent}
                      subText={currentProperty?.stats.occupancy}
                      bgColor="bg-pink-50 text-pink-600"
                    />
                    <StatCard
                      icon={<Banknote size={22} />}
                      label="Total Revenue"
                      value={`₹${currentProperty?.finance?.totalCollection || 0}`}
                      bgColor="bg-blue-50 text-blue-600"
                    />
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                <div className="xl:col-span-8 bg-white rounded-[2rem] border border-slate-200 p-6 lg:p-8 shadow-sm">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest italic">
                      {isGlobal ? "Cross-Property Units" : "Live Unit Inventory"}
                    </h3>
                    <div className="flex gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-[9px] font-black uppercase text-slate-400">
                        Live Status
                      </span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[500px]">
                      <thead className="text-[10px] uppercase text-slate-400 font-bold border-b border-slate-100">
                        <tr>
                          <th className="pb-5">Resident / Guest</th>
                          {isGlobal && <th className="pb-5">Property</th>}
                          <th className="pb-5 text-center">Unit No.</th>
                          <th className="pb-5 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {(isGlobal
                          ? properties.flatMap((p) =>
                              p.rooms.map((r) => ({
                                ...r,
                                propertyName: p.name,
                              }))
                            )
                          : currentProperty?.rooms || []
                        ).map((room: any, idx: number) => (
                          <tr
                            key={room.id || idx}
                            className="hover:bg-slate-50/50 transition-colors group"
                          >
                            <td className="py-5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                  {room.guestName?.charAt(0) || "V"}
                                </div>
                                <span className="font-black text-[11px] uppercase text-slate-700">
                                  {room.guestName || "Vacant Unit"}
                                </span>
                              </div>
                            </td>
                            {isGlobal && (
                              <td className="py-5">
                                <span className="text-[9px] font-black uppercase text-slate-400">
                                  {room.propertyName}
                                </span>
                              </td>
                            )}
                            <td className="py-5 text-center font-black text-slate-900 tracking-tighter text-lg italic">
                              {room.number}
                            </td>
                            <td className="py-5 text-right">
                              <span
                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase ${
                                  room.status === "occupied"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-emerald-100 text-emerald-700"
                                }`}
                              >
                                {room.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="xl:col-span-4 bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
                  <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest italic mb-8">
                    {isGlobal ? "Portfolio Leads" : "Recent Leads"}
                  </h3>
                  <div className="space-y-5">
                    {(isGlobal
                      ? properties.flatMap((p) => p.inquiries)
                      : currentProperty?.inquiries || []
                    )
                      .slice(0, 8)
                      .map((inq, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200 transition-all"
                        >
                          <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-blue-500 shadow-sm">
                              <FileText size={16} />
                            </div>
                            <div>
                              <p className="text-[11px] font-black text-slate-800 uppercase leading-none mb-1.5">
                                {inq.source || "Organic"}
                              </p>
                             <p 
  className="text-[9px] text-slate-400 font-bold uppercase flex items-center gap-1"
  suppressHydrationWarning // Add this attribute here
>
  <Clock size={10} />{" "}
  {new Date(inq.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    // Adding hour12: false forces both sides to use 24h format
    hour12: false 
  })}
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

          {/* VIEW: GUESTS */}
          {activeTab === "Guests" && (
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-8 lg:p-10 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <h3 className="font-black text-slate-900 uppercase italic text-2xl tracking-tighter">
                    Guest Master
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                    Registry and Identity Management
                  </p>
                </div>
                <div className="relative w-full md:w-80">
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder="Search Name, Room or Property..."
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
                      <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Resident
                      </th>
                      {isGlobal && (
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Property
                        </th>
                      )}
                      <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Unit
                      </th>
                      <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                        Pax
                      </th>
                      <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        ID/Aadhar Number
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredRooms.map((room: any, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-sm">
                              {room.guestName?.charAt(0)}
                            </div>
                            <span className="font-black text-slate-800 uppercase text-xs">
                              {room.guestName || "Unassigned"}
                            </span>
                          </div>
                        </td>
                        {isGlobal && (
                          <td className="p-6">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">
                              {room.propertyName || "Ethereal Inn"}
                            </span>
                          </td>
                        )}
                        <td className="p-6">
                          <span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-[10px] font-black italic">
                            #{room.number}
                          </span>
                        </td>
                        <td className="p-6 text-center">
                          <span className="text-xs font-black text-slate-700">
                            {room.totalGuests || 1}
                          </span>
                        </td>
                        <td className="p-6">
                          <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
                            {room.idNumber
                              ? room.idNumber.replace(/.(?=.{4})/g, "•")
                              : "•••• •••• ••••"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW: REPORTS */}
          {activeTab === "Reports" && (
            <div className="space-y-8">
              <div className="bg-slate-900 rounded-[3rem] p-8 lg:p-14 text-white shadow-2xl shadow-slate-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-10">
                  <BarChart3 size={200} />
                </div>
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.5em] mb-4">
                  {isGlobal ? "Portfolio Net Revenue" : "Property Performance"}
                </p>
                <h4 className="text-5xl lg:text-7xl font-black italic tracking-tighter mb-12">
                  ₹{" "}
                  {isGlobal
                    ? globalStats.netRevenue
                    : currentProperty?.finance?.totalCollection || 0}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative z-10">
                  <div className="p-8 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-md">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                      Total Collection
                    </p>
                    <p className="text-3xl font-black italic">
                      ₹{" "}
                      {isGlobal
                        ? globalStats.totalRevenue
                        : currentProperty?.finance?.totalCollection}
                    </p>
                  </div>
                  <div className="p-8 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-md">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                      Portfolio Margin
                    </p>
                    <p className="text-3xl font-black italic text-emerald-400">
                      {isGlobal ? globalStats.profitMargin : "N/A"}
                    </p>
                  </div>
                  <div className="p-8 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-md">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                      Operational Expenses
                    </p>
                    <p className="text-3xl font-black italic text-red-400">
                      ₹{" "}
                      {(isGlobal
                        ? properties.reduce(
                            (a, b) => a + Number(b.finance?.expenses || 0),
                            0
                          )
                        : Number(currentProperty?.finance?.expenses || 0)
                      ).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              </div>
              {!isGlobal && (
                <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 lg:p-10">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-8 italic flex items-center gap-3">
                    <ShieldCheck size={18} className="text-blue-600" /> Compliance &
                    Statutory Master
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {currentProperty?.statutory?.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center p-5 rounded-2xl bg-slate-50 border border-transparent hover:border-slate-200 transition-all"
                      >
                        <div>
                          <p className="text-xs font-black text-slate-800 uppercase mb-1">
                            {item.licenseName}
                          </p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase italic">
                            ID: {item.licenseNumber || "Pending"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-900 uppercase">
                            {item.expiryDate
                              ? new Date(item.expiryDate).toLocaleDateString()
                              : "N/A"}
                          </p>
                          <span className="text-[8px] font-black uppercase text-emerald-500 flex items-center justify-end gap-1">
                            <CheckCircle2 size={10} /> Valid
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW: CALENDAR */}
          {activeTab === "Calendar" && (
            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 lg:p-12 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
                <div>
                  <h3 className="font-black text-slate-900 uppercase italic text-3xl tracking-tighter">
                    Inventory Map
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                    {isGlobal
                      ? "Full Portfolio Visualization"
                      : "Property Unit Distribution"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-2.5 rounded-[1.5rem] border border-slate-200">
                  <LegendItem color="bg-emerald-500" label="Available" />
                  <LegendItem color="bg-amber-500" label="Occupied" />
                  <LegendItem color="bg-blue-400" label="Cleaning" />
                  <LegendItem color="bg-slate-400" label="Maintenance" />
                </div>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-11 gap-4">
                {(isGlobal
                  ? properties.flatMap((p) => p.rooms)
                  : currentProperty?.rooms || []
                )
                  .sort(
                    (a, b) =>
                      parseInt(a.number.toString()) -
                      parseInt(b.number.toString())
                  )
                  .map((room, idx) => {
                    let statusConfig = {
                      bg: "bg-emerald-500 border-emerald-600",
                      label: "Free",
                    };
                    if (room.status === "occupied") {
                      statusConfig = {
                        bg: "bg-amber-500 border-amber-600",
                        label: "Busy",
                      };
                    } else if (room.status === "cleaning") {
                      statusConfig = {
                        bg: "bg-blue-400 border-blue-500",
                        label: "Clean",
                      };
                    } else if (room.status === "maintenance") {
                      statusConfig = {
                        bg: "bg-slate-400 border-slate-500",
                        label: "Maint",
                      };
                    }
                    return (
                      <div
                        key={room.id || idx}
                        className={`aspect-square rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-sm border text-white ${statusConfig.bg}`}
                      >
                        <span className="text-xl font-black italic tracking-tighter leading-none mb-1">
                          {room.number}
                        </span>
                        <span className="text-[7px] font-black uppercase opacity-80">
                          {statusConfig.label}
                        </span>
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

// --- HELPER COMPONENTS ---
function SidebarLink({ icon, label, active, onClick }: any) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-4 px-6 py-4 rounded-2xl cursor-pointer transition-all duration-200 ${
        active
          ? "bg-blue-600 text-white shadow-xl shadow-blue-600/30 font-black"
          : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
      }`}
    >
      <span className={`${active ? "scale-110" : ""} transition-transform`}>
        {icon}
      </span>
      <span className="text-[11px] font-bold uppercase tracking-[0.2em]">
        {label}
      </span>
    </div>
  );
}

function StatCard({ icon, label, value, subText, bgColor }: any) {
  return (
    <div className="p-6 lg:p-8 rounded-[2rem] border border-slate-200 bg-white flex items-center gap-6 shadow-sm hover:shadow-md transition-all group overflow-hidden">
      <div
        className={`w-14 h-14 lg:w-16 lg:h-16 rounded-2xl ${bgColor} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-inner`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 truncate">
          {label}
        </p>
        <div className="flex items-baseline gap-2">
          <h4 className="text-2xl lg:text-3xl font-black text-slate-900 italic tracking-tighter leading-none truncate">
            {value}
          </h4>
          {subText && (
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate leading-none">
              {subText}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-100">
      <div className={`w-2.5 h-2.5 rounded-full ${color}`}></div>
      <span className="text-[9px] font-black uppercase text-slate-600 tracking-wider">
        {label}
      </span>
    </div>
  );
}