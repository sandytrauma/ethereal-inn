"use client";
import React, { useState } from "react";
import { 
  MapPin, 
  ExternalLink, 
  ChevronRight, 
  Building2 
} from "lucide-react";

// Property Data Configuration
const PROPERTIES = [
  {
    id: "mohan-garden",
    name: "Ethereal Inn - Mohan Garden",
    location: "West Delhi",
    mainHeading: "Mohan Garden.",
    landmark: "Located near Panchsheel Nursing Home",
    description: "Our signature boutique sanctuary located on the first floor near Panchsheel Nursing Home.",
    // Google Maps Embed for Panchsheel Nursing Home
    embedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3502.1384318721735!2d77.04169727550057!3d28.625586675667355!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d0563459e97f9%3A0xc3b86948041c2966!2sPanchsheel%20Nursing%20Home!5e0!3m2!1sen!2sin!4v1714995543210",
    directLink: "https://maps.google.com/?q=Panchsheel+Nursing+Home+Mohan+Garden"
  },
 {
    id: "dwarka-matiala",
    name: "Hotel Ethereal Inn - Matiala, Dwarka",
    location: "Matiala, Dwarka",
    mainHeading: "Dwarka Hub.",
    landmark: "Located near Akash Hospital, Matiala",
    description: "Strategically located near Akash Hospital, Matiala, offering premium access to the Dwarka sub-city hub.",
    // Updated with precise coordinates (28.60783073547553, 77.0464921020415)
    embedUrl: "https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3503.2235472254386!2d77.0464921!3d28.6078307!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1d28.6078307!2d77.0464921!5e0!3m2!1sen!2sin!4v1715000000000",
    directLink: "https://maps.google.com/?q=28.60783073547553,77.0464921020415"
  }
];

export default function MultiPropertyMap() {
  const [activeProperty, setActiveProperty] = useState(PROPERTIES[0]);

  return (
    <section className="max-w-7xl mx-auto py-24 px-6 border-t border-white/5">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
        
        {/* Left Side: Property Selection & Details */}
        <div className="lg:col-span-5 space-y-12">
          <div className="space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 text-[#c5a059] px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest">
              <MapPin size={16} /> {activeProperty.location}
            </div>
            
            <h2 className="text-5xl md:text-7xl font-serif font-bold text-white leading-tight uppercase italic transition-all duration-500">
              {activeProperty.mainHeading.split(' ')[0]} <br />
              <span className="text-slate-500">{activeProperty.mainHeading.split(' ')[1] || ""}</span>
            </h2>
            
            <p className="text-gray-500 text-sm tracking-widest uppercase font-bold">
              {activeProperty.landmark}
            </p>

            {/* Property Toggles */}
            <div className="grid grid-cols-1 gap-4 pt-4">
              {PROPERTIES.map((prop) => (
                <button
                  key={prop.id}
                  onClick={() => setActiveProperty(prop)}
                  className={`flex items-center justify-between p-6 rounded-3xl border transition-all duration-500 group ${
                    activeProperty.id === prop.id 
                      ? "bg-[#c5a059] border-[#c5a059] text-black" 
                      : "bg-white/5 border-white/10 text-white hover:border-[#c5a059]/50"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <Building2 size={20} className={activeProperty.id === prop.id ? "text-black" : "text-[#c5a059]"} />
                    <div className="text-left">
                      <p className="font-serif italic text-lg leading-none">{prop.name}</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className={`transition-transform duration-500 ${activeProperty.id === prop.id ? "rotate-90" : "group-hover:translate-x-1"}`} />
                </button>
              ))}
            </div>

            <button 
              onClick={() => window.open(activeProperty.directLink, "_blank")} 
              className="inline-flex items-center gap-3 bg-white/5 hover:bg-[#c5a059] hover:text-black text-white font-black px-10 py-5 rounded-2xl border border-white/10 transition-all uppercase text-xs tracking-widest w-full lg:w-auto justify-center"
            >
              Get Directions <ExternalLink size={18} />
            </button>
          </div>
        </div>

        {/* Right Side: Map Container */}
        <div className="lg:col-span-7 space-y-6">
          <div className="h-[500px] w-full bg-zinc-900 rounded-[3.5rem] overflow-hidden border border-white/10 relative group">
            {/* Artistic Overlay for Premium Feel */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none z-10" />
            
            <iframe
              src={activeProperty.embedUrl}
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen 
              loading="lazy" 
              title={`${activeProperty.name} Map`}
              className="grayscale invert opacity-50 hover:opacity-80 transition-all duration-700 scale-110 group-hover:scale-100"
            />
            
            {/* Floating Info Overlay (Mobile Hidden) */}
            <div className="absolute bottom-6 left-6 right-6 hidden md:block bg-black/80 backdrop-blur-md border border-white/5 p-6 rounded-3xl z-20">
               <p className="text-white text-[11px] font-medium leading-relaxed opacity-80">
                {activeProperty.description}
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}