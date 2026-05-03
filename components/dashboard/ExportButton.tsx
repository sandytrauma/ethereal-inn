"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { getExportData } from "@/lib/actions/finance";
import { downloadCSV } from "@/lib/utils/csv-export";
import { FileSpreadsheet, Loader2, ChevronDown } from "lucide-react";

// Matches the props being passed from your Header
interface ExportRecordsButtonProps {
  propertyId?: string; 
  label?: string;
}

export function ExportRecordsButton({ propertyId: propsPropertyId, label }: ExportRecordsButtonProps) {
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const params = useParams();

  // Identify the property ID: Prioritize props, then URL params, then fallback to undefined (Global)
  // We treat "global" as undefined to tell the server action to fetch everything
  const effectiveId = propsPropertyId === "global" ? undefined : (propsPropertyId || (params?.propertyId as string));

  const handleExport = async (period: 'month' | 'quarter' | 'year') => {
    setLoading(true);
    setIsOpen(false);
    
    try {
      // Pass the ID (or undefined for global) to the server action
      const result = await getExportData(effectiveId, period);
      
      if (result.success && result.data && result.data.length > 0) {
        const dateStr = new Date().toISOString().split('T')[0];
        // Formatting filename: uses ID slice or "Portfolio" for global view
        const contextName = effectiveId ? `Unit_${String(effectiveId).slice(0, 5)}` : "Full_Portfolio";
        const fileName = `Revenue_Report_${contextName}_${period}_${dateStr}`;
        
        downloadCSV(result.data, fileName);
      } else {
        alert(result.error || "No records found for the selected criteria.");
      }
    } catch (error) {
      console.error("Export failed:", error);
      alert("An error occurred during export.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Main Dropdown Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="animate-spin w-3.5 h-3.5 text-amber-400" />
        ) : (
          <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
        )}
        <span>{label || (effectiveId ? "Export Unit" : "Export Portfolio")}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-200">
          <div className="p-2 border-b border-white/5">
            <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 px-3 py-1">Select Range</p>
          </div>
          {(['month', 'quarter', 'year'] as const).map((p) => (
            <button
              key={p}
              onClick={() => handleExport(p)}
              className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-300 hover:bg-amber-400 hover:text-slate-950 transition-colors flex items-center justify-between group"
            >
              {p}
              <span className="opacity-0 group-hover:opacity-100 text-[8px] font-black">GO</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}