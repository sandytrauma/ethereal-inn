import PortfolioSummary from "./PortfolioSummary";
import { Suspense } from "react";

export default function PortfolioWrapper() {
  return (
    <Suspense fallback={<div className="p-10 animate-pulse bg-zinc-900 rounded-[3rem]" />}>
      <PortfolioSummary />
    </Suspense>
  );
}