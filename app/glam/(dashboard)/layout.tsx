// app/glam/(dashboard)/layout.tsx
import { redirect } from "next/navigation";
import { getSalonSession } from "@/lib/salon-token";
import { logoutSalonOperator } from "@/lib/actions/salon-logout"; // 🌟 THE PRODUCTION FIX: Import centralized operator logout action

export default async function SalonDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 🌟 Real Server-Side Cryptographic Token Decryption
  const session = await getSalonSession();

  // 🛡️ SECURITY GATEWAY: Bounces unauthorized requests straight back to the login block
  if (!session) {
    redirect("/glam/login?error=Session Expired or Invalid");
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-white selection:bg-pink-500 selection:text-white">
      {/* 🧭 Shared Salon Enterprise Sidebar (Outlets Switcher, Tokens, Schedules) */}
      <aside className="w-66 border-r border-slate-800/80 bg-slate-900/60 backdrop-blur-md p-6 hidden md:block select-none">
        <div className="mb-8 pb-4 border-b border-slate-800/60">
          <h2 className="text-xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-400">
            ETHEREAL GLAM
          </h2>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mt-1">
            SaaS Tenant Dashboard
          </p>
        </div>
        <nav className="space-y-1">
          <a href="/glam/dashboard" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg bg-slate-800 text-pink-400 border border-slate-700/50 transition">
            Dashboard Overview
          </a>
          <a href="/glam/appointments" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition">
            Appointments Calendar
          </a>
          <a href="/glam/queue" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition">
            Live Token Queue
          </a>
        </nav>
      </aside>

      {/* 💻 Main Workspace Container */}
      <main className="flex-1 p-8 bg-slate-950">
        <header className="mb-8 flex justify-between items-center border-b border-slate-800/60 pb-5">
          <div className="space-y-1">
            <h1 className="text-xs text-slate-400 font-medium">
              Welcome back, <span className="text-slate-100 font-bold">{session.name}</span> (<span className="capitalize">{session.role}</span>)
            </h1>
            <div className="text-[11px] font-mono text-slate-500">
              Tenant ID: <span className="text-pink-500/80">{session.tenantId}</span>
            </div>
          </div>
          
          {/* 🌟 THE PRODUCTION FIX: Execute your dedicated form action coordinator directly */}
          <form action={logoutSalonOperator}>
            <button 
              type="submit" 
              className="text-xs px-4 py-2 font-semibold bg-red-950/30 border border-red-800/60 rounded-lg text-red-300 hover:bg-red-900/50 transition cursor-pointer select-none"
            >
              Sign Out Securely
            </button>
          </form>
        </header>

        {/* Render child route panels cleanly inside this safe perimeter slot */}
        <div className="animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}