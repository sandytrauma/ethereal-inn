import { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Suites | Ethereal Inn Gallery",
  description: "Explore the architectural sanctuary of Ethereal Inn. From our Signature rooms to the Grand Obsidian Penthouse, discover luxury redefined in Gurugram.",
  openGraph: {
    title: "Ethereal Inn | The Suite Gallery",
    description: "Architectural elegance meets divine comfort. View our collection of luxury suites.",
    images: [
      {
        url: "https://images.unsplash.com/photo-1582719478250-c89cae4df85b?q=80&w=1200",
        width: 1200,
        height: 630,
        alt: "Ethereal Inn Luxury Suite",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Suites | Ethereal Inn",
    description: "Experience the pinnacle of urban luxury.",
    images: ["https://images.unsplash.com/photo-1582719478250-c89cae4df85b?q=80&w=1200"],
  },
};

export default function SuitesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}