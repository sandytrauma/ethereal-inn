"use client";

import React from "react";
import { MapPin } from "lucide-react";

// Updated Interface to handle the database types correctly
export interface SingleInvoice {
  id: number;
  propertyId: string | null;
  roomNumber: number | null;
  guestName: string | null;
  totalAmount: number | null;
  checkoutDate: Date | null;
}

interface InvoiceProps {
  invoice: SingleInvoice | null;
}

const InvoiceTemplate = React.forwardRef<HTMLDivElement, InvoiceProps>(
  ({ invoice }, ref) => {
    if (!invoice) return null;

    return (
      <div
        ref={ref}
        className="p-12 bg-white text-black min-h-[11in] font-sans border-[12px] border-double border-gray-100"
      >
        {/* Header Section */}
        <div className="flex justify-between items-start border-b-2 border-amber-600 pb-6">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900">
              Ethereal Inn <span className="text-amber-600">Hospitality LLP</span>
            </h1>
            <div className="mt-2 text-sm text-gray-600 space-y-1">
              <p className="flex items-center gap-1 font-semibold">
                <MapPin size={14} className="text-amber-600" /> Mohan Garden Property
              </p>
              <p>Uttam Nagar, New Delhi - 110059</p>
            </div>
          </div>
          <div className="text-right">
            <div className="bg-amber-600 text-white px-4 py-1 text-xs font-bold uppercase mb-2 inline-block">
              Tax Invoice
            </div>
            <p className="text-sm font-bold text-gray-800">Invoice: #EIH-{invoice.id}</p>
           <p className="text-sm text-gray-600">
  Date: {invoice.checkoutDate 
    ? new Date(invoice.checkoutDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }) 
    : "N/A"}
</p>
          </div>
        </div>

        {/* Guest Section */}
        <div className="grid grid-cols-2 gap-8 mt-10">
          <div>
            <p className="text-[10px] uppercase font-black text-amber-600 tracking-widest mb-1">Guest Details</p>
            <h2 className="text-xl font-bold border-l-4 border-amber-600 pl-3">
              {invoice.guestName || "Valued Guest"}
            </h2>
            <p className="text-sm text-gray-600 mt-2">Checked-out from Room {invoice.roomNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase font-black text-amber-600 tracking-widest mb-1">Booking Info</p>
            <p className="text-sm font-medium">Checkout Status: Completed</p>
            <p className="text-sm text-gray-600 font-mono italic">Verified by System</p>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="mt-12">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                <th className="py-4 font-bold">Description of Service</th>
                <th className="py-4 font-bold text-right">Qty</th>
                <th className="py-4 font-bold text-right">Price</th>
                <th className="py-4 font-bold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b border-gray-100">
                <td className="py-6">
                  <p className="font-bold text-gray-800">Boutique Stay Accommodation</p>
                  <p className="text-xs text-gray-500">Mohan Garden Property Sanctuary Experience</p>
                </td>
                <td className="py-6 text-right">01</td>
                <td className="py-6 text-right">₹{invoice.totalAmount?.toLocaleString() ?? "0"}</td>
                <td className="py-6 text-right font-bold">₹{invoice.totalAmount?.toLocaleString() ?? "0"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="mt-10 ml-auto w-1/2 space-y-3">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal:</span>
            <span>₹{invoice.totalAmount?.toLocaleString() ?? "0"}</span>
          </div>
          <div className="flex justify-between text-xl font-black text-gray-900 border-t-2 border-gray-100 pt-3">
            <span>Grand Total:</span>
            <span className="text-amber-600">₹{invoice.totalAmount?.toLocaleString() ?? "0"}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-24 border-t border-gray-100 pt-8 text-center">
          <p className="text-sm font-bold text-gray-800 italic">"Experience the Sanctuary"</p>
          <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-[0.2em]">
            This is a computer-generated invoice for Ethereal Inn Hospitality LLP
          </p>
        </div>
      </div>
    );
  }
);

InvoiceTemplate.displayName = "InvoiceTemplate";
export default InvoiceTemplate;