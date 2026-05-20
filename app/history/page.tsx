import { getCheckoutHistory } from "./data-fetcher";
import CheckoutTable from "@/components/dashboard/GuestCheckoutHistory";
import { Suspense } from "react";

export default async function HistoryPage() {
  // 1. Fetch ACTUAL data from your Drizzle 'invoices' table
  const data = await getCheckoutHistory();

  return (
    <div className="min-h-screen bg-transparent">
      {/* Using Suspense ensures that if the DB is slow, 
          the rest of the dashboard doesn't freeze 
      */}
      <Suspense fallback={<HistorySkeleton />}>
        <div className="max-w-7xl mx-auto py-10 px-4">
          <header className="mb-10">
            <h1 className="text-4xl font-serif font-bold text-white uppercase italic tracking-tighter">
              Guest <span className="text-amber-500">History</span>
            </h1>
            <p className="text-gray-400 text-sm mt-2 font-light">
              Managing records for Ethereal Inn Hospitality LLP
            </p>
          </header>

          {data && data.length > 0 ? (
            <CheckoutTable checkoutData={data} />
          ) : (
            <div className="bg-white/5 h-screen border border-dashed border-white/20 rounded-3xl p-20 text-center overflow-scroll">
              <p className="text-gray-500 font-medium">No checkout records found in the database.</p>
              <p className="text-gray-600 text-sm mt-1">Once a guest completes their stay, their invoice will appear here.</p>
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
    <div className="p-10 animate-pulse">
      <div className="h-10 w-64 bg-white/10 rounded mb-10" />
      <div className="h-96 w-full bg-white/5 rounded-3xl" />
    </div>
  );
}