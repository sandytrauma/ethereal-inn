"use client";

import React, { useState, useRef, useEffect } from "react";
import { useReactToPrint } from "react-to-print";
import { Printer, Share2 } from "lucide-react";
import InvoiceTemplate, { SingleInvoice } from "./InvoiceTemplate";
import HistoryNavigation from "./HistoryNavigation";

interface GuestCheckoutHistoryProps {
  checkoutData: SingleInvoice[];
}

export default function GuestCheckoutHistory({ checkoutData }: GuestCheckoutHistoryProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<SingleInvoice | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  const onPrintAction = (item: SingleInvoice) => {
    setSelectedInvoice(item);
    setTimeout(() => {
      handlePrint();
    }, 200);
  };

  const onWhatsAppAction = (item: SingleInvoice) => {
    const text = `Hello ${item.guestName}, thank you for choosing Ethereal Inn. Your invoice for Room ${item.roomNumber} is ready. View it here: https://www.etherealinn.com/invoices/${item.id}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="space-y-6">
      <HistoryNavigation />
      <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
        <table className="w-full text-left">
          <thead className="bg-white/10 text-amber-500 uppercase text-[11px] tracking-widest font-black">
            <tr>
              <th className="p-5">Guest Name</th>
              <th className="p-5">Room</th>
              <th className="p-5">Date</th>
              <th className="p-5">Amount</th>
              <th className="p-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-white/80">
            {checkoutData.map((item) => (
              <tr key={item.id} className="border-t border-white/5 hover:bg-white/5 transition-all">
                <td className="p-5 font-bold text-white">{item.guestName}</td>
                <td className="p-5">Room {item.roomNumber}</td>
                
                {/* FIX: Use 'mounted' to gate the date rendering */}
                <td className="p-5 text-sm">
                  {mounted && item.checkoutDate 
                    ? new Date(item.checkoutDate).toLocaleDateString('en-IN') 
                    : "---"
                  }
                </td>

                <td className="p-5 font-mono text-amber-400">
                   ₹{mounted ? item.totalAmount?.toLocaleString() : "---"}
                </td>

                <td className="p-5 flex justify-end gap-4">
                  <button onClick={() => onPrintAction(item)} className="hover:text-amber-500 transition-colors">
                    <Printer size={18} />
                  </button>
                  <button onClick={() => onWhatsAppAction(item)} className="hover:text-emerald-500 transition-colors">
                    <Share2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* HIDDEN PRINT AREA: Only render when mounted to prevent hydration errors */}
      <div className="hidden">
        {mounted && <InvoiceTemplate ref={printRef} invoice={selectedInvoice} />}
      </div>
    </div>
  );
}