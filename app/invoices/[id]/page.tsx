// app/public-invoice/[id]/page.tsx
import { db } from "@/db";
import { invoices, rooms } from "@/db/schema"; 
import { eq, and } from "drizzle-orm";
import InvoiceTemplate, { SingleInvoice } from "@/components/dashboard/InvoiceTemplate"; 
import PrintButton from "@/components/invoice/PrintButton"; 
import { notFound } from "next/navigation";
import { unscrambleId } from "@/lib/cryptoId";
import { properties } from "@/db/micro-schema";

export const dynamic = "force-dynamic";

interface PublicInvoicePageProps {
  params: Promise<{ id: string }>;
}

export default async function PublicInvoicePage({ params }: PublicInvoicePageProps) {
  const { id } = await params;

  // 1. Unscramble the obfuscated cryptographic public identifier into the real database serial integer
  const realDbId = unscrambleId(id);

  if (!realDbId || isNaN(realDbId)) {
    notFound();
  }

  // 2. Perform a flat relational join lookup pass to extract the live room check-in timestamp
 // Update the join chain
const joinedData = await db
  .select({
    invoiceId: invoices.id,
    propertyId: invoices.propertyId,
   propertyName: properties.name,
    propertyCity: properties.city,
    propertySlug: properties.slug,
    roomNumber: invoices.roomNumber,
    guestName: invoices.guestName,
    totalAmount: invoices.totalAmount,
    checkInDate: invoices.checkInDate,
    checkoutDate: invoices.checkoutDate,
  })
  .from(invoices)
  .leftJoin(properties, eq(invoices.propertyId, properties.id)) // Join properties directly
  .where(eq(invoices.id, realDbId))
  .then(res => res[0]);

  if (!joinedData) {
    notFound();
  }

  

  // 3. DEFENSIVE STRATEGY fallback: If a receptionist already purged the guest file from the live room row,
  // mathematically calculate a 1-night fallback frame relative to check-out to avoid displaying template flags.
  const resolvedCheckIn = joinedData.checkInDate || (joinedData.checkoutDate 
    ? new Date(new Date(joinedData.checkoutDate).getTime() - 24 * 60 * 60 * 1000) 
    : null);

  // 4. Shape payload parameters cleanly to conform to the strict frontend presentation interface
  const formattedInvoice: SingleInvoice = {
    id: joinedData.invoiceId,
    propertyId: joinedData.propertyId ? String(joinedData.propertyId) : "DEFAULT",
    roomNumber: joinedData.roomNumber,
    guestName: joinedData.guestName,
    totalAmount: joinedData.totalAmount,
    checkInDate: resolvedCheckIn, // Perfectly aligned casing contract mapping passed down
    checkoutDate: joinedData.checkoutDate,
  propertyDetails: {
    name: joinedData.propertyName || "Ethereal Inn",
    address: joinedData.propertySlug 
      ? joinedData.propertySlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
      : "New Delhi, India",
    tagline: "Experience the Sanctuary",
  }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-10 flex flex-col items-center justify-center selection:bg-amber-500 selection:text-slate-950">
      
      {/* Printable Master Canvas Envelope Layer */}
      <div className="bg-white shadow-2xl rounded-xl overflow-hidden border border-slate-200/60 print:shadow-none print:border-none print:rounded-none animate-fadeIn">
         <InvoiceTemplate invoice={formattedInvoice} />
      </div>
      
      {/* Control Actions Tray Layer (Hidden natively via tailwind global 'no-print' styles) */}
      <div className="mt-8 no-print select-none">
        <PrintButton />
      </div>

    </div>
  );
}