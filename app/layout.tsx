import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ethereal Inn | Luxury Boutique Stay in Chhatarpur, Delhi",
  description: "Experience refined luxury at Ethereal Inn. Located near Chhatarpur Metro, offering boutique rooms, fine dining, and elite amenities.",
  keywords: ["Luxury Hotel Chhatarpur", "Boutique Stay Delhi", "Hotels near Chhatarpur Metro", "Ethereal Inn New Delhi"],
  authors: [{ name: "Ethereal Inn Hospitality LLP" }],
  icons: {
    icon: "https://cdn-icons-png.flaticon.com/512/3030/3030336.png", 
    apple: "https://cdn-icons-png.flaticon.com/512/3030/3030336.png",
  },
  openGraph: {
    title: "Ethereal Inn | Chhatarpur's Most Refined Experience",
    description: "Boutique luxury, minutes from the Metro.",
    url: "https://ethereal-inn.vercel.app/login",
    siteName: "Ethereal Inn",
    images: [{ url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200&h=630&fit=crop", width: 1200, height: 630, alt: "Luxury Suite at Ethereal Inn" }],
    locale: "en_IN",
    type: "website",
  },
};

// --- Background Blobs Component ---
function DashboardBackground() {
  return (
   <div className="fixed inset-0 -z-10 overflow-hidden bg-[#02040a]">
  {/* 1. Primary Amber Glow - Deep & Concentrated */}
  <div 
    className="absolute top-[-20%] left-[-15%] w-[800px] h-[800px] rounded-full bg-amber-500/20 blur-[120px] animate-drift opacity-60" 
  />
  
  {/* 2. Vivid Indigo/Blue Contrast - Provides the "Deep" feel */}
  <div 
    className="absolute bottom-[-15%] right-[-10%] w-[900px] h-[900px] rounded-full bg-indigo-600/25 blur-[150px] animate-drift opacity-40" 
    style={{ animationDelay: '-8s' }} 
  />
  
  {/* 3. Secondary Emerald Glow - Adds complexity to the glass refraction */}
  <div 
    className="absolute top-[20%] right-[10%] w-[400px] h-[400px] rounded-full bg-emerald-500/10 blur-[100px] animate-pulse" 
    style={{ animationDuration: '10s' }}
  />

  {/* 4. Center Highlight - Sharper for "Frosted" center-point */}
  <div 
    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[600px] bg-white/[0.03] blur-[160px] rotate-45 pointer-events-none" 
  />

  {/* 5. Deep Noise/Grain Texture - Using the Smoky White noise with 'soft-light' for depth */}
  <div 
    className="absolute inset-0 opacity-[0.2] mix-blend-soft-light pointer-events-none"
    style={{ 
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' fill='%23F5F5F5'/%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E")` 
    }}
  />
  
  {/* 6. Scanline Overlay - Subtle horizontal lines to increase the "Glass" physical feel */}
  <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_4px,3px_100%] pointer-events-none" />
</div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: 'dark' }}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen relative`}>
        <DashboardBackground />
        <main className="relative z-10">
          {children}
        </main>
      </body>
    </html>
  );
}