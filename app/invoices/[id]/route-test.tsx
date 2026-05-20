// app/invoices/[id]/route-test.tsx
export default async function TestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="p-20 bg-slate-900 text-emerald-400 font-mono min-h-screen">
      <h1>Sandeep's Route Diagnostic Tool</h1>
      <p>Routing Engine Status: WORKING ✅</p>
      <p>Captured Raw URL Param: <span className="text-white">{id}</span></p>
    </div>
  );
}