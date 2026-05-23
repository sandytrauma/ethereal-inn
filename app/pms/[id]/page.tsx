import { getMultiPropertyData, getAllProperties } from "@/lib/actions/pms-actions";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth"; 
import PMSDashboard from "@/components/pms/PMSDashboard";
import { notFound, redirect } from "next/navigation";
import { AlertCircle } from "lucide-react";

interface SessionPayload {
  name: string;
  role: "admin" | "manager" | "staff";
  email: string;
}

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
  let session: SessionPayload | null = null;
  
  try {
    if (token) session = await decrypt(token) as unknown as SessionPayload;
  } catch (authError) {
    redirect("/ethereal-inn");
  }

  if (!session) redirect("/ethereal-inn");

  try {
    // 2. MASTER PROPERTY DIRECTORY FETCH
    const baseFleet = await getAllProperties(); // Retrieves master property records
    
    const propertyExists = baseFleet?.some((p: any) => 
        String(p.id) === propertyId || String(p.slug) === propertyId
    );

    if (!isGlobal && !propertyExists) return notFound();

    const isRestricted = session.role === "staff";

    // 3. RESOLVE OPERATIONAL DATA PER EACH PROPERTY SCRIPT
    // This loops over each property to pull its linked operational metadata tables
   // 3. RESOLVE OPERATIONAL DATA PER EACH PROPERTY SCRIPT
// Guarded to ensure p.id is a valid string before passing it
const operationalFleetData = await Promise.all(
  (baseFleet || [])
    .filter((p: any) => p && p.id) // 1. Filter out any records missing an ID completely
    .map(async (p: any) => {
      try {
        // 2. Fallback or cast String(p.id) to guarantee a strict string parameter
        const propertyStringId = String(p.id); 
        const pData = await getMultiPropertyData(propertyStringId);
        
        return { propertyId: propertyStringId, data: pData };
      } catch (e) {
        console.error(`Failed to fetch data for property execution: ${p.id}`, e);
        return { propertyId: String(p.id), data: null };
      }
    })
);

    // Create a fast lookup map mapping data by property ID
    const operationalMap = new Map(operationalFleetData.map(item => [String(item.propertyId), item.data]));

    
 // =========================================================================
    // 4. HYDRATE PROPERTY STRUCTURES SAFELY WITH REAL DB RECORDS
    // =========================================================================
    const hydratedFleet = baseFleet?.map((p: any) => {
      const pStringId = String(p.id);
      const targetData = operationalMap.get(pStringId);

      // Extract explicit numbers or fallback to safe metric parsers
      const totalCol = parseFloat(String(targetData?.finance?.totalCollection || "0")) || 0;
      const upiRev = parseFloat(String(targetData?.finance?.upiRevenue || "0")) || 0;
      const cashRev = parseFloat(String(targetData?.finance?.cashRevenue || "0")) || 0;
      
      // FIX: Replace undefined property lookup (.expenses) with strict schema column (.pettyExpenses)
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
              expenses: exp, // Maps safely over to frontend layout interfaces
            },
        stats: targetData?.stats || { 
          arrivals: checkedInArrivalsCount, 
          occupancy: `${occupiedRoomsCount}/${totalRoomsCount}`, 
          occupancyPercent: totalRoomsCount ? `${Math.round((occupiedRoomsCount / totalRoomsCount) * 100)}%` : "0%"
        }
      };
    }) || [];

    // 5. CALCULATE TRUE AGGREGATED PORTFOLIO METRICS
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

        // Flatten database rows across global arrays
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
      // Find current active scope parameter if not global view
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
    console.error("Critical Failure:", error);
    return <ErrorFallback />;
  }
}

function ErrorFallback() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 p-6">
      <AlertCircle size={40} className="text-red-600 mb-4" />
      <h2 className="text-xl font-black uppercase tracking-tighter">Sync Error</h2>
      <a href="/pms/global" className="mt-6 rounded-xl bg-slate-900 px-6 py-3 text-white text-[10px] font-black uppercase tracking-widest">Retry Operations</a>
    </div>
  );
}