// app/page.tsx
import { cookies, headers } from "next/headers";
import { decrypt } from "@/lib/auth";
import { db } from "@/db"; 
import { properties as propertiesTable } from "@/db/micro-schema"; 
import { eq, and } from "drizzle-orm"; 

import LandingLoginPage from "@/components/Login";
import PortfolioSummary from "@/components/admin/PortfolioSummary";
import Dashboard from "@/components/Dashboard";
import Footer from "@/components/layout/Footer";
import PurgeTestPropertyButton from "@/components/admin/PurgeTestPropertyButton";
import { users } from "@/db/schema";

interface Property {
  id: string; 
  name: string;
}

export default async function Page() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  // 1. Session Decryption Pass
  const session = token ? await decrypt(token).catch(() => null) : null;

  if (session) {
    const safeUser = {
      id: String((session as any).id || (session as any).userId || (session as any).sub || ""), 
      name: String((session as any).name || "Staff Member"),
      role: String((session as any).role || "staff").toLowerCase().trim(), 
      email: String((session as any).email || ""),
      propertyId: (session as any).propertyId ? String((session as any).propertyId) : "global"
    };

    if (!safeUser.id) return <LandingLoginPage />; 

    // 2. Read Subdomain Context from Middleware Headers
    const headersList = await headers();
    const tenantSlug = headersList.get('x-tenant-subdomain'); 

    let propertyList: Property[] = []; 
    const isMasterSuperAdmin = Number((session as any).userId || (session as any).id) === 1;

    try {
      let rawPropertiesData: Array<{ id: string | number; name: string | null }> = [];

      if (tenantSlug) {
        // =========================================================================
        // CASE A: SUBDOMAIN MODE (e.g., apex.localhost:3000)
        // =========================================================================
        if (isMasterSuperAdmin) {
          rawPropertiesData = await db
            .select({ id: propertiesTable.id, name: propertiesTable.name })
            .from(propertiesTable)
            .where(eq(propertiesTable.slug, tenantSlug));
        } else {
          rawPropertiesData = await db
            .select({ id: propertiesTable.id, name: propertiesTable.name })
            .from(propertiesTable)
            .where(eq(propertiesTable.slug, tenantSlug));

          const currentSessionPropId = (session as any).propertyId;
          const isAuthorizedUser = safeUser.role === "admin" || safeUser.role === "manager" || rawPropertiesData.some(p => String(p.id) === String(currentSessionPropId));
          
          if (!isAuthorizedUser) {
            rawPropertiesData = []; 
          }
        }
      } else {
        // =========================================================================
        // CASE B: ROOT DOMAIN MODE (e.g., localhost:3000)
        // =========================================================================
        if (isMasterSuperAdmin) {
          // Master Admin views all properties system-wide
          rawPropertiesData = await db
            .select({ id: propertiesTable.id, name: propertiesTable.name })
            .from(propertiesTable);
        } else {
          // =========================================================================
          // PRIORITIZE STRUCTURAL ASSIGNMENT MATCH:
          // Check if this specific account has a designated property link first,
          // regardless of whether they are an admin, manager, or staff role.
          // =========================================================================
          const assignedPropertyId = (session as any).propertyId || safeUser.propertyId;

          if (assignedPropertyId && assignedPropertyId !== "global" && assignedPropertyId !== "undefined" && assignedPropertyId !== "null") {
            rawPropertiesData = await db
              .select({ id: propertiesTable.id, name: propertiesTable.name })
              .from(propertiesTable)
              .where(eq(propertiesTable.id, assignedPropertyId));
          } else if (safeUser.role === "admin" || safeUser.role === "owner") {
            // FALLBACK ONLY: If they are the original tenant who registered the platform,
            // pull properties matching their unique corporate registration profile ID.
            rawPropertiesData = await db
              .select({ id: propertiesTable.id, name: propertiesTable.name })
              .from(propertiesTable)
              .where(eq(propertiesTable.ownerId, Number(safeUser.id)));
          } else {
            // 🛡️ DEEP FALLBACK CHECK: Look up the user table record directly for managers/staff
            const [userRecord] = await db
              .select({ propertyId: users.propertyId })
              .from(users)
              .where(eq(users.id, Number(safeUser.id)));

            if (userRecord?.propertyId) {
              rawPropertiesData = await db
                .select({ id: propertiesTable.id, name: propertiesTable.name })
                .from(propertiesTable)
                .where(eq(propertiesTable.id, userRecord.propertyId));
            }
          }
        }
      }

      // 3. Normalize ID to string to avoid Number/UUID conflicts across UI components
      propertyList = rawPropertiesData.map(p => ({
        id: String(p.id),
        name: p.name || "Unnamed Property"
      }));
    } catch (error) {
      console.error("Drizzle Fetch Error from micro-schema:", error);
    }

    // =========================================================================
    // NEW STARTUP ONBOARDING GATEKEEPER
    // Strictly intercept creators with 0 active property records
    // =========================================================================
    if (propertyList.length === 0 && (safeUser.role === "admin" || safeUser.role === "owner") && !isMasterSuperAdmin) {
      // If they are an assigned secondary administrator with an empty context link, show lock screen instead of the setup form
      const assignedPropertyId = (session as any).propertyId;
      if (assignedPropertyId === "global" || !assignedPropertyId) {
        return (
          <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-400 font-sans">
            <div className="w-12 h-12 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-2xl flex items-center justify-center font-black text-xl mb-4">⚠️</div>
            <h2 className="text-md font-black text-white uppercase tracking-wider">Workspace Assignment Required</h2>
            <p className="text-xs max-w-xs mt-2 leading-relaxed">Your profile is active as an administrator, but your account is not linked to an operational branch. Please contact your master manager to assign your starting property ID context.</p>
            <form action={async () => {
              'use server';
              const { cookies } = await import("next/headers");
              const cookieStore = await cookies();
              cookieStore.set("auth-token", "", { expires: new Date(0), path: '/' });
              const { redirect } = await import("next/navigation");
              redirect("/");
            }}>
              <button type="submit" className="mt-8 bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] uppercase tracking-widest px-6 py-4 rounded-xl shadow-2xl transition-all">
                Exit Terminal
              </button>
            </form>
          </div>
        );
      }

      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-200 font-sans">
          <div className="w-12 h-12 bg-blue-600/10 text-blue-500 border border-blue-500/20 rounded-2xl flex items-center justify-center font-black italic text-xl shadow-xl mb-6">E.</div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight italic">Initialize Workspace Identity</h2>
          <p className="text-slate-400 text-xs mt-2 max-w-xs leading-relaxed font-medium">Your startup account is verified. Let's configure your property and floor layout grids to deploy your active daybook ledger boards.</p>
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
            <a href="/occupancy/management" className="bg-white hover:bg-slate-200 text-slate-950 font-black text-[10px] uppercase tracking-widest px-6 py-4 rounded-xl shadow-2xl transition-all duration-200 hover:scale-105">Configure First Property</a>
            <form action={async () => {
              'use server';
              const { cookies } = await import("next/headers");
              const cookieStore = await cookies();
              cookieStore.set("auth-token", "", { expires: new Date(0), path: '/' });
              const { redirect } = await import("next/navigation");
              redirect("/");
            }}>
              <button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] uppercase tracking-widest px-6 py-4 rounded-xl shadow-2xl transition-all duration-200 active:scale-95">Logout Account</button>
            </form>
          </div>
        </div>
      );
    }

    if (propertyList.length === 0 && !isMasterSuperAdmin) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-400 font-sans">
          <AlertCircle className="text-rose-500 mb-4 animate-pulse" size={42} />
          <h2 className="text-md font-black text-white uppercase tracking-wider">Workspace Assignment Required</h2>
          <p className="text-xs max-w-xs mt-2 leading-relaxed text-slate-500">Your profile is active, but you are not linked to an operational property node. Please contact your supervisor to assign your terminal configuration.</p>
          <form action={async () => {
            'use server';
            const { cookies } = await import("next/headers");
            const cookieStore = await cookies();
            cookieStore.set("auth-token", "", { expires: new Date(0), path: '/' });
            const { redirect } = await import("next/navigation");
            redirect("/");
          }}>
            <button type="submit" className="mt-8 bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white border border-rose-500/20 font-black text-[10px] uppercase tracking-widest px-6 py-4 rounded-xl shadow-2xl transition-all duration-200 active:scale-95">Exit Terminal</button>
          </form>
        </div>
      );
    }

    // =========================================================================
    // ACTIVE WORKSPACE OPERATION RENDER
    // =========================================================================
    return (
      <div className="relative min-h-screen w-full bg-transparent overflow-x-hidden">
        <Dashboard user={safeUser} properties={propertyList}>
          {isMasterSuperAdmin ? (
            <PortfolioSummary />
          ) : (
            <div className="p-6 bg-slate-900/40 border border-white/5 backdrop-blur-md rounded-[2.5rem] mt-6 text-white max-w-4xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                    <h1 className="text-lg font-black tracking-tight uppercase italic leading-none">Tenant Workspace Cluster Node Secure</h1>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Active Tenant context successfully anchored to: <span className="text-amber-400 ml-1 font-black italic">{propertyList[0]?.name || "Isolated Partition"}</span></p>
                </div>
                {propertyList.length > 0 && (safeUser.role === "admin" || safeUser.role === "owner") && (
                  <PurgeTestPropertyButton propertyId={propertyList[0].id} />
                )}
              </div>
              <div className="mt-8 border-t border-white/5 pt-6 text-xs text-slate-500 font-medium">Use your sidebar tabs to view your active localized daybooks, run cash reconciliation summaries, or process checking cycles safely.</div>
            </div>
          )}
        </Dashboard>
        <Footer/>
      </div>
    );
  }

  return <LandingLoginPage />;
}

function AlertCircle({ className, size }: { className?: string, size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}