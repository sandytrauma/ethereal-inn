import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Urban Ambrosia | Divine Culinary Craft",
  description: "Experience the cloud kitchen and fine dining of Etherealinn. Artisanal flavors, global journeys, and 24/7 gourmet service in Gurugram.",
  openGraph: {
    title: "Urban Ambrosia | Etherealinn Dining",
    images: ["https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200"],
  },
};

export default function CulinaryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}