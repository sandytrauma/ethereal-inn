// app/ethereal-inn/page.tsx
import { Metadata } from "next";
import LoginPage from "@/components/Login";
import BrandingJsonLd from "@/components/BrandingJsonLd";

// =========================================================================
// 🎯 B2B OVERRIDE METADATA: Aligns with your /ethereal-inn URL structure
// =========================================================================
export const metadata: Metadata = {
  title: "Ethereal Inn Platform | Effortless Multi-Property Management Ecosystem",
  description: "Run your properties with absolute leniency. Align with the Ethereal brand network for plug-and-play multi-location management, live stock tracking, and automated ledgers.",
  keywords: [
    "Hospitality SaaS", 
    "Multi-Property Management Software", 
    "Hotel Operations Automation", 
    "Ethereal Inn Partner Node", 
    "Plug and Play Hotel Ledger"
  ],
  alternates: {
    // 🔗 CRITICAL: Anchors this canonical node to prevent home layout collisions
    canonical: "https://www.etherealinn.com/ethereal-inn",
  },
  openGraph: {
    title: "Ethereal Inn | Operational Scaling Engineered for Hoteliers",
    description: "Zero heavy setups. No technical stress. Turn your property operations into our priority.",
    url: "https://www.etherealinn.com/ethereal-inn",
    siteName: "Ethereal Inn Platform",
    images: [{ 
      url: "/logo-bg.jpeg", 
      width: 1200, 
      height: 630, 
      alt: "Ethereal Inn SaaS Management Command Interface Dashboard" 
    }],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ethereal Inn Platform | Scale Instantly",
    description: "Plug-and-play hospitality management frameworks built for modern ambitious brands.",
    images: ["/logo-bg.jpeg"],
  },
};

export default function Page() {
  return (
    <>
      {/* 🚀 Injects the knowledge graph layers into the HTML response header for AI models */}
      <BrandingJsonLd />
      
      {/* Renders your full responsive interactive entry matrix component */}
      <LoginPage />
    </>
  );
}