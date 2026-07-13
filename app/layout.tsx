import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script"; // 🌟 Injected for optimized Google Tag handling
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
  // SET METADATABASE: Successfully resolves relative asset paths for SEO
  metadataBase: new URL(
    process.env.NODE_ENV === "production"
      ? "https://www.etherealinn.com"
      : "http://localhost:3000"
  ),
  title: "Ethereal Inn Hospitality LLP | Luxury Boutique Stays & Tech Platforms",
  description: "Experience premium boutique luxury accommodations, aesthetic spaces, and advanced cloud-native technology platforms managed by Ethereal Inn Hospitality LLP.",
  keywords: [
   "Ethereal Inn Hospitality LLP", "Luxury Hotel Delhi", "Boutique Stay Delhi", 
    "Hotels near Metro", "Ethereal Inn New Delhi", "Ethereal Glam", "Urban Ambrosia",
    "Luxury boutique hotels near me", "Best boutique stays in Delhi NCR", 
    "Hotels near metro station Dwarka", "Top-rated luxury hotels in West Delhi", 
    "Boutique hotel with banquet hall near me", "Staycations in Delhi for couples", 
    "Urban Ambrosia cloud kitchen Dwarka", "Ethereal Glam salon near Dwarka",
    // Brand & Identity Anchors
    "Ethereal Inn Hospitality LLP", "Ethereal Inn Dwarka", "Ethereal Inn Matiala", 
    "Ethereal Glam Studio", "Urban Ambrosia Cloud Kitchen", "Ethereal Inn New Delhi",
    
    // High-Intent Local (Matiala & Dwarka)
    "Luxury boutique hotel in Matiala", "Best boutique stay near Akash Hospital", 
    "Hotels near Akash Hospital Dwarka", "Boutique stay in Dwarka Sector 3", 
    "Premium accommodation near Matiala metro station", "Hotels near Dwarka Mor", 
    "Best hotel for hospital visitors in Dwarka", "Luxury suites West Delhi",
    
    // Consumer-Focused "Near Me" & Utility
    "Luxury boutique hotels near me", "Best luxury staycation Delhi NCR", 
    "Hotels with cloud kitchen dining near me", "Boutique hotel with banquet hall", 
    "Safe luxury stay for hospital attendants", "Business hotel with high-speed wifi Dwarka", 
    "Premium grooming and salon services Dwarka", "Boutique hotel with 24/7 reception",
    
    // Service-Specific Node Anchors
    "Gourmet food delivery Matiala", "Luxury salon near Matiala village", 
    "Tech-enabled boutique hotel rooms", "Hospitality services for Akash Hospital patients",
    "Exclusive staycation packages West Delhi"

  ],
  authors: [{ name: "Ethereal Inn Hospitality LLP" }],
  icons: {
    icon: "/logo-bg.jpeg", 
    apple: "/logo-bg.jpeg",
  },
  openGraph: {
    title: "Ethereal Inn Hospitality LLP | Delhi's Refined Experience",
    description: "Boutique luxury accommodations, lifestyle concepts, and enterprise hospitality SaaS modules.",
    url: "https://www.etherealinn.com",
    siteName: "Ethereal Inn Hospitality LLP",
    images: [{ 
      url: "/logo-bg.jpeg", 
      width: 1200, 
      height: 630, 
      alt: "Premium Hospitality at Ethereal Inn" 
    }],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ethereal Inn Hospitality LLP",
    description: "Experience refined luxury accommodations and modern property management infrastructure.",
    images: ["/logo-bg.jpeg"],
  },
  alternates: {
    canonical: "https://www.etherealinn.com/",
  },
};

// --- Dashboard Background ---
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
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_4px,3px_100%] pointer-events-none opacity-[0.05]" />
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 🌟 Dynamic integration tracking pulling straight from your variable mapping
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html lang="en" className="dark" style={{ colorScheme: 'dark' }}>
      <head>

      <link rel="manifest" href="/manifest.json" />
        {/* 🚀 DYNAMIC GOOGLE TAG ENGINE
            Only initializes tracking frames if the environmental value exists. */}
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-tag-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen relative`}>
        <DashboardBackground />
        
        <main className="relative z-10">
          {children}
        </main>
      </body>
    </html>
  );
}