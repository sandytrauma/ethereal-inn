import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact & Inquiry | Ethereal Inn",
  description: "Connect with the Ethereal Inn concierge. Direct WhatsApp bookings and formal inquiries for suites and Urban Ambrosia.",
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}