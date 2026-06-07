// app/glam/(dashboard)/layout.tsx
import { redirect } from "next/navigation";
import { getSalonSession } from "@/lib/salon-token";
import { logoutSalonOperator } from "@/lib/actions/salon-logout";
import Link from "next/link"; // 🌟 Added to eliminate structural full-page reloads

// 🌟 Integrated lucide icon sets matching the thumb-ready navigation layout
import { LayoutDashboard, CalendarDays, Users2, PackageCheck } from "lucide-react";

export default async function SalonDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSalonSession();

  if (!session) {
    redirect("/glam/login?error=Session Expired or Invalid");
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-white selection:bg-pink-500 selection:text-white">
      
      {/* =========================================================================
          🌟 DESKTOP RADIAL SIDEBAR DRAWER PANEL (HIDDEN ON PHONES NATIVELY)
         ========================================================================= */}
      <aside className="w-66 border-r border-slate-800/80 bg-slate-900/60 backdrop-blur-md p-6 hidden md:block select-none">
        <div className="mb-8 pb-4 border-b border-slate-800/60">
          <h2 className="text-xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-400">
            ETHEREAL GLAM
          </h2>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mt-1">
            SaaS Tenant Dashboard
          </p>
        </div>
        
        {/* Optimized Structural Application Routers */}
        <nav className="space-y-1.5">
          <Link href="/glam/dashboard" className="flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl bg-slate-800 text-pink-400 border border-slate-700/50 transition-all">
            <LayoutDashboard size={16} strokeWidth={2.5} />
            Dashboard Overview
          </Link>
          <Link href="/glam/appointments" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border border-transparent hover:border-slate-800 transition-all">
            <CalendarDays size={16} />
            Appointments Matrix
          </Link>
          <Link href="/glam/queue" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border border-transparent hover:border-slate-800 transition-all">
            <Users2 size={16} />
            Sequence Runway
          </Link>
          <Link href="/glam/inventory" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border border-transparent hover:border-slate-800 transition-all">
            <PackageCheck size={16} />
            Stock Inventory
          </Link>
        </nav>
      </aside>

      {/* =========================================================================
          MAIN INTERACTIVE CONTAINER DISPLAY REGION
         ========================================================================= */}
      <main className="flex-1 p-4 sm:p-8 bg-slate-950 overflow-y-auto">
        <header className="mb-6 flex justify-between items-center border-b border-slate-800/60 pb-5 gap-4">
          <div className="space-y-1 truncate">
            <h1 className="text-xs text-slate-400 font-medium truncate">
              Welcome back, <span className="text-slate-100 font-bold">{session.name}</span> (<span className="capitalize text-pink-400 font-medium">{session.role}</span>)
            </h1>
            <div className="text-[10px] font-mono text-slate-500 truncate">
              Workspace Identifier: <span className="text-slate-400 font-bold select-all">{session.tenantId}</span>
            </div>
          </div>

          <form action={logoutSalonOperator} className="flex-shrink-0">
            <button 
              type="submit" 
              className="text-xs px-4 py-2.5 font-bold bg-red-950/20 border border-red-900/40 rounded-xl text-red-400 hover:bg-red-950/50 hover:border-red-800/60 transition cursor-pointer select-none"
            >
              Sign Out Securely
            </button>
          </form>
        </header>

        {/* Dynamic Client Shell Render Boundary Node */}
        <div className="animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}