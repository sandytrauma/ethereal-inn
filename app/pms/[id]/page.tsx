// app/pms/[id]/page.tsx
import { getMultiPropertyData, getAllProperties } from "@/lib/actions/pms-actions";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth"; 
import PMSDashboard from "@/components/pms/PMSDashboard";
import { notFound, redirect } from "next/navigation";
import { AlertCircle } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MultiPropertyPage({ params }: PageProps) {
  const resolvedParams = await params;
  const propertyId = decodeURIComponent(resolvedParams.id);
  const isGlobal = propertyId === "global";

  // 1. AUTHENTICATION & ACCESS VERIFICATION
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  let session: any = null;
  
  try {
    if (token) session = await decrypt(token);
  } catch (authError) {
    redirect("/ethereal-inn");
  }

  if (!session) redirect("/ethereal-inn");

  // Normalize secure operational credentials
  const safeUserId = String(session.id || session.userId || session.sub || "");
  const safeUserRole = String(session.role || "staff").toLowerCase().trim();
  const isMasterSuperAdmin = Number(session.userId || session.id) === 1;
  const isRestricted = safeUserRole === "staff";

  try {
    // =========================================================================
    // 2. MASTER PROPERTY DIRECTORY FETCH — STRATIFIED ACCESS MATCH
    // =========================================================================
    const rawFleet = await getAllProperties();
    let baseFleet: Array<any> = [];

    if (isMasterSuperAdmin) {
      baseFleet = rawFleet || [];
    } else {
      const assignedPropertyId = session.propertyId;

      if (assignedPropertyId && assignedPropertyId !== "global" && assignedPropertyId !== "undefined" && assignedPropertyId !== "null") {
        baseFleet = (rawFleet || []).filter((p: any) => String(p.id) === String(assignedPropertyId));
      } else if (safeUserRole === "admin" || safeUserRole === "owner") {
        baseFleet = (rawFleet || []).filter((p: any) => Number(p.ownerId) === Number(safeUserId));
      }
    }
    
    const propertyExists = baseFleet?.some((p: any) => 
        String(p.id) === propertyId || String(p.slug) === propertyId
    );

    if (!isGlobal && !propertyExists) return notFound();

    // =========================================================================
    // 3. RESOLVE OPERATIONAL DATA PER EACH PROPERTY SCRIPT
    // =========================================================================
    const operationalFleetData = await Promise.all(
      (baseFleet || [])
        .filter((p: any) => p && p.id)
        .map(async (p: any) => {
          try {
            const propertyStringId = String(p.id); 
            const pData = await getMultiPropertyData(propertyStringId);
            
            return { propertyId: propertyStringId, data: pData };
          } catch (e) {
            console.error(`Failed to fetch data for property execution: ${p.id}`, e);
            return { propertyId: String(p.id), data: null };
          }
        })
    );

    const operationalMap = new Map(operationalFleetData.map(item => [String(item.propertyId), item.data]));

    // =========================================================================
    // 4. HYDRATE PROPERTY STRUCTURES SAFELY WITH REAL DB RECORDS
    // =========================================================================
    const hydratedFleet = baseFleet?.map((p: any) => {
      const pStringId = String(p.id);
      const targetData = operationalMap.get(pStringId);

      const totalCol = parseFloat(String(targetData?.finance?.totalCollection || "0")) || 0;
      const upiRev = parseFloat(String(targetData?.finance?.upiRevenue || "0")) || 0;
      const cashRev = parseFloat(String(targetData?.finance?.cashRevenue || "0")) || 0;
      const exp = parseFloat(String(targetData?.finance?.pettyExpenses || "0")) || 0;

      const totalRoomsCount = Number(targetData?.rooms?.length || p.rooms?.length || 0);
      
      const occupiedRoomsCount = targetData?.rooms?.filter((r: any) => 
        r.status === "occupied" || r.status === "Occupied" || r.status === "CheckedIn"
      ).length || 0;

      const checkedInArrivalsCount = targetData?.rooms?.filter((r: any) => 
        r.status === "CheckedIn"
      ).length || 0;

      return {
        ...p,
        rooms: targetData?.rooms || [],
        inquiries: targetData?.inquiries || [],
        statutory: isRestricted ? [] : (targetData?.statutory || []),
        finance: isRestricted 
          ? { totalCollection: 0, upiRevenue: 0, cashRevenue: 0, expenses: 0 } 
          : {
              totalCollection: totalCol,
              upiRevenue: upiRev,
              cashRevenue: cashRev,
              expenses: exp,
            },
        stats: targetData?.stats || { 
          arrivals: checkedInArrivalsCount, 
          occupancy: `${occupiedRoomsCount}/${totalRoomsCount}`, 
          // 🌟 FIXED: Changed totalPortfolioRooms to totalRoomsCount to match local variable context scope
          occupancyPercent: totalRoomsCount ? `${Math.round((occupiedRoomsCount / totalRoomsCount) * 100)}%` : "0%"
        }
      };
    }) || [];

    // =========================================================================
    // 5. CALCULATE TRUE AGGREGATED PORTFOLIO METRICS
    // =========================================================================
    let aggregateStats = { arrivals: 0, occupancy: "0/0", occupancyPercent: "0%" };
    let globalScopedData: any = { rooms: [], inquiries: [], statutory: [], tasks: [] };

    if (isGlobal) {
      let totalArrivals = 0;
      let occupiedRoomsCount = 0;
      let totalPortfolioRooms = 0;

      hydratedFleet.forEach((p: any) => {
        const [occupied, total] = (p.stats?.occupancy || "0/0").split("/").map(Number);
        totalArrivals += p.stats?.arrivals || 0;
        occupiedRoomsCount += occupied || 0;
        totalPortfolioRooms += total || 0;

        if (p.rooms) globalScopedData.rooms.push(...p.rooms);
        if (p.inquiries) globalScopedData.inquiries.push(...p.inquiries);
        if (p.statutory) globalScopedData.statutory.push(...p.statutory);
      });

      aggregateStats = {
        arrivals: totalArrivals,
        occupancy: `${occupiedRoomsCount}/${totalPortfolioRooms}`,
        occupancyPercent: totalPortfolioRooms ? `${Math.round((occupiedRoomsCount / totalPortfolioRooms) * 100)}%` : "0%"
      };
    } else {
      const activeScopedRecord = operationalMap.get(String(propertyId));
      globalScopedData = {
        rooms: activeScopedRecord?.rooms || [],
        tasks: activeScopedRecord?.tasks || [],
        inquiries: activeScopedRecord?.inquiries || [],
        statutory: isRestricted ? [] : (activeScopedRecord?.statutory || []),
        stats: activeScopedRecord?.stats || { arrivals: 0, occupancy: "0/0", occupancyPercent: "0%" }
      };
    }

    // 6. RENDER UPDATED DASHBOARD CONTEXT
    return (
      <main className="min-h-screen bg-[#F8FAFC]">
        <PMSDashboard 
          properties={hydratedFleet} 
          user={{ name: session.name, role: session.role }}
          rooms={globalScopedData.rooms}
          tasks={isGlobal ? [] : globalScopedData.tasks} 
          inquiries={globalScopedData.inquiries}
          statutory={globalScopedData.statutory}
          stats={isGlobal ? aggregateStats : globalScopedData.stats}
        />
      </main>
    );

  } catch (error) {
    console.error("Critical Failure inside MultiPropertyPage:", error);
    return <ErrorFallback />;
  }
}

function ErrorFallback() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 p-6 font-sans">
      <AlertCircle size={40} className="text-red-600 mb-4 animate-pulse" />
      <h2 className="text-xl font-black uppercase tracking-tighter text-slate-900">Sync Error</h2>
      <a href="/pms/global" className="mt-6 rounded-xl bg-slate-900 px-6 py-3 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-colors">
        Retry Operations
      </a>
    </div>
  );
}