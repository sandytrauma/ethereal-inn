"use client";

import React, { useState, useEffect } from 'react';

export default function DashboardBackground() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-slate-950">
      {/* --- EXISTING STATIC GLOWS --- */}
      
      {/* Top Left Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-amber-500/10 blur-[120px] animate-pulse" />
      
      {/* Bottom Right Glow */}
      <div className="absolute bottom-[5%] right-[-5%] w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[150px]" />
      
      {/* Subtle Center Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-purple-500/5 blur-[120px] rotate-45" />

      {/* --- INTERACTIVE GRID OVERLAY --- */}
      <div className="fixed inset-0 z-[1] pointer-events-none overflow-hidden">
        
        {/* The Grid: Now with a very subtle pulse animation for depth */}
        <div 
          className="absolute inset-0 opacity-[0.15] animate-[pulse_8s_ease-in-out_infinite]"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        />

        {/* --- DYNAMIC MOUSE GLOW --- */}
        <div 
          className="absolute inset-0 transition-opacity duration-500 ease-out"
          style={{
            background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(251, 113, 133, 0.12), transparent 40%)`
          }}
        />
        
        {/* Radial Vignette to fade the grid edges */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#050505] via-transparent to-[#050505] opacity-60" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#050505_100%)] opacity-40" />
      </div>
    </div>
  );
}