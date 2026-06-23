"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  X,
  Wifi,
  Tv,
  Droplets,
  Bath,
  MapPin,
  CalendarDays,
} from "lucide-react";
import Link from "next/link";

// 🌟 UPDATED: Every node now has complete metadata for consistency
const PROPERTY_IMAGES = [
  {
    id: 1,
    src: "/Matial_1.jpg",
    title: "Ethereal Sanctuary",
    tag: "NODE 01",
    specs: ["WiFi", "TV", "Geyser", "Attached Bath"],
    info: "High-end suite perfect for family functions.",
  },
  {
    id: 2,
    src: "/Matial_1.jpg",
    title: "Lounge Core",
    tag: "NODE 02",
    specs: ["WiFi", "TV", "Air Con"],
    info: "Sophisticated lounge for corporate gatherings.",
  },
  {
    id: 3,
    src: "/Matial_3.jpg",
    title: "Suite Prime",
    tag: "NODE 03",
    specs: ["WiFi", "TV", "Bath", "Mini Bar"],
    info: "Luxury living space for long stays.",
  },
  {
    id: 4,
    src: "/Matial_4.jpg",
    title: "Bath Mod",
    tag: "NODE 04",
    specs: ["Bath", "Geyser", "Towels"],
    info: "Architectural bath module for rejuvenation.",
  },
  {
    id: 5,
    src: "/Matial_5.jpg",
    title: "Glam Curate",
    tag: "NODE 05",
    specs: ["WiFi", "Vanity", "Mirror"],
    info: "Stylized ethereal space for creative work.",
  },
  {
    id: 6,
    src: "/Matial_6.jpg",
    title: "Suite Alpha",
    tag: "NODE 06",
    specs: ["WiFi", "TV", "Geyser"],
    info: "Modern suite for daily executive stays.",
  },
  {
    id: 7,
    src: "/Matial_7.jpg",
    title: "VIP Sanctuary",
    tag: "NODE 07",
    specs: ["WiFi", "TV", "Bath", "Private Pool"],
    info: "Exclusive VIP sanctuary for private events.",
  },
];

export default function PropertyShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (containerRef.current) {
      const scrollAmount = containerRef.current.clientWidth * 0.8;
      containerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="relative w-full py-20 bg-[#020202] text-white">
      <div className="max-w-7xl mx-auto px-6 mb-16">
        <h2 className="text-[12vw] md:text-[6rem] font-black uppercase leading-none tracking-tighter">
          Ethereal
          <br />
          <span className="text-pink-500">Archive</span>
        </h2>
      </div>

      <div className="relative group">
        <button
          onClick={() => scroll("left")}
          className="absolute left-4 top-1/2 z-20 p-4 bg-white/5 backdrop-blur-md rounded-full border border-white/10 hover:bg-white hover:text-black transition-all"
        >
          <ArrowLeft size={24} />
        </button>
        <button
          onClick={() => scroll("right")}
          className="absolute right-4 top-1/2 z-20 p-4 bg-white/5 backdrop-blur-md rounded-full border border-white/10 hover:bg-white hover:text-black transition-all"
        >
          <ArrowRight size={24} />
        </button>

        <div
          ref={containerRef}
          className="flex gap-6 overflow-x-auto px-6 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {PROPERTY_IMAGES.map((img) => (
            <div
              key={img.id}
              className="relative shrink-0 w-[80vw] md:w-[350px] aspect-[3/4] rounded-[32px] overflow-hidden cursor-pointer border border-white/10 hover:border-white/30 transition-all"
              onClick={() => setSelected(img)}
            >
              <Image
                src={img.src}
                alt={img.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              <div className="absolute bottom-8 left-8">
                <p className="text-[10px] text-pink-500 font-mono tracking-widest">
                  {img.tag}
                </p>
                <h3 className="text-2xl font-bold uppercase">{img.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Glassmorphism Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              // 🌟 ADDED: max-h-[90vh] ensures the modal never exceeds the viewport height
              className="bg-white/5 backdrop-blur-2xl border border-white/20 w-full max-w-2xl rounded-[40px] overflow-hidden shadow-2xl relative p-8 cursor-default max-h-[90vh] flex flex-col"
            >
              <button
                onClick={() => setSelected(null)}
                className="absolute top-6 right-6 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all z-10"
              >
                <X size={20} />
              </button>

              {/* 🌟 ADDED: max-h-[40vh] constrains the image height */}
              <div className="relative w-full max-h-[40vh] aspect-video rounded-2xl overflow-hidden mb-6 border border-white/10 flex-shrink-0">
                <Image
                  src={selected.src}
                  alt={selected.title}
                  fill
                  className="object-cover"
                />
              </div>

              {/* 🌟 ADDED: overflow-y-auto ensures specs/buttons are reachable via scroll */}
              <div className="overflow-y-auto pr-2 custom-scrollbar">
                <h2 className="text-3xl md:text-4xl font-black uppercase mb-2">
                  {selected.title}
                </h2>
                <p className="text-zinc-400 mb-6">{selected.info}</p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  {selected.specs.map((s: string) => (
                    <div
                      key={s}
                      className="flex items-center gap-3 bg-white/5 px-4 py-3 rounded-2xl border border-white/5"
                    >
                      <div className="p-2 bg-pink-500/20 rounded-lg text-pink-500">
                        <Wifi size={16} />
                      </div>
                      <span className="text-sm font-medium">{s}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-4 pb-2">
                  <Link href="/contact" className="flex-1">
                    <button className="w-full bg-pink-500 py-4 font-bold rounded-2xl shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:bg-pink-600 transition-all">
                      Book Event
                    </button>
                  </Link>

                  <button
                    onClick={() =>
                      window.open(
                        `https://wa.me/918796211849?text=I'm interested in a Daily Stay at ${selected.title}`,
                        "_blank",
                      )
                    }
                    className="flex-1 bg-white/10 py-4 font-bold rounded-2xl border border-white/10 hover:bg-white/20 transition-all"
                  >
                    Daily Stay
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
