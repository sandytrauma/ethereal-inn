// app/ethereal-inn/page.tsx
import { Metadata } from "next";
import LoginPage from "@/components/Login";
import BrandingJsonLd from "@/components/BrandingJsonLd";

// =========================================================================
// 🎯 B2B OVERRIDE METADATA: Aligns with Ethereal Inn Hospitality LLP
// =========================================================================
export const metadata: Metadata = {
  title: "Ethereal Inn Hospitality LLP | Luxury Boutique Stays & Tech Platform | Become a Partner | Ethereal Inn Hospitality LLP",
  description: "Scale your hospitality footprint with Ethereal Inn Hospitality LLP. Access advanced cloud-native multi-tenant tech solutions, automated inventory loops, and multi-property logistics for Ethereal Inn, Ethereal Glam, and Urban Ambrosia units.",
  keywords: [
    "Ethereal Inn Hospitality LLP",
    "Ethereal Inn Partner Node",
    "Ethereal Glam",
    "Urban Ambrosia",
    "Multi-Property Management Software",
    "Hospitality SaaS Automation",
    "Plug and Play Hotel Ledger"
  ],
  alternates: {
    // 🔗 CRITICAL: Anchors this canonical node to prevent home layout collisions
    canonical: "https://www.etherealinn.com/ethereal-inn",
  },
  openGraph: {
    title: "Ethereal Inn Hospitality LLP | Multi-Tenant Tech Solutions",
    description: "Plug-and-play property activation loops with zero infrastructure overhead. Offload your operational logistics completely across lodging, lifestyle, and culinary branches.",
    url: "https://www.etherealinn.com/ethereal-inn",
    siteName: "Ethereal Inn Hospitality LLP Platform",
    images: [{ 
      url: "/logo-bg.jpeg", 
      width: 1200, 
      height: 630, 
      alt: "Ethereal Inn Hospitality LLP SaaS Command Interface Dashboard" 
    }],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ethereal Inn Hospitality LLP | Scale Instantly",
    description: "Plug-and-play hospitality management frameworks built for modern ambitious brands.",
    images: ["/logo-bg.jpeg"],
  },
};

export default function Page() {
  return (
    <>
      {/* 🚀 Injects the complete multi-unit knowledge graph layers into the HTML response header for AI models */}
      <BrandingJsonLd />
      
      {/* Renders your full responsive interactive entry matrix component */}
      <LoginPage />

      
    </>
  );
}