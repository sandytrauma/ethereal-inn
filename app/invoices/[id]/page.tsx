import { db } from "@/db";
import { invoices } from "@/db/schema";
import { eq } from "drizzle-orm";
import InvoiceTemplate from "@/components/dashboard/InvoiceTemplate";
import PrintButton from "@/components/invoice/PrintButton"; 
import { notFound } from "next/navigation";
import { unscrambleId } from "@/lib/cryptoId";

export default async function PublicInvoicePage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;

  // 1. Log what the URL parameter actually is
  console.log("=== INVOICE DEBUG START ===");
  console.log("1. Raw URL Param ID Received:", id);

  // Decode the scrambled parameter string into the real database integer
  const realDbId = unscrambleId(id);
  console.log("2. Decoded Database ID Integer:", realDbId);

  // If the hash is corrupt or invalid, fail fast with a 404
  if (isNaN(realDbId)) {
    console.error("❌ CRITICAL: Decoding resulted in NaN!");
    console.log("=== INVOICE DEBUG END ===");
    notFound();
  }

  const invoiceData = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, realDbId))
    .then(res => res[0]);

  console.log("3. Database Query Result Found:", invoiceData ? "YES" : "NO");
  console.log("=== INVOICE DEBUG END ===");

  if (!invoiceData) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-10 flex flex-col items-center">
      <div className="max-w-[11in] w-full bg-white shadow-2xl rounded-sm overflow-hidden">
         <InvoiceTemplate invoice={invoiceData} />
      </div>
      
      <div className="mt-8 no-print">
        <PrintButton />
      </div>
    </div>
  );
}