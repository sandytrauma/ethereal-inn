// components/InvoiceTemplate.tsx
"use client";

import React from "react";
import { MapPin, Calendar } from "lucide-react";

export interface PropertyData {
  id: string;
  name: string;
  address: string;
  tagline: string;
}

export interface SingleInvoice {
  id: number;
  propertyId: string | null;  
  roomNumber: number | null;
  guestName: string | null;
  totalAmount: number | null;
  checkInDate: Date | string | null;  
  checkoutDate: Date | string | null;
 propertyDetails?: { 
    name: string;
    address: string;
    tagline: string;
    slug?: string; 
  };
}

interface InvoiceProps {
  invoice: SingleInvoice | null;
}

const getPropertyProfile = (propertyId: string | null) => {
  const normalized = propertyId?.toUpperCase().trim() || "DEFAULT";
  
  switch (normalized) {
    case "MOHAN_GARDEN":
      return {
        name: "Ethereal Inn - Mohan Garden",
        address: "Uttam Nagar, New Delhi - 110059",
        tagline: "Experience the Urban Sanctuary",
      };

    case "DWARKA_SEC_3":
    case "MATIALA_EXTN": 
      return {
        name: "Ethereal Inn - Dwarka Sanctuary",
        address: "Matiala Extn., Dwarka Sec 3 (Near DPS School & Aakash Hospital), New Delhi - 110078",
        tagline: "Experience the Premium Comfort Sanctuary",
      };

    default:
      return {
        name: "_____________________________________________",
        address: "__________________________________________",
        tagline: "Experience the Sanctuary",
      };
  }
};

