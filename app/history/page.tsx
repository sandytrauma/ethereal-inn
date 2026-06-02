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

/**
 * 🔒 SUBSURFACE COMPONENT: Isolated Stream Wrapper
 * Separating this block allows the framework to stream the page skeleton down to 
 * the browser instantly while the database query executes in parallel.
 */
async function HistoryList() {
  // Fetch unified, timezone-aligned records matching the user's secure role boundaries
  const data = await getCheckoutHistory();

  if (!data || data.length === 0) {
    return (
      <div className="bg-white/5 border border-dashed border-white/10 rounded-3xl p-20 text-center backdrop-blur-sm animate-fadeIn">
        <div className="w-12 h-12 rounded-2xl bg-amber-400/5 border border-amber-400/10 flex items-center justify-center mx-auto mb-4 text-amber-500 text-lg font-bold select-none">
          📋
        </div>
        <p className="text-gray-400 font-medium text-sm uppercase tracking-wider select-none">No checkout records found</p>
        <p className="text-gray-600 text-xs mt-1 max-w-xs mx-auto leading-relaxed select-none">
          Once a guest completes their billing cycle and check-out processing, their operational transaction logs will update here.
        </p>
      </div>
    );
  }

  // Pass down the type-aligned database rows (now including stay duration bounds cleanly)
  return <CheckoutTable checkoutData={data} />;
}

export default async function HistoryPage() {
  // 1. REJECT UNAUTHENTICATED REQUESTS OUTSIDE WORKSPACE SESSIONS
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  const session = token ? await decrypt(token).catch(() => null) : null;

  if (!session) {
    redirect("/ethereal-inn");
  }

  return (
    <div className="min-h-screen bg-transparent selection:bg-amber-400 selection:text-black">
      <div className="max-w-7xl mx-auto py-10 px-4">
        
        {/* Page Context Branding Header */}
        <header className="mb-10 select-none">
          <h1 className="text-4xl font-serif font-bold text-white uppercase italic tracking-tighter">
            Guest <span className="text-amber-500">History</span>
          </h1>
          <p className="text-gray-400 text-xs mt-2 font-light tracking-widest uppercase">
            Managing stratified records for Ethereal Inn Hospitality LLP
          </p>
        </header>

        {/* 🌟 THE UX STREAMING FIX: Suspense wrapper now captures the data fetch boundary cleanly */}
        <Suspense fallback={<HistorySkeleton />}>
          <HistoryList />
        </Suspense>

      </div>
    </div>
  );
}

// High-end skeleton view layout state matching your dashboard table blocks
function HistorySkeleton() {
  return (
    <div className="animate-pulse space-y-4 w-full select-none">
      <div className="bg-white/5 border border-white/5 rounded-3xl p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-white/5 pb-4">
          <div className="h-4 w-40 bg-white/10 rounded-md" />
          <div className="h-4 w-24 bg-white/10 rounded-md" />
        </div>
        <div className="space-y-3 pt-2">
          <div className="h-12 w-full bg-white/5 rounded-xl border border-white/5" />
          <div className="h-12 w-full bg-white/5 rounded-xl border border-white/5" />
          <div className="h-12 w-full bg-white/5 rounded-xl border border-white/5" />
          <div className="h-12 w-full bg-white/5 rounded-xl border border-white/5" />
          <div className="h-12 w-full bg-white/5 rounded-xl border border-white/5" />
        </div>
      </div>
    </div>
  );
}