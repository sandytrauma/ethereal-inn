import { db } from "@/db";
import { culinaryOutlets } from "@/db/schema/culinary";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";

export default async function CulinaryDirectoryPage() {
  const outlets = await db.select()
    .from(culinaryOutlets)
    .where(eq(culinaryOutlets.isActive, true))
    .orderBy(desc(culinaryOutlets.platformRank));

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white p-6 md:p-12 font-sans">
      {/* NAVIGATION */}
      <nav className="mb-16">
        <Link href="/" className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 hover:text-white transition-all flex items-center gap-2">
          <span>&larr;</span> Return to Home
        </Link>
      </nav>

      {/* SEO-FRIENDLY HEADER */}
      <header className="max-w-4xl mb-20">
        <h1 className="text-5xl md:text-7xl font-light tracking-tighter mb-6">
          Culinary Excellence
        </h1>
        <p className="text-zinc-400 text-lg max-w-lg font-light leading-relaxed">
          Explore our collection of premium cloud kitchens, meticulously ranked and curated for the discerning palate across Delhi NCR.
        </p>
      </header>

      {/* VIBRANT GRID */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {outlets.map((outlet) => (
          <article 
            key={outlet.id} 
            className="group relative border border-white/10 hover:border-pink-500/50 p-8 transition-all duration-500 bg-white/[0.02]"
          >
            <div className="absolute top-4 right-4 text-[10px] font-mono text-pink-500 tracking-widest">
              RANK #{outlet.platformRank || '0'}
            </div>
            
            <h2 className="text-2xl font-serif italic mb-2">{outlet.name}</h2>
            <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-8">
              {outlet.locationContext}
            </p>
            
            <Link 
              href={`/culinary/brand/${outlet.slug}`}
              className="inline-block border border-white/20 px-6 py-2 text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-all"
            >
              Order Now
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}