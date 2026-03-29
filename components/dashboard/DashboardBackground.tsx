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
     <div className="fixed inset-0 z-[1] pointer-events-none overflow-hidden">
      {/* This creates a 40px x 40px grid using CSS gradients. 
          The 'bg-[length:40px_40px]' controls the density.
      */}
      <div 
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* Radial Vignette to fade the grid edges */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#050505] via-transparent to-[#050505] opacity-60" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#050505_100%)] opacity-40" />
    </div>
    </div>
  );
}