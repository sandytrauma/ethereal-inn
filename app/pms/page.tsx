import { db } from "@/db";
import { properties } from "@/db/micro-schema"; 
import { redirect } from "next/navigation";
import { Building2, Plus, Lock, AlertCircle } from "lucide-react";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";

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

  // 2. DATA FETCHING WITH ERROR BOUNDARY
  let hasProperties = false;
  try {
    // Check if any properties exist in the portfolio
    const countResult = await db.select({ 
      id: properties.id 
    }).from(properties).limit(1);
    
    hasProperties = countResult.length > 0;
  } catch (dbError) {
    console.error("Database fetch failed in PMSPage:", dbError);
    return <ErrorState message="Database connection interrupted. Please check your Neon PostgreSQL connection." />;
  }

  // 3. AUTO-REDIRECT LOGIC
  // If assets exist, redirect to the Global view to see the aggregated fleet data.
  if (hasProperties) {
    redirect(`/pms/global`);
  }

  // 4. PERMISSION LOGIC
  // Admin check includes explicit check for Sandeep kumar
  const isAdmin = session.role === "admin" || session.name === "Sandeep kumar";

  return (
    <div className="relative flex h-screen flex-col items-center justify-center bg-[#F8FAFC] p-8 text-center overflow-hidden">
      
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
            <a 
              href="/ethereal-inn"
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 transition-all hover:bg-slate-50 shadow-sm"
            >
              Re-authenticate
            </a>
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
    <div className="h-screen w-full flex flex-col items-center justify-center bg-white p-10">
      <AlertCircle size={48} className="text-red-500 mb-4" />
      <h2 className="text-lg font-black uppercase italic tracking-widest text-slate-900">System Offline</h2>
      <p className="text-[10px] font-bold text-slate-400 uppercase mt-2 max-w-xs text-center">{message}</p>
      <a href="/pms" className="mt-8 text-[10px] font-black uppercase text-blue-600 border-b-2 border-blue-600 pb-1 hover:text-blue-800 hover:border-blue-800 transition-colors">
        Retry Connection
      </a>
    </div>
  );
}