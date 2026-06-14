"use client";

import React, { useState, useRef } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import Image from "next/image";
import { Sparkles, ArrowLeft, ArrowRight } from "lucide-react";

const PROPERTY_IMAGES = [

  { id: 1, src: "/Matial_1.jpg", alt: "Premium Suite Interior Node" },

  { id: 2, src: "/Matial_2.jpg", alt: "Boutique Lounge Structural Framing" },

  { id: 3, src: "/Matial_3.jpg", alt: "Premium Suite Interior Node" },

  { id: 4, src: "/Matial_4.jpg", alt: "Pristine Bath Module Architecture" },

  { id: 5, src: "/Matial_5.jpg", alt: "Ethereal Glam Curated Spaces" },

  { id: 6, src: "/Matial_6.jpg", alt: "Premium Suite Interior Node" },

  { id: 7, src: "/Matial_7.jpg", alt: "VIP Sanctuary" },

];

export default function PropertyShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  // 🌟 Mouse Position State Hooks for Real-Time 3D Parallax Tilt
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Maps mouse movement ranges smoothly into hardware-accelerated 3D rotation angles
  const tiltX = useTransform(mouseY, [-0.5, 0.5], [10, -10]);
  const tiltY = useTransform(mouseX, [-0.5, 0.5], [-10, 10]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Normalize coordinates around a central baseline point (0, 0)
    const normalizedX = (e.clientX - rect.left) / width - 0.5;
    const normalizedY = (e.clientY - rect.top) / height - 0.5;
    
    mouseX.set(normalizedX);
    mouseY.set(normalizedY);
  };

  const handleMouseLeave = () => {
    // Reset spatial tilt angles fluidly when the user's cursor leaves the card zone
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollLeft, clientWidth } = containerRef.current;
    
    const cardWidth = clientWidth < 768 ? clientWidth * 0.65 : clientWidth * 0.22;
    const gap = 32;
    const intermediateIdx = Math.round(scrollLeft / (cardWidth + gap));
    
    if (intermediateIdx !== activeIdx && intermediateIdx >= 0 && intermediateIdx < PROPERTY_IMAGES.length) {
      setActiveIdx(intermediateIdx);
    }
  };

  const scrollToIndex = (index: number) => {
    if (!containerRef.current) return;
    const { clientWidth } = containerRef.current;
    const cardWidth = clientWidth < 768 ? clientWidth * 0.65 : clientWidth * 0.22;
    const gap = 32;
    
    containerRef.current.scrollTo({
      left: index * (cardWidth + gap),
      behavior: "smooth",
    });
    setActiveIdx(index);
  };

  return (
    <section className="relative w-full py-16 md:py-24 bg-[#050505] overflow-hidden border-t border-b border-white/5 select-none max-w-full">
      
      {/* 🌌 EMBOSS BACKDROP LAYER: Shifting ambient aura synchronized to focus indices */}
      <div className="absolute inset-0 z-0 pointer-events-none transition-all duration-[1200ms] ease-out scale-105 opacity-25 blur-[60px] md:blur-[90px] saturate-150">
        <Image
          src={PROPERTY_IMAGES[activeIdx].src}
          alt="Backdrop Sync Blur"
          fill
          className="object-cover object-center grayscale-[15%] opacity-20 mix-blend-screen"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-[#050505]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 mb-8 md:mb-12 text-center">
        <span className="text-[#c5a059] text-[10px] font-black uppercase tracking-[0.6em] mb-3 block">
          Pristine Environments
        </span>
        <h2 className="text-3xl md:text-5xl font-serif font-bold italic text-white uppercase tracking-tight">
          The <span className="text-rose-500">Ethereal</span> Portfolio <span className="text-rose-500">Matiala</span>, Dwarka Sec 03, New Delhi, INDIA
        </h2>
      </div>

      {/* 🚀 THE 3D SLIDER WRAPPER MATRIX */}
      <div className="relative w-full flex items-center justify-center group/slider">
        
        {/* Left Navigation Arrow */}
        <button
          type="button"
          onClick={() => activeIdx > 0 && scrollToIndex(activeIdx - 1)}
          disabled={activeIdx === 0}
          className="absolute left-3 md:left-12 z-30 p-3.5 rounded-full bg-black/50 border border-white/5 text-white/50 hover:text-[#c5a059] hover:border-[#c5a059]/30 hover:bg-black/80 backdrop-blur-xl disabled:opacity-0 disabled:pointer-events-none transition-all duration-300 cursor-pointer shadow-2xl shrink-0"
          aria-label="Previous image"
        >
          <ArrowLeft size={16} />
        </button>

        <div 
          ref={containerRef}
          onScroll={handleScroll}
          className="relative z-10 w-full flex gap-8 overflow-x-auto overflow-y-hidden px-[17.5vw] md:px-[39vw] py-6 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          style={{ perspective: "1400px" }}
        >
          {PROPERTY_IMAGES.map((image, idx) => {
            const isCenter = idx === activeIdx;

            return (
              <motion.div
                key={image.id}
                onMouseMove={isCenter ? handleMouseMove : undefined}
                onMouseLeave={isCenter ? handleMouseLeave : undefined}
                className="relative shrink-0 w-[65vw] md:w-[22vw] aspect-[4/5] rounded-[2rem] md:rounded-[2.75rem] snap-center cursor-pointer"
                animate={{
                  scale: isCenter ? 1.04 : 0.9,
                  rotateY: isCenter ? 0 : idx < activeIdx ? 14 : -14,
                  z: isCenter ? 40 : -20,
                  filter: isCenter ? "contrast(1.12) brightness(1.02)" : "contrast(0.75) brightness(0.35)",
                }}
                // 🌟 Adds dynamic hover tilt angles on top of the base transform values
                style={{
                  rotateX: isCenter ? tiltX : 0,
                  rotateY: isCenter ? tiltY : undefined,
                  transformStyle: "preserve-3d",
                }}
                transition={{ type: "spring", damping: 32, stiffness: 110 }}
              >
                {/* 🌟 HOLOGRAPHIC Depth Shadow Matrix */}
                <div className={`absolute inset-0 rounded-[2rem] md:rounded-[2.75rem] transition-all duration-500 ${isCenter ? "shadow-[0_35px_60px_-15px_rgba(197,160,89,0.15)] shadow-amber-950/40" : "shadow-none"}`} />

                <div className="absolute inset-0 rounded-[2rem] md:rounded-[2.75rem] overflow-hidden w-full h-full">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes="(max-w-768px) 65vw, 22vw"
                    className="object-cover transition-transform duration-[2s]"
                    priority={idx < 2}
                  />
                  
                  {/* Outer Frame Boundary Mask */}
                  <div className={`absolute inset-0 border transition-colors duration-700 rounded-[2rem] md:rounded-[2.75rem] pointer-events-none ${isCenter ? "border-[#c5a059]/30 bg-gradient-to-t from-black/95 via-black/10 to-transparent" : "border-white/5"}`} />

                  {/* Information Overlay Layer Frame */}
                  {isCenter && (
                    <motion.div 
                      initial={{ opacity: 0, z: 20, y: 10 }}
                      animate={{ opacity: 1, z: 50, y: 0 }}
                      className="absolute bottom-5 left-5 right-5 md:bottom-8 md:left-8 md:right-8 flex items-center justify-between z-20 text-left"
                      style={{ transform: "translateZ(40px)" }} // Pushes text further along the Z-axis
                    >
                      <div className="max-w-[75%]">
                        <p className="text-[8px] font-black uppercase text-[#c5a059] tracking-widest mb-0.5 flex items-center gap-1">
                          <Sparkles size={8} /> Active Node
                        </p>
                        <h4 className="text-white font-serif font-bold italic text-sm md:text-base truncate">
                          {image.alt}
                        </h4>
                      </div>
                      <span className="font-mono text-[9px] md:text-[10px] text-white/40 bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/5 shrink-0">
                        0{image.id}
                      </span>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Right Navigation Arrow */}
        <button
          type="button"
          onClick={() => activeIdx < PROPERTY_IMAGES.length - 1 && scrollToIndex(activeIdx + 1)}
          disabled={activeIdx === PROPERTY_IMAGES.length - 1}
          className="absolute right-3 md:right-12 z-30 p-3.5 rounded-full bg-black/50 border border-white/5 text-white/50 hover:text-[#c5a059] hover:border-[#c5a059]/30 hover:bg-black/80 backdrop-blur-xl disabled:opacity-0 disabled:pointer-events-none transition-all duration-300 cursor-pointer shadow-2xl shrink-0"
          aria-label="Next image"
        >
          <ArrowRight size={16} />
        </button>

      </div>
    </section>
  );
}