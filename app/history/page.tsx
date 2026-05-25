// app/history/page.tsx
import { getCheckoutHistory } from "./data-fetcher";
import CheckoutTable from "@/components/dashboard/GuestCheckoutHistory";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { redirect } from "next/navigation";

// 🌟 THE RUNTIME FIX: Force dynamic execution to guarantee real-time synchronization 
// whenever an administrator invokes a property context switch change!
export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  // 1. REJECT UNAUTHENTICATED REQUESTS OUTSIDE WORKSPACE SESSIONS
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  const session = token ? await decrypt(token).catch(() => null) : null;

  if (!session) {
    redirect("/ethereal-inn");
  }

  // 2. Fetch data (Server action checks permissions internally and isolates by active session propertyId)
  const data = await getCheckoutHistory();

  return (
    <div className="min-h-screen bg-transparent selection:bg-amber-400 selection:text-black">
      {/* Using Suspense ensures that if the DB is slow, 
          the rest of the dashboard doesn't freeze 
      */}
      <Suspense fallback={<HistorySkeleton />}>
        <div className="max-w-7xl mx-auto py-10 px-4">
          <header className="mb-10">
            <h1 className="text-4xl font-serif font-bold text-white uppercase italic tracking-tighter">
              Guest <span className="text-amber-500">History</span>
            </h1>
            <p className="text-gray-400 text-sm mt-2 font-light tracking-wide uppercase text-[10px]">
              Managing records for Ethereal Inn Hospitality LLP
            </p>
          </header>

          {data && data.length > 0 ? (
            <CheckoutTable checkoutData={data} />
          ) : (
            <div className="bg-white/5 border border-dashed border-white/10 rounded-3xl p-20 text-center backdrop-blur-sm">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/5 border border-amber-400/10 flex items-center justify-center mx-auto mb-4 text-amber-500 text-lg font-bold">
                📋
              </div>
              <p className="text-gray-400 font-medium text-sm uppercase tracking-wider">No checkout records found</p>
              <p className="text-gray-600 text-xs mt-1 max-w-xs mx-auto leading-relaxed">
                Once a guest completes their billing cycle and check-out processing, their operational transaction logs will update here.
              </p>
            </div>
          )}
        </div>
      </Suspense>
    </div>
  );
}

// Simple loading state for better User Experience
function HistorySkeleton() {
  return (
    <div className="p-10 animate-pulse max-w-7xl mx-auto">
      <div className="h-4 w-32 bg-white/5 rounded mb-4" />
      <div className="h-10 w-64 bg-white/10 rounded mb-10" />
      <div className="h-96 w-full bg-white/5 rounded-3xl border border-white/5" />
    </div>
  );
}