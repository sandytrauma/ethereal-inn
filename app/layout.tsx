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
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[oklch(0.145_0_0)]">
      {/* 1. Primary Amber Glow - Top Left (Brand Color) */}
      <div 
        className="absolute top-[-15%] left-[-10%] w-[600px] h-[600px] rounded-full bg-amber-500/15 blur-[120px] animate-drift opacity-70" 
      />
      
      {/* 2. Deep Blue Glow - Bottom Right (Contrast Color) */}
      <div 
        className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] rounded-full bg-blue-600/10 blur-[160px] animate-drift opacity-50" 
        style={{ animationDelay: '-7s' }} 
      />
      
      {/* 3. Center White Light - Provides the "Frosted" highlight for Glassmorphism */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[500px] bg-white/[0.03] blur-[130px] rotate-12" 
      />

      {/* 4. Noise/Grain Texture - Makes the glass effect look more realistic and less like a digital gradient */}
      <div 
        className="absolute inset-0 opacity-[0.15] mix-blend-overlay pointer-events-none"
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` 
        }}
      />
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