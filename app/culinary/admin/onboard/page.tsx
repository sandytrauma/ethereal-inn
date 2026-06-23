import { OnboardForm } from "@/components/culinary/OnboardForm";

export default function CulinaryOnboardingPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] flex flex-col items-center py-20 px-6 text-gray-100">
      {/* Header Section */}
      <div className="w-full max-w-2xl mb-12">
        <h1 className="text-[10px] font-bold tracking-[0.3em] text-pink-500 uppercase mb-3">
          Matrix Administration
        </h1>
        <h2 className="text-4xl font-light text-white leading-tight">
          Culinary System Matrix
        </h2>
        <p className="text-gray-400 mt-4 text-sm max-w-md font-light">
          Deploying new kitchen nodes to the cloud matrix. Ensure all platform credentials are reconciled before initiation.
        </p>
      </div>
      
      <OnboardForm />
      
      <div className="mt-12 text-[10px] text-gray-600 uppercase tracking-widest font-mono">
        <p>System Authorization: Master-Admin Level Required</p>
      </div>
    </main>
  );
}