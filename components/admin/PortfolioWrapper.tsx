import PortfolioSummary from "./PortfolioSummary";
import { Suspense } from "react";

export default function PortfolioWrapper() {
  return (
    <Suspense 
      fallback={
        <div className="p-12 bg-zinc-950/60 rounded-[3rem] border border-white/5 animate-pulse w-full max-w-7xl mx-auto h-[240px] flex flex-col justify-between">
          <div className="h-3 w-36 bg-zinc-800 rounded-md" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="h-2 w-16 bg-zinc-800 rounded-md" />
                <div className="h-8 w-32 bg-zinc-800 rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      }
    >
      <PortfolioSummary />
    </Suspense>
  );
}