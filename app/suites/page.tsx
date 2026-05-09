"use client";
import { motion } from "framer-motion";
import { ArrowRight, Star, ShieldCheck, ChevronLeft } from "lucide-react";
import Link from "next/link";

const ROOM_COLLECTION = {
  standard: [
    { id: 'std-1', name: "Azure Deluxe", price: "8500", currency: "INR", img: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=1200", desc: "Refined comfort featuring bespoke furnishings and sunset city views." },
    { id: 'std-2', name: "Ivory Superior", price: "9200", currency: "INR", img: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=1200", desc: "A minimalist sanctuary designed for deep rest and morning clarity." },
    { id: 'std-3', name: "Noir Classic", price: "10000", currency: "INR", img: "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?q=80&w=1200", desc: "Moody aesthetics meet modern convenience in our signature dark-tone room." },
  ],
  suites: [
    { id: 'suite-1', name: "Ambrosia Duplex", price: "18500", currency: "INR", img: "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1200", desc: "A sprawling two-story suite with a private lounge and master quarters." },
    { id: 'suite-2', name: "The Obsidian Penthouse", price: "28000", currency: "INR", img: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1200", desc: "Our crown jewel. Two master suites, a private dining hall, and 360° views." },
  ]
};

export default function SuitesPage() {
  // Generate Structured Data for Google
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Hotel",
    "name": "Ethereal Inn",
    "description": "Luxury boutique hotel in Gurugram featuring high-end suites and artisanal dining.",
    "containsPlace": Object.values(ROOM_COLLECTION).flat().map(room => ({
      "@type": "HotelRoom",
      "name": room.name,
      "description": room.desc,
      "display": {
          "@type": "PriceSpecification",
          "price": room.price,
          "priceCurrency": room.currency
      }
    }))
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white pb-32">
      {/* Inject Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Sticky Back Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-black/20 border-b border-white/5 py-6 px-6">
        <div className="max-w-7xl mx-auto">
          <Link href="/" className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-[#c5a059]">
            <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Back to Sanctuary
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 pt-20">
        <header className="mb-32">
          <h1 className="text-6xl md:text-9xl font-serif font-bold italic uppercase tracking-tighter">
            The <span className="text-[#c5a059]">Gallery.</span>
          </h1>
          <p className="text-gray-500 max-w-xl mt-6 text-lg font-light leading-relaxed">
            From our intimate standard rooms to our sprawling multi-room suites, every space at Ethereal Inn is a masterclass in architectural silence.
          </p>
        </header>

        {/* ... Rest of your Gallery UI (Standard Rooms & Grand Suites sections) ... */}
        
        {/* SECTION: Standard Rooms */}
        <section className="mb-40">
          <div className="flex items-center gap-6 mb-16">
            <h2 className="text-xs font-black uppercase tracking-[0.5em] text-white">Signature Collection</h2>
            <div className="h-px flex-1 bg-white/10" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {ROOM_COLLECTION.standard.map((room) => (
              <motion.div 
                key={room.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="group cursor-pointer"
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-white/5 mb-6">
                  <img src={room.img} alt={room.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" />
                </div>
                <h3 className="text-2xl font-serif italic mb-2">{room.name}</h3>
                <p className="text-gray-500 text-sm mb-4 line-clamp-2">{room.desc}</p>
                <span className="text-[#c5a059] text-[10px] font-black uppercase tracking-widest">₹{room.price} / Night</span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* SECTION: Grand Suites */}
        <section>
          <div className="flex items-center gap-6 mb-16">
            <h2 className="text-xs font-black uppercase tracking-[0.5em] text-[#c5a059]">The Grand Suites</h2>
            <div className="h-px flex-1 bg-[#c5a059]/20" />
          </div>

          <div className="space-y-24">
            {ROOM_COLLECTION.suites.map((suite, i) => (
              <motion.div 
                key={suite.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                className={`flex flex-col ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-12 md:gap-20 items-center`}
              >
                <div className="flex-1 w-full aspect-video rounded-[3rem] overflow-hidden border border-[#c5a059]/20">
                  <img src={suite.img} alt={suite.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 space-y-8">
                  <h3 className="text-5xl md:text-6xl font-serif italic text-white leading-none">{suite.name}</h3>
                  <p className="text-gray-400 text-lg leading-relaxed font-light">{suite.desc}</p>
                  <div className="flex items-center gap-8">
                    <p className="text-2xl font-serif italic text-[#c5a059]">₹{suite.price}</p>
                    <button className="flex-1 bg-white text-black h-16 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] hover:bg-[#c5a059] transition-colors">
                      Reserve Suite
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}