const InvoiceTemplate = React.forwardRef<HTMLDivElement, InvoiceProps>(
  ({ invoice }, ref) => {
    if (!invoice) return null;

    const property = getPropertyProfile(invoice.propertyId) || invoice.propertyDetails || { 
        name: "Ethereal Inn", 
        address: "India", 
        tagline: "Experience the Sanctuary", 
        slug: "general" 
    };

    // Standardize native text parsing across strings or datetime stamp parameters safely
    const formatDate = (dateInput: Date | string | null) => {
      if (!dateInput) return "N/A";
      const parsedDate = new Date(dateInput);
      return isNaN(parsedDate.getTime()) 
        ? "N/A" 
        : parsedDate.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
          });
    };

    const calculateNights = () => {
      if (!invoice.checkInDate || !invoice.checkoutDate) return 1;
      
      const start = new Date(invoice.checkInDate);
      const end = new Date(invoice.checkoutDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1;
      
      // Neutralize timestamp fractional hours to safeguard calculations against daylight savings fluctuations
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Guard against division-by-zero math crashes if guests check in and out on the same operational calendar date
      return diffDays <= 0 ? 1 : diffDays; 
    };

    const totalNights = calculateNights();

    return (
     <div
        ref={ref}
        // ADDED: bg-[url('/logo-bg.jpeg')] + background positioning
        className="p-12 bg-white text-black min-h-[297mm] font-sans border-[12px] border-double border-gray-100 flex flex-col justify-between print:border-none print:p-6 select-none print:min-h-0 bg-[url('/logo-bg.jpeg')] bg-center bg-no-repeat bg-contain"
        style={{ width: "210mm" }}
      >
        <div className="w-full bg-white/90 p-4 rounded-xl space-y-10">
          {/* Header Branding Panel */}
          <div className="flex justify-between items-start border-b-2 border-amber-600 pb-6 print:border-amber-600">
            <div className="w-full space-y-10 flex-grow">
              <h1 className="text-xl font-black uppercase tracking-tight text-gray-950">
                Ethereal Inn <span className="text-amber-600 print:text-amber-600">Hospitality LLP</span>
              </h1>
              <div className="text-xs text-gray-600 space-y-1">
                <p className="flex items-center gap-1 font-bold text-gray-800">
                  <MapPin size={12} className="text-amber-600 print:text-amber-600" /> {property.name}
                </p>
                <p>{property.address}</p>
              </div>
            </div>
            
            <div className="text-right space-y-1">
              <div className="bg-amber-600 text-white px-3 py-1 text-[10px] font-black uppercase tracking-wider inline-block print:bg-amber-600 print:text-white [-webkit-print-color-adjust:exact] [print-color-adjust:exact]">
                Tax Invoice
              </div>
              <p className="text-xs font-mono font-bold text-gray-900">INV-REF: #EIH-{String(invoice.id).padStart(5, "0")}</p>
              <p className="text-[11px] text-gray-500 font-medium">Issue Date: {formatDate(invoice.checkoutDate)}</p>
            </div>
          </div>

          {/* Guest Stay Metadata Ledger Card */}
          <div className="grid grid-cols-2 gap-8 bg-gray-50  p-4 rounded-xl border border-gray-100 print:bg-gray-50">
            <div className="space-y-1">
              <p className="text-[9px] uppercase font-black text-amber-600 tracking-widest">Guest Account File</p>
              <h2 className="text-md font-bold text-gray-900 border-l-2 border-amber-600 pl-2">
                {invoice.guestName || "Valued Guest"}
              </h2>
              <p className="text-[11px] text-gray-600 pt-1 font-medium">Allocated Room Space: <span className="font-bold text-gray-900 font-mono">RM-{invoice.roomNumber ?? "N/A"}</span></p>
            </div>
            
            <div className="text-right text-xs space-y-1 font-medium text-gray-700 flex flex-col justify-center">
              <p className="flex items-center justify-end gap-1.5 text-gray-600">
                <Calendar size={12} className="text-gray-400" /> In: <span className="font-mono text-gray-900 font-bold">{formatDate(invoice.checkInDate)}</span>
              </p>
              <p className="flex items-center justify-end gap-1.5 text-gray-600">
                <Calendar size={12} className="text-gray-400" /> Out: <span className="font-mono text-gray-900 font-bold">{formatDate(invoice.checkoutDate)}</span>
              </p>
              <p className="text-[10px] text-amber-700 font-mono font-bold uppercase tracking-tight bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded ml-auto mt-1">
                Duration: {totalNights} {totalNights === 1 ? "Night" : "Nights"}
              </p>
            </div>
          </div>

          {/* Itemized Accommodation Breakdown Table */}
          <div className="w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-200 text-[10px] uppercase tracking-wider text-gray-500 font-bold select-none">
                  <th className="pb-3">Description of Stay Service</th>
                  <th className="pb-3 text-right">Qty</th>
                  <th className="pb-3 text-right">Tariff / Night</th>
                  <th className="pb-3 text-right">Gross Amount</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-gray-100">
                <tr className="group">
                  <td className="py-4">
                    <p className="font-bold text-gray-900">Premium Boutique Accommodation</p>
                    <p className="text-[11px] text-gray-500 mt-0.5 italic font-sans">
                      {property.tagline} • Room {invoice.roomNumber}
                    </p>
                  </td>
                  <td className="py-4 text-right font-mono text-gray-600">{String(totalNights).padStart(2, "0")}</td>
                  <td className="py-4 text-right font-mono text-gray-600">
                    ₹{invoice.totalAmount ? Math.round(invoice.totalAmount / totalNights).toLocaleString("en-IN") : "0"}
                  </td>
                  <td className="py-4 text-right font-mono font-bold text-gray-900">
                    ₹{invoice.totalAmount?.toLocaleString("en-IN") ?? "0"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Financial Aggregations Layer */}
          <div className="ml-auto w-5/12 border-t-2 border-gray-100 pt-4 space-y-2 [break-inside:avoid] print:[break-inside:avoid]">
            <div className="flex justify-between text-xs text-gray-500 font-medium">
              <span>Room Subtotal:</span>
              <span className="font-mono">₹{invoice.totalAmount?.toLocaleString("en-IN") ?? "0"}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500 font-medium">
              <span>CGST / SGST (0% Integrated):</span>
              <span className="font-mono">₹0.00</span>
            </div>
            <div className="flex justify-between text-sm font-black text-gray-900 border-t border-gray-100 pt-2 bg-amber-50/40 p-2 rounded-lg print:bg-amber-50/40">
              <span>Grand Total:</span>
              <span className="text-amber-600 font-mono">₹{invoice.totalAmount?.toLocaleString("en-IN") ?? "0"}</span>
            </div>
          </div>
        </div>

        {/* Corporate Legal Audit Footer Block */}
        <div className="border-t border-gray-100 pt-6 text-center space-y-2 [break-inside:avoid] print:[break-inside:avoid]">
          <p className="text-xs font-bold text-amber-700 italic">"{property.tagline}"</p>
          <div className="space-y-1 select-none">
            <p className="text-[9px] text-gray-400 uppercase tracking-[0.2em]">
              This is an authenticated, computer-generated tax document for Ethereal Inn Hospitality LLP
            </p>
            <p className="text-[8px] text-gray-400 font-mono">System Integrity Verified • No Physical Signature Required</p>
          </div>
        </div>
      </div>
    );
  }
);

InvoiceTemplate.displayName = "InvoiceTemplate";
export default InvoiceTemplate;