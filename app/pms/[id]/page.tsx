import { getMultiPropertyData, getAllProperties } from "@/lib/actions/pms-actions";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth"; 
import PMSDashboard from "@/components/pms/PMSDashboard";
import { notFound, redirect } from "next/navigation";
import { AlertCircle, RefreshCcw } from "lucide-react";

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

  // 1. AUTHENTICATION
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  let session: SessionPayload | null = null;
  
  try {
    if (token) session = await decrypt(token) as unknown as SessionPayload;
  } catch (authError) {
    redirect("/ethereal-inn");
  }

  if (!session) redirect("/ethereal-inn");

  // 2. DATA FETCHING
  try {
    const [data, fleet] = await Promise.all([
      isGlobal ? Promise.resolve(null) : getMultiPropertyData(propertyId),
      getAllProperties() // This must return properties with nested rooms/finance
    ]);

    const propertyExists = fleet?.some((p: any) => 
        String(p.id) === propertyId || String(p.slug) === propertyId
    );

    if (!isGlobal && !propertyExists) return notFound();

    const isRestricted = session.role === "staff";
    
    /**
     * FIX: HYDRATION LOGIC FOR GLOBAL VIEW
     * If isGlobal is true, we rely on the nested data inside the 'fleet' array.
     */
    const hydratedFleet = fleet?.map((p: any) => {
      const isCurrentProp = String(p.id) === propertyId || String(p.slug) === propertyId;
      
      // If we are in global mode, 'data' is null, so we use 'p' (the fleet item)
      const dataSource = isCurrentProp ? data : p;

      return {
        ...p,
        rooms: dataSource?.rooms || [],
        inquiries: dataSource?.inquiries || [],
        statutory: isRestricted ? [] : (dataSource?.statutory || []),
        finance: isRestricted 
          ? { totalCollection: 0, upiRevenue: 0, cashRevenue: 0, expenses: 0 } 
          : {
              totalCollection: parseFloat(dataSource?.finance?.totalCollection) || 0,
              upiRevenue: parseFloat(dataSource?.finance?.upiRevenue) || 0,
              cashRevenue: parseFloat(dataSource?.finance?.cashRevenue) || 0,
              expenses: parseFloat(dataSource?.finance?.pettyExpenses) || 0,
            },
        stats: dataSource?.stats || { arrivals: 0, occupancy: "0/0", occupancyPercent: "0%" }
      };
    }) || [];

    // 3. RENDER DASHBOARD
    return (
      <main className="min-h-screen bg-[#F8FAFC]">
        <PMSDashboard 
          properties={hydratedFleet} 
          user={{ name: session.name, role: session.role }}
          // In global view, these top-level props should be the aggregate of all rooms/tasks
          rooms={isGlobal ? hydratedFleet.flatMap(p => p.rooms) : (data?.rooms || [])}
          tasks={isGlobal ? [] : (data?.tasks || [])} 
          inquiries={isGlobal ? hydratedFleet.flatMap(p => p.inquiries) : (data?.inquiries || [])}
          statutory={isRestricted ? [] : (isGlobal ? hydratedFleet.flatMap(p => p.statutory) : (data?.statutory || []))}
          stats={data?.stats || { arrivals: 0, occupancy: "0/0", occupancyPercent: "0%" }}
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
      <a href="/pms/global" className="mt-6 rounded-xl bg-slate-900 px-6 py-3 text-white text-[10px] font-black uppercase tracking-widest">Retry</a>
    </div>
  );
}