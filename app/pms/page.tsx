import { db } from "@/db";
import { properties } from "@/db/micro-schema"; // Changed from micro-schema to match standard path
import { redirect } from "next/navigation";
import { Building2, Plus, Lock } from "lucide-react";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";

export default async function PMSPage() {
  // 1. AUTHENTICATION CHECK
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  const session = token ? await decrypt(token) : null;

  if (!session) {
    redirect("/ethereal-inn");
  }

  // 2. FETCH PROPERTY DATA
  const firstProperty = await db.select().from(properties).limit(1);

  // 3. AUTO-REDIRECT LOGIC
  if (firstProperty && firstProperty.length > 0) {
    redirect(`/pms/${firstProperty[0].id}`);
  }

  // 4. ROLE-BASED EMPTY STATE
  // Only admins should see the "Add Property" button
  const isAdmin = session.role === "admin";

  return (
    <div className="relative flex h-screen flex-col items-center justify-center bg-[#F8FAFC] p-8 text-center overflow-hidden">
      
      {/* Decorative Background Element */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-indigo-50 rounded-full blur-3xl opacity-50" />

      <div className="relative z-10">
        <div className="mb-8 mx-auto flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-white shadow-2xl shadow-slate-200 border border-slate-100 group transition-transform hover:scale-105">
          {isAdmin ? (
            <Building2 size={44} className="text-blue-600" />
          ) : (
            <Lock size={44} className="text-slate-300" />
          )}
        </div>
        
        <h1 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
          {isAdmin ? "Empty Portfolio" : "Unauthorized Access"}
        </h1>
        
        <p className="mt-4 max-w-sm mx-auto text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 leading-relaxed italic">
          {isAdmin 
            ? "Your HMS environment is ready, but no properties have been registered yet. Initialize your first asset to begin management."
            : "No active properties were found associated with your account permissions. Please contact your system administrator."
          }
        </p>

        {isAdmin && (
          <button className="mt-10 flex items-center gap-3 mx-auto rounded-2xl bg-slate-900 px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-2xl shadow-slate-900/20 transition-all hover:bg-blue-600 hover:shadow-blue-600/30 active:scale-95">
            <Plus size={18} />
            Register Property
          </button>
        )}

        {!isAdmin && (
          <button 
            onClick={async () => { "use server"; redirect("/ethereal-inn"); }}
            className="mt-10 flex items-center gap-3 mx-auto rounded-2xl border border-slate-200 bg-white px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 transition-all hover:bg-slate-50 shadow-sm"
          >
            Switch Account
          </button>
        )}
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-10 flex items-center gap-4 opacity-30">
        <div className="h-[1px] w-12 bg-slate-300" />
        <div className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400">
          Core Engine v1.0.4
        </div>
        <div className="h-[1px] w-12 bg-slate-300" />
      </div>
    </div>
  );
}