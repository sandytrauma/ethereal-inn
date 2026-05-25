import { db } from "@/db";
import { properties } from "@/db/micro-schema";
import { users } from "@/db/schema";
import { getRoomsList } from "@/lib/actions/room-actions";
import RoomOccupancyClient from "./RoomOccupancyClient";
import SeedButton from "./SeedButton"; 
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { eq, or } from "drizzle-orm";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function OccupancyPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;

  // =========================================================================
  // 1. SECURE SESSION EXTRACTION PASS
  // =========================================================================
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  const session = token ? await decrypt(token).catch(() => null) : null;

  if (!session) {
    redirect("/ethereal-inn");
  }

  const safeUserId = String((session as any).id || (session as any).userId || (session as any).sub || "");
  const safeUserRole = String((session as any).role || "staff").toLowerCase().trim();
  const isMasterSuperAdmin = Number((session as any).userId || (session as any).id) === 1;

  // =========================================================================
  // 2. ISOLATED MULTI-TENANT PROPERTIES ACCESS MAPPING (FIXED)
  // =========================================================================
  let allProperties: Array<any> = [];

  if (isMasterSuperAdmin) {
    // Master Super Admin profile (ID: 1) retains visibility over all branches
    allProperties = await db.select().from(properties);
  } else {
    // 🌟 THE STRUCTURAL SECURITY FIX: Read their assigned property link profile context parameter
    const assignedPropertyId = (session as any).propertyId;

    if (assignedPropertyId && assignedPropertyId !== "global" && assignedPropertyId !== "undefined" && assignedPropertyId !== "null") {
      allProperties = await db
        .select()
        .from(properties)
        .where(eq(properties.id, assignedPropertyId));
    } else if (safeUserRole === "admin" || safeUserRole === "owner") {
      // Creator Fallback rule: Pull assets matching original B2B register token ID
      allProperties = await db
        .select()
        .from(properties)
        .where(eq(properties.ownerId, Number(safeUserId)));
    } else {
      // Deep DB relational cross-check against users fallback
      const [userRecord] = await db
        .select({ propertyId: users.propertyId })
        .from(users)
        .where(eq(users.id, Number(safeUserId)));

      if (userRecord?.propertyId) {
        allProperties = await db
          .select()
          .from(properties)
          .where(eq(properties.id, userRecord.propertyId));
      }
    }
  }
  
  // 3. Get the Target operational node parameter ID from the dynamic URL address bar
  let propertyId = typeof resolvedParams.propertyId === 'string' ? resolvedParams.propertyId : "";

  // =========================================================================
  // 4. AUTO-REDIRECT LOGIC: Safely scopes to the tenant's first isolated site!
  // =========================================================================
  if (!propertyId && allProperties.length > 0) {
    redirect(`/occupancy?propertyId=${allProperties[0].id}`);
  }

  // Cross-Verify Ownership: Prevent an adversarial tenant from typing an admin property UUID manually into the URL
  const isAuthorizedToView = isMasterSuperAdmin || allProperties.some(p => p.id === propertyId);
  if (propertyId && !isAuthorizedToView) {
    // Handle unlinked edge conditions safely: bounce them back to their assigned cluster fallback root
    if (allProperties.length > 0) {
      redirect(`/occupancy?propertyId=${allProperties[0].id}`);
    } else {
      redirect("/"); // Send completely unassigned users cleanly back home to trigger the access lock screen
    }
  }

  const rawPrefill = resolvedParams.prefillGuest;
  const prefill = (rawPrefill && rawPrefill !== "undefined") ? String(rawPrefill) : null;

  // 5. Only fetch rooms if we have a valid-looking string
  const initialRooms = propertyId ? await getRoomsList(propertyId) : [];

  // 6. Render Empty/Seed state if no rooms exist for this property
  if (!initialRooms || initialRooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#020617] p-8 text-center relative overflow-hidden font-sans">
        {/* Background Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-400/5 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20 pointer-events-none" />
        
        {/* Switcher available even in empty state — Now contains only isolated, safe options */}
        <div className="absolute top-8 right-8 z-50">
           <RoomOccupancyClient 
             properties={allProperties} 
             currentPropertyId={propertyId} 
             initialRooms={[]} 
             onlySwitcher={true} 
           />
        </div>

        <div className="relative mb-12">
          <div className="relative space-y-6">
            <div className="flex flex-col items-center">
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-amber-500 text-[10px] font-black uppercase tracking-[0.6em]">
                        System Status: Offline
                    </span>
                </div>
                
                <h2 className="text-white text-6xl md:text-9xl font-black tracking-tighter italic uppercase leading-[0.75] mb-2">
                  Inventory <br />
                  <span className="text-amber-400">Zero</span>
                </h2>
                <p className="text-white/20 text-xs font-black uppercase mt-4">Property Context: {propertyId || "Undefined Site"}</p>
            </div>
            
            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-[0.3em] max-w-md mx-auto leading-relaxed mt-4">
              The operational grid is currently unpopulated. <br />
              <span className="text-slate-700">Define your property scale below to initialize the cluster.</span>
            </p>
          </div>
        </div>
        
        {/* Protect Seed Action Trigger: Only expose seed deployment hooks to tenant level admins */}
        {(safeUserRole === "admin" || safeUserRole === "owner" || isMasterSuperAdmin) ? (
          <div className="relative z-10 scale-100 hover:scale-[1.02] transition-all duration-700 ease-out">
            <SeedButton propertyId={propertyId} />
          </div>
        ) : (
          <p className="text-rose-500/70 font-black tracking-widest text-[9px] uppercase border border-rose-500/10 bg-rose-500/5 px-6 py-4 rounded-xl">
            Room Generation Rights Restricted to Business Administrators
          </p>
        )}

        <div className="mt-20 flex items-center gap-8 text-[10px] text-slate-800 font-black uppercase tracking-[0.5em] opacity-40">
            <div className="h-[1px] w-16 bg-slate-900" />
            Ethereal Inn Core v1.0.4
            <div className="h-[1px] w-16 bg-slate-900" />
        </div>
      </div>
    );
  }

  // 7. Render the Client Grid
  return (
    <div className="min-h-screen bg-[#020617] selection:bg-amber-400/30">
        <RoomOccupancyClient 
          properties={allProperties} 
          currentPropertyId={propertyId}
          initialRooms={initialRooms} 
          prefillName={prefill} 
          key={propertyId} 
        />
    </div>
  );
}