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
  // --- THE FIX: metadataBase sets the root for all social images ---
  metadataBase: new URL(
    process.env.NODE_ENV === "production"
      ? "https://ethereal-inn.vercel.app" // Your production URL
      : "http://localhost:3000"
  ),
  title: "Ethereal Inn | Luxury Boutique Stay in Delhi",
  description: "Experience refined luxury at Ethereal Inn. Located near Metro, offering boutique rooms, fine dining, and elite amenities.",
  keywords: ["Luxury Hotel Delhi", "Boutique Stay Delhi", "Hotels near Metro", "Ethereal Inn New Delhi"],
  authors: [{ name: "Ethereal Inn Hospitality LLP" }],
  icons: {
    icon: "https://cdn-icons-png.flaticon.com/512/3030/3030336.png", 
    apple: "https://cdn-icons-png.flaticon.com/512/3030/3030336.png",
  },
  openGraph: {
    title: "Ethereal Inn | Delhi's Most Refined Experience",
    description: "Boutique luxury, minutes from the Metro.",
    url: "https://ethereal-inn.vercel.app/login",
    siteName: "Ethereal Inn",
    // Swapping to a high-quality bridal/luxury image for better conversion
    images: [{ 
      url: "/bridal-bg.jpg", 
      width: 1200, 
      height: 630, 
      alt: "Luxury at Ethereal Inn" 
    }],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ethereal Inn | Boutique Luxury",
    description: "Experience refined luxury in Delhi.",
    images: ["/bridal-bg.jpg"],
  },
};

// --- Background Blobs Component (Kept exactly as provided) ---
function DashboardBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#02040a]">
      <div className="absolute top-[-20%] left-[-15%] w-[800px] h-[800px] rounded-full bg-amber-500/20 blur-[120px] animate-drift opacity-60" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[900px] h-[900px] rounded-full bg-indigo-600/25 blur-[150px] animate-drift opacity-40" style={{ animationDelay: '-8s' }} />
      <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] rounded-full bg-emerald-500/10 blur-[100px] animate-pulse" style={{ animationDuration: '10s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[600px] bg-white/[0.03] blur-[160px] rotate-45 pointer-events-none" />
      <div 
        className="absolute inset-0 opacity-[0.2] mix-blend-soft-light pointer-events-none"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' fill='%23F5F5F5'/%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E")` }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_4px,3px_100%] pointer-events-none animate-flicker opacity-[0.05]" />
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