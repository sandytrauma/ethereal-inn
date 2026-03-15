export default function DashboardBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-slate-950">
      {/* Top Left Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-amber-500/10 blur-[120px] animate-pulse" />
      
      {/* Bottom Right Glow */}
      <div className="absolute bottom-[5%] right-[-5%] w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[150px]" />
      
      {/* Subtle Center Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-purple-500/5 blur-[120px] rotate-45" />

      {/* Optional: Grid Overlay for that "Tech" look */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
    </div>
  );
}