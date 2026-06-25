import { cookies, headers } from "next/headers";
import { decrypt } from "@/lib/auth";
import { db } from "@/db"; 
import { sql } from "drizzle-orm"; 
import LandingLoginPage from "@/components/Login";
import PortfolioSummary from "@/components/admin/PortfolioSummary";
import Dashboard from "@/components/Dashboard";
import Footer from "@/components/layout/Footer";
import PurgeTestPropertyButton from "@/components/admin/PurgeTestPropertyButton";

interface Property {
  id: string; 
  name: string;
}

export default async function Page() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

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

    const headersList = await headers();
    const tenantSlug = headersList.get('x-tenant-subdomain'); 

    let propertyList: Property[] = []; 
    const isMasterSuperAdmin = Number((session as any).userId || (session as any).id) === 1;

    try {
      let rawPropertiesData: Array<{ id: string | number; name: string | null }> = [];

      if (tenantSlug) {
        const result = await db.execute(sql`
          SELECT "id", "name" FROM "public"."properties" WHERE "slug" = ${tenantSlug}
        `);
        rawPropertiesData = result.rows as any;

        if (!isMasterSuperAdmin) {
          const currentSessionPropId = (session as any).propertyId;
          const isAuthorizedUser = safeUser.role === "admin" || safeUser.role === "manager" || rawPropertiesData.some(p => String(p.id) === String(currentSessionPropId));
          if (!isAuthorizedUser) rawPropertiesData = []; 
        }
      } else {
        if (isMasterSuperAdmin) {
          const result = await db.execute(sql`SELECT "id", "name" FROM "public"."properties"`);
          rawPropertiesData = result.rows as any;
        } else {
          const assignedPropertyId = (session as any).propertyId || safeUser.propertyId;

          if (assignedPropertyId && assignedPropertyId !== "global" && assignedPropertyId !== "undefined" && assignedPropertyId !== "null") {
            const result = await db.execute(sql`SELECT "id", "name" FROM "public"."properties" WHERE "id" = ${assignedPropertyId}`);
            rawPropertiesData = result.rows as any;
          } else if (safeUser.role === "admin" || safeUser.role === "owner") {
            const result = await db.execute(sql`SELECT "id", "name" FROM "public"."properties" WHERE "owner_id" = ${Number(safeUser.id)}`);
            rawPropertiesData = result.rows as any;
          } else {
            const userRec = await db.execute(sql`SELECT "propertyId" FROM "public"."users" WHERE "id" = ${Number(safeUser.id)}`);
            const userRecord = userRec.rows[0] as any;

            if (userRecord?.propertyId) {
              const result = await db.execute(sql`SELECT "id", "name" FROM "public"."properties" WHERE "id" = ${userRecord.propertyId}`);
              rawPropertiesData = result.rows as any;
            }
          }
        }
      }

      propertyList = rawPropertiesData.map(p => ({
        id: String(p.id),
        name: p.name || "Unnamed Property"
      }));
    } catch (error) {
      console.error("Drizzle Raw SQL Fetch Error:", error);
    }

    // =========================================================================
    // ONBOARDING GATEKEEPERS
    // =========================================================================
    if (propertyList.length === 0 && (safeUser.role === "admin" || safeUser.role === "owner") && !isMasterSuperAdmin) {
      return (
          <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-400 font-sans">
            <div className="w-12 h-12 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-2xl flex items-center justify-center font-black text-xl mb-4">⚠️</div>
            <h2 className="text-md font-black text-white uppercase tracking-wider">Workspace Assignment Required</h2>
            <p className="text-xs max-w-xs mt-2 leading-relaxed">Your profile is active, but your account is not linked to an operational branch.</p>
          </div>
      );
    }

    if (propertyList.length === 0 && !isMasterSuperAdmin) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-400 font-sans">
          <h2 className="text-md font-black text-white uppercase tracking-wider">Workspace Assignment Required</h2>
          <p className="text-xs max-w-xs mt-2 leading-relaxed text-slate-500">Please contact your supervisor to assign your terminal configuration.</p>
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
            </div>
          )}
        </Dashboard>
        <Footer/>
      </div>
    );
  }

  return <LandingLoginPage />;
}