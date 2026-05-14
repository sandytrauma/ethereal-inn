import { db } from "@/db";
import { invoices } from "@/db/schema";
import { eq } from "drizzle-orm";
import InvoiceTemplate from "@/components/dashboard/InvoiceTemplate";
import PrintButton from "@/components/invoice/PrintButton"; // Import the client button
import { notFound } from "next/navigation";

export default async function PublicInvoicePage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;

  const invoiceData = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, parseInt(id)))
    .then(res => res[0]);

  if (!invoiceData) notFound();

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-10 flex flex-col items-center">
      <div className="max-w-[11in] w-full bg-white shadow-2xl rounded-sm overflow-hidden">
         <InvoiceTemplate invoice={invoiceData} />
      </div>
      
      {/* This button is now a Client Component, so onClick works! */}
      <div className="mt-8 no-print">
        <PrintButton />
      </div>
    </div>
  );
}