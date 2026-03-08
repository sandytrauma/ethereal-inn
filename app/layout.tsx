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
  description: "Experience refined luxury at Ethereal Inn. Located near Chhatarpur Metro, offering boutique rooms, fine dining, and elite amenities. Book your stay today.",
  keywords: ["Luxury Hotel Chhatarpur", "Boutique Stay Delhi", "Hotels near Chhatarpur Metro", "Ethereal Inn New Delhi"],
  authors: [{ name: "Ethereal Inn Management" }],

  icons: {
    // Direct link to the Flaticon bedroom icon
    icon: "https://cdn-icons-png.flaticon.com/512/3030/3030336.png", 
    apple: "https://cdn-icons-png.flaticon.com/512/3030/3030336.png",
  },
  
  // OpenGraph (WhatsApp, Facebook, LinkedIn)
  openGraph: {
    title: "Ethereal Inn | Chhatarpur's Most Refined Experience",
    description: "Boutique luxury, minutes from the Metro. Experience the hidden gem of South Delhi.",
    url: "https://ethereal-inn.vercel.app/login", // Replace with your actual domain
    siteName: "Ethereal Inn",
    images: [
      {
        url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200&h=630&fit=crop", // Hero Image optimized for social sharing
        width: 1200,
        height: 630,
        alt: "Luxury Suite at Ethereal Inn",
      },
    ],
    locale: "en_IN",
    type: "website",
  },

  // Twitter (X) Card
  twitter: {
    card: "summary_large_image",
    title: "Ethereal Inn | Luxury Boutique Stay",
    description: "Experience Chhatarpur's premier boutique hotel. Elegant rooms and fine dining.",
    images: ["https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200&h=630&fit=crop"],
  },

  // Search Engine Bot Instructions
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
