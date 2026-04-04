"use client";
import { motion } from "framer-motion";
import { Wine, Utensils, Clock, ChevronLeft, ChefHat, Sparkles } from "lucide-react";
import Link from "next/link";

const CULINARY_SECTIONS = {
  experiences: [
    { 
      id: 'fine-dining', 
      name: "The Chef's Table", 
      tag: "In-Suite Experience", 
      // Updated with a high-reliability culinary image
      img: "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1200", 
      desc: "A private, multi-course journey prepared live in your suite by our executive artisans." 
    },
    { 
      id: 'cloud-kitchen', 
      name: "Ambrosia Delivery", 
      tag: "24/7 Cloud Kitchen", 
      // Updated with a high-reliability gourmet plating image
      img: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200", 
      desc: "Gourmet precision delivered to your doorstep. Ingredients sourced within 24 hours." 
    },
  ],
  features: [
    { icon: <Wine size={24} />, t: "Sommelier Choice", d: "Rare vintages curated to match our seasonal menu." },
    { icon: <ChefHat size={24} />, t: "Artisanal Craft", d: "Zero processed ingredients. Everything from scratch." },
    { icon: <Sparkles size={24} />, t: "Molecular Magic", d: "Modern techniques meet traditional flavors." },
  ]
};

export default function CulinaryPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white pb-32">
      {/* Sticky Back Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-black/20 border-b border-white/5 py-6 px-6">
        <div className="max-w-7xl mx-auto">
          <Link href="/" className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-[#c5a059]">
            <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Back to Sanctuary
          </Link>
        </div>
      </nav>

      {/* Hero Section with improved visibility */}
      <section className="h-[70vh] relative flex items-center justify-center overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=2000" 
          className="absolute inset-0 w-full h-full object-cover grayscale opacity-50"
          alt="Urban Ambrosia Background"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-[#050505]" />
        <div className="relative z-10 text-center px-4">
           <span className="text-[#c5a059] text-[10px] font-black uppercase tracking-[0.6em] mb-4 block">The Culinary Wing</span>
           <h1 className="text-6xl md:text-9xl font-serif font-bold italic uppercase tracking-tighter">Urban <span className="text-[#c5a059]">Ambrosia.</span></h1>
           <p className="text-gray-400 max-w-lg mx-auto mt-6 text-sm md:text-base font-light tracking-wide">
             Bridging the gap between urban pace and artisanal patience.
           </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 pt-20">
        {/* Features Grid */}
        <section className="mb-40 grid grid-cols-1 md:grid-cols-3 gap-8">
          {CULINARY_SECTIONS.features.map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="p-10 bg-white/5 border border-white/5 rounded-[3rem] group hover:border-[#c5a059]/30 transition-all"
            >
              <div className="text-[#c5a059] mb-6 group-hover:scale-110 transition-transform">{feature.icon}</div>
              <h3 className="text-white font-black uppercase tracking-widest text-[11px] mb-4">{feature.t}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{feature.d}</p>
            </motion.div>
          ))}
        </section>

        {/* Experience Rows */}
        <section className="space-y-32">
          <div className="flex items-center gap-6 mb-16">
            <h2 className="text-xs font-black uppercase tracking-[0.5em] text-[#c5a059]">The Dining Odyssey</h2>
            <div className="h-px flex-1 bg-[#c5a059]/20" />
          </div>

          {CULINARY_SECTIONS.experiences.map((exp, i) => (
            <motion.div 
              key={exp.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              className={`flex flex-col ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-12 md:gap-20 items-center`}
            >
              <div className="flex-1 w-full aspect-[16/10] rounded-[3rem] overflow-hidden border border-white/5">
                <img 
                  src={exp.img} 
                  alt={exp.name} 
                  className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000 scale-105 hover:scale-100" 
                />
              </div>
              <div className="flex-1 space-y-8">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#c5a059] border-l-2 border-[#c5a059] pl-4">{exp.tag}</span>
                <h3 className="text-5xl md:text-6xl font-serif italic text-white leading-tight">{exp.name}</h3>
                <p className="text-gray-400 text-lg leading-relaxed font-light">{exp.desc}</p>
                <button className="bg-white text-black h-16 px-12 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] hover:bg-[#c5a059] transition-all">
                  Order Now
                </button>
              </div>
            </motion.div>
          ))}
        </section>

        {/* Philosophy Footer */}
        <section className="mt-40">
           <div className="bg-zinc-900/50 p-12 md:p-24 rounded-[4rem] border border-white/5 text-center">
              <h2 className="text-4xl font-serif italic mb-8 text-[#c5a059]">The Philosophy</h2>
              <p className="text-gray-400 text-xl leading-relaxed font-light max-w-2xl mx-auto">
                "Ingredients sourced within 24 hours of serving. Flavors curated for a lifetime of memory."
              </p>
           </div>
        </section>
      </div>
    </main>
  );
}