"use client";

import React, { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { getExportData } from "@/lib/actions/finance";
import { downloadCSV } from "@/lib/utils/csv-export";
import { FileSpreadsheet, Loader2, ChevronDown } from "lucide-react";

interface ExportRecordsButtonProps {
  propertyId?: string; 
  label?: string;
}

export function ExportRecordsButton({ propertyId: propsPropertyId, label }: ExportRecordsButtonProps) {
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const params = useParams();

  // =========================================================================
  // 🌟 THE PARAMETERS FIX: Align parameter keys with your active file paths
  // Your dynamic route parameters are keyed to [id] folders, so read params.id
  // =========================================================================
  const effectiveId = useMemo(() => {
    if (propsPropertyId === "global") return undefined;
    if (propsPropertyId) return propsPropertyId;
    
    // Fallback to routing parameter IDs from folder context tokens ([id])
    return params?.id ? String(params.id) : undefined;
  }, [propsPropertyId, params?.id]);

  const handleExport = async (e: React.MouseEvent, period: 'month' | 'quarter' | 'year') => {
    // 🌟 THE INTERCEPT FIX: Block bubble propagation up into parent dashboard layouts
    e.stopPropagation();
    e.preventDefault();
    
    setLoading(true);
    setIsOpen(false);
    
    try {
      const result = await getExportData(effectiveId, period);
      
      if (result.success && result.data && result.data.length > 0) {
        const dateStr = new Date().toISOString().split('T')[0];
        const contextName = effectiveId ? `Unit_${String(effectiveId).slice(0, 5)}` : "Full_Portfolio";
        const fileName = `Revenue_Report_${contextName}_${period}_${dateStr}`;
        
        downloadCSV(result.data, fileName);
      } else {
        alert(result.error || "No records found for the selected criteria.");
      }
    } catch (error) {
      console.error("Export calculation processing failed:", error);
      alert("An error occurred during transaction data export compilation.");
    } finally {
      setLoading(false);
    }
  };

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid popping side menus when checking range filters
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative font-sans">
      {/* Main Dropdown Toggle */}
      <button
        onClick={toggleDropdown}
        disabled={loading}
        className="bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-50 select-none"
      >
        {loading ? (
          <Loader2 className="animate-spin w-3.5 h-3.5 text-amber-400" />
        ) : (
          <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
        )}
        <span>{label || (effectiveId ? "Export Unit" : "Export Portfolio")}</span>
        <ChevronDown className={`w-3 h-3 text-amber-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu Overlay */}
      {isOpen && (
        <>
          {/* Transparent full-screen click-away backer to trap escape triggers */}
          <div 
            className="fixed inset-0 z-40 bg-transparent" 
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }} 
          />
          
          <div 
            onClick={(e) => e.stopPropagation()} // Clamp child menu triggers
            className="absolute right-0 mt-2 w-48 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="p-2 border-b border-white/5 bg-white/[0.02]">
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 px-3 py-1">Select Range</p>
            </div>
            {((['month', 'quarter', 'year'] as const)).map((p) => (
              <button
                key={p}
                onClick={(e) => handleExport(e, p)}
                className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-300 hover:bg-amber-400 hover:text-slate-950 transition-colors flex items-center justify-between group cursor-pointer"
              >
                {p}
                <span className="opacity-0 group-hover:opacity-100 text-[8px] font-black tracking-tighter italic">GO</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}