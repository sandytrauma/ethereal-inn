import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact & Inquiry | Etherealinn",
  description: "Connect with the Etherealinn concierge. Direct WhatsApp bookings and formal inquiries for suites and Urban Ambrosia.",
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}