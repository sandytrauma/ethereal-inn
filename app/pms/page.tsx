// app/pms/page.tsx
import { db } from "@/db";
import { properties } from "@/db/micro-schema"; 
import { users } from "@/db/schema";
import { redirect } from "next/navigation";
import { Building2, Plus, Lock, AlertCircle } from "lucide-react";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { eq } from "drizzle-orm";

/**
 * PMSPage - Root entry point for the Property Management System.
 * Handles auto-redirection to the Global Dashboard or shows empty state.
 */
export default async function PMSPage() {
  // 1. AUTHENTICATION & SESSION VERIFICATION
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  
  let session: any = null;
  try {
    if (token) {
      session = await decrypt(token);
    }
  } catch (error) {
    console.error("Auth decryption failed:", error);
    redirect("/ethereal-inn");
  }

  if (!session) {
    redirect("/ethereal-inn");
  }

  // Normalize active user metrics
  const safeUserId = String(session.id || session.userId || session.sub || "");
  const safeUserRole = String(session.role || "staff").toLowerCase().trim();
  const isMasterSuperAdmin = Number(session.userId || session.id) === 1;

  // 2. DATA FETCHING WITH STRICT MULTI-TENANT BOUNDARY
  let hasProperties = false;
  try {
    let countResult: Array<{ id: string | number }> = [];

    if (isMasterSuperAdmin) {
      // Master Admin scans across the entire system infrastructure
      countResult = await db.select({ id: properties.id }).from(properties).limit(1);
    } else {
      // =========================================================================
      // 🌟 THE STRUCTURAL ACCESS MATRIX FIX:
      // Prioritize explicit property linkage over creator ownership restrictions!
      // =========================================================================
      const assignedPropertyId = session.propertyId;

      if (assignedPropertyId && assignedPropertyId !== "global" && assignedPropertyId !== "undefined" && assignedPropertyId !== "null") {
        countResult = await db
          .select({ id: properties.id })
          .from(properties)
          .where(eq(properties.id, assignedPropertyId))
          .limit(1);
      } else if (safeUserRole === "admin" || safeUserRole === "owner") {
        // Creator Fallback rule: Isolate directly by their ownership registration field
        countResult = await db
          .select({ id: properties.id })
          .from(properties)
          .where(eq(properties.ownerId, Number(safeUserId)))
          .limit(1);
      } else {
        // Deep DB fallback lookups against users directory table data configurations
        const [userRecord] = await db
          .select({ propertyId: users.propertyId })
          .from(users)
          .where(eq(users.id, Number(safeUserId)));

        if (userRecord?.propertyId) {
          countResult = await db
            .select({ id: properties.id })
            .from(properties)
            .where(eq(properties.id, userRecord.propertyId))
            .limit(1);
        }
      }
    }
    
    hasProperties = countResult.length > 0;
  } catch (dbError) {
    console.error("Database fetch failed in PMSPage:", dbError);
    return <ErrorState message="Database connection interrupted. Please check your Neon PostgreSQL connection." />;
  }

  // 3. AUTO-REDIRECT LOGIC (Now completely safe and scoped for multi-role admins)
  if (hasProperties) {
    redirect(`/pms/global`);
  }

  // 4. PERMISSION LOGIC FOR EMPTY STATE VISIBILITY
  const isAdmin = safeUserRole === "admin" || safeUserRole === "owner" || session.name === "Sandeep kumar";

  return (
    <div className="relative flex h-screen flex-col items-center justify-center bg-[#F8FAFC] p-8 text-center overflow-hidden font-sans selection:bg-blue-500 selection:text-white">
      
      {/* Visual Depth Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-50 rounded-full blur-[120px] opacity-60" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-50 rounded-full blur-[120px] opacity-60" />

      <div className="relative z-10 animate-in fade-in zoom-in duration-700">
        <div className="mb-8 mx-auto flex h-28 w-28 items-center justify-center rounded-[3rem] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 group transition-all hover:scale-110 hover:rotate-3">
          {isAdmin ? (
            <Building2 size={48} className="text-blue-600" />
          ) : (
            <Lock size={48} className="text-slate-300" />
          )}
        </div>
        
        <h1 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
          {isAdmin ? "Empty Portfolio" : "Access Denied"}
        </h1>
        
        <p className="mt-6 max-w-sm mx-auto text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400 leading-relaxed italic">
          {isAdmin 
            ? "Your HMS environment is live, but no properties are registered. Initialize your first asset to begin Ethereal Inn Hospitality operations."
            : "No active properties are mapped to your credentials. Restricted access is enforced. Contact system administrator Sandeep kumar."
          }
        </p>

        <div className="mt-12 flex flex-col items-center gap-4">
          {isAdmin ? (
            <a 
              href="/pms/setup" 
              className="flex items-center gap-3 rounded-2xl bg-slate-900 px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-2xl shadow-slate-900/30 transition-all hover:bg-blue-600 hover:shadow-blue-600/40 active:scale-95"
            >
              <Plus size={18} />
              Register New Asset
            </a>
          ) : (
            // Form action layout to allow immediate secure breakout exit clears
            <form action={async () => {
              'use server';
              const { cookies } = await import("next/headers");
              const cookieStore = await cookies();
              cookieStore.set("auth-token", "", { expires: new Date(0), path: '/' });
              const { redirect } = await import("next/navigation");
              redirect("/");
            }}>
              <button 
                type="submit"
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 transition-all hover:bg-rose-600 hover:text-white hover:border-rose-600 shadow-sm duration-200"
              >
                Exit Terminal
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Persistence/Version Branding */}
      <div className="absolute bottom-10 flex items-center gap-6 opacity-25">
        <div className="h-[1px] w-16 bg-slate-400" />
        <div className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500">
          Ethereal Core v1.0.6
        </div>
        <div className="h-[1px] w-16 bg-slate-400" />
      </div>
    </div>
  );
}

/**
 * Fallback UI for Database Errors
 */
function ErrorState({ message }: { message: string }) {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-white p-10 font-sans">
      <AlertCircle size={48} className="text-red-500 mb-4" />
      <h2 className="text-lg font-black uppercase italic tracking-widest text-slate-900">System Offline</h2>
      <p className="text-[10px] font-bold text-slate-400 uppercase mt-2 max-w-xs text-center">{message}</p>
      <a href="/pms" className="mt-8 text-[10px] font-black uppercase text-blue-600 border-b-2 border-blue-600 pb-1 hover:text-blue-800 hover:border-blue-800 transition-colors">
        Retry Connection
      </a>
    </div>
  );
}