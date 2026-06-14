import React from "react";
import Script from "next/script";
import Image from "next/image";
import { 
  MessageSquare, 
  BedDouble, 
  Utensils, 
  Sparkles, 
  ArrowUpRight, 
  Star, 
  Compass,
  Zap
} from "lucide-react";
import Footer from "@/components/layout/Footer";
import Link from "next/link";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!;

export default function EtherealSanctuaryPage() {
  const whatsappNumber = "918796211849";
  
  // Dynamic WhatsApp links with intent-based pre-filled messages
  const links = {
    suites: `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hello Ethereal Inn, I would like to check availability for your Luxury Guest Suites.")}`,
    culinary: `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hello, I would like to book a table at Urban Ambrosia Culinary.")}`,
    glam: `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hello, I want to book a luxury makeover session at Ethereal Glam Studio.")}`,
    general: `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hello Ethereal Inn, I am interested in your luxury services. Please share more details.")}`
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans antialiased selection:bg-amber-500/30 selection:text-amber-200 relative">
      
      {/* 1. GOOGLE ANALYTICS INTEGRATION */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-sanctuary-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', { page_path: '/sanctuary' });
        `}
      </Script>

      {/* 2. BRAND LOGO BACKGROUND LAYER */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 scale-105"
          style={{ backgroundImage: "url('/logo-bg.jpeg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/80 to-slate-950/95 backdrop-blur-[6px]" />
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-amber-600/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]" />
      </div>

      {/* 3. HERO SECTION */}
      <section className="relative pt-32 pb-12 px-6 max-w-6xl mx-auto text-center z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8">
          <Star size={14} className="text-amber-500 fill-amber-500" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">
            <Link href="/">
              The Ethereal Portfolio
            </Link>
          </span>
        </div>
        
        <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-white mb-6 leading-none">
          THE <span className="text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-500 to-amber-700">SANCTUARY</span>
        </h1>
        
        <p className="text-gray-300 text-sm md:text-lg max-w-2xl mx-auto leading-relaxed font-medium mb-10 drop-shadow-sm">
          A world-class curation of luxury living, experimental culinary masterclasses, 
          and editorial-grade aesthetic transformations.
        </p>

        <div className="mb-16">
          <a 
            href={links.general}
            target="_blank"
            className="bg-white text-slate-950 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-amber-500 transition-all hover:scale-105 active:scale-95 inline-flex items-center gap-3 shadow-2xl shadow-black/40"
          >
            <Compass size={18} /> Explore Our World
          </a>
        </div>

        {/* HERO IMAGE BANNER: Using Catalogue_1.avif */}
        <div className="max-w-5xl mx-auto rounded-[32px] overflow-hidden border border-white/10 shadow-2xl relative h-[250px] md:h-[450px]">
          <Image
            src="/Matial_6.jpg"
            alt="Ethereal Luxury Boutique Hotel Experience"
            fill
            priority
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
        </div>
      </section>

      {/* 4. THE CATALOGUE SECTION */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-32">
        <div className="grid md:grid-cols-3 gap-8">
          
          {/* CATALOGUE ITEM: LUXURY SUITES (Links into Dynamic Campaign Variants) */}
          <div className="group relative flex flex-col bg-slate-950/50 border border-white/10 rounded-[40px] backdrop-blur-xl transition-all duration-500 hover:bg-slate-950/80 hover:border-amber-500/40 shadow-xl overflow-hidden">
            <Link href="/sanctuary/couple-friendly-stay" className="block relative h-48 w-full overflow-hidden">
              <Image 
                src="/Matial_3.jpg" 
                alt="Ethereal Luxury Stays and Guest Suites" 
                fill 
                className="object-cover object-center group-hover:scale-105 transition-transform duration-500" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
              <div className="absolute top-4 left-4 bg-rose-500/80 text-white text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Couple Friendly
              </div>
              <div className="absolute top-4 right-4 bg-amber-500/80 text-slate-950 text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Corporate Tier
              </div>
            </Link>
            
            <div className="p-8 pt-4 flex flex-col flex-grow">
              <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center mb-6 border border-amber-500/20">
                <BedDouble size={22} />
              </div>
              <h3 className="text-2xl font-black text-white mb-3 tracking-tight">
                <Link href="/sanctuary/couple-friendly-stay" className="hover:text-amber-400 transition-colors">
                  Luxury Guest Accommodations
                </Link>
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed font-medium mb-6 flex-grow">
                Premium urban sanctuaries designed with architectural precision. Featuring high-speed automation, signature cloud-bed systems, and ultra-private comfort layers for the modern elite.
              </p>
              
              <div className="grid grid-cols-2 gap-3 mt-auto">
                <Link 
                  href="/sanctuary/couple-friendly-stay"
                  className="flex items-center justify-center gap-1.5 bg-white/5 hover:bg-rose-500 hover:text-white text-slate-300 text-[10px] font-bold py-3 px-2 rounded-xl transition-all uppercase tracking-wider text-center"
                >
                  Couples <ArrowUpRight size={12} />
                </Link>
                <Link 
                  href="/sanctuary/corporate-stay"
                  className="flex items-center justify-center gap-1.5 bg-white/5 hover:bg-amber-500 hover:text-slate-950 text-slate-300 text-[10px] font-bold py-3 px-2 rounded-xl transition-all uppercase tracking-wider text-center"
                >
                  Corporate <ArrowUpRight size={12} />
                </Link>
              </div>
            </div>
          </div>

          {/* CATALOGUE ITEM: URBAN AMBROSIA */}
          <div className="group relative flex flex-col bg-slate-950/50 border border-white/10 rounded-[40px] backdrop-blur-xl transition-all duration-500 hover:bg-slate-950/80 hover:border-purple-500/40 shadow-xl overflow-hidden">
            <Link href="/sanctuary/urban-ambrosia" className="block relative h-48 w-full overflow-hidden">
              <Image 
                src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80" 
                alt="Urban Ambrosia Luxury Fine Dining" 
                fill 
                className="object-cover object-center group-hover:scale-105 transition-transform duration-500" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
            </Link>

            <div className="p-8 pt-4 flex flex-col flex-grow">
              <div className="w-12 h-12 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center mb-6 border border-purple-500/20">
                <Utensils size={22} />
              </div>
              <h3 className="text-2xl font-black text-white mb-3 tracking-tight">
                <Link href="/sanctuary/urban-ambrosia" className="hover:text-purple-400 transition-colors">
                  Urban Ambrosia
                </Link>
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed font-medium mb-8 flex-grow">
                Experimental culinary masterfully plated. A high-contrast fine-dining wing where vibrant fusion flavors meet atmospheric luxury. Bespoke gastronomy at its finest.
              </p>
              <Link 
                href="/sanctuary/urban-ambrosia" 
                className="flex items-center justify-between w-full bg-white/5 p-4 rounded-2xl group-hover:bg-purple-500 group-hover:text-black transition-all font-bold text-[11px] uppercase tracking-widest mt-auto"
              >
                Explore Dining <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>

          {/* CATALOGUE ITEM: GLAM STUDIO */}
          <div className="group relative flex flex-col bg-slate-950/50 border border-white/10 rounded-[40px] backdrop-blur-xl transition-all duration-500 hover:bg-slate-950/80 hover:border-pink-500/40 shadow-xl overflow-hidden">
            <Link href="/sanctuary/glam-studio" className="block relative h-48 w-full overflow-hidden">
              <Image 
                src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80" 
                alt="Ethereal Glam Studio Premium Beauty Counter" 
                fill 
                className="object-cover object-center group-hover:scale-105 transition-transform duration-500" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
            </Link>

            <div className="p-8 pt-4 flex flex-col flex-grow">
              <div className="w-12 h-12 bg-pink-500/10 text-pink-400 rounded-xl flex items-center justify-center mb-6 border border-pink-500/20">
                <Sparkles size={22} />
              </div>
              <h3 className="text-2xl font-black text-white mb-3 tracking-tight">
                <Link href="/sanctuary/glam-studio" className="hover:text-pink-400 transition-colors">
                  Ethereal Glam Studio
                </Link>
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed font-medium mb-8 flex-grow">
                Editorial-grade aesthetic makeovers. Pairing master artists with global luxury cosmetic brands for bridal, luxury calendar shoots, and elite party styling.
              </p>
              <Link 
                href="/sanctuary/glam-studio" 
                className="flex items-center justify-between w-full bg-white/5 p-4 rounded-2xl group-hover:bg-pink-500 group-hover:text-black transition-all font-bold text-[11px] uppercase tracking-widest mt-auto"
              >
                View Packages <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* 5. FOOTER / CALL TO ACTION */}
      <footer className="relative z-10 border-t border-white/5 py-16 px-6 text-center bg-slate-950/70 backdrop-blur-md">
        <div className="max-w-4xl mx-auto">
          <Zap size={32} className="mx-auto text-amber-500 mb-6" />
          <h2 className="text-3xl font-black text-white mb-4">Ready for the Experience?</h2>
          <p className="text-slate-400 text-sm mb-10">Connect directly with our elite hospitality desk for customized arrangements.</p>
          
          <a 
            href={links.general}
            target="_blank"
            className="inline-flex items-center gap-4 text-amber-500 hover:text-white transition-colors text-lg font-bold group mb-12"
          >
            <MessageSquare className="fill-amber-500 group-hover:fill-white transition-colors" /> +91 87962 11849
          </a>
          
          <div className="mt-8 border-t border-white/5 pt-8 text-slate-500">
            <Footer/>
          </div>
        </div>
      </footer>
    </div>
  );
}