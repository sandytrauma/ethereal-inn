"use client";

import { useState } from "react";
import { getExportData } from "@/lib/actions/finance";
import { downloadCSV } from "@/lib/utils/csv-export";
import { FileSpreadsheet, Loader2 } from "lucide-react";

export function ExportRecordsButton() {
  const [loading, setLoading] = useState(false);

  const handleExport = async (period: 'month' | 'quarter' | 'year') => {
    setLoading(true);
    const result = await getExportData(period);
    
    if (result.success && result.data.length > 0) {
      downloadCSV(result.data, `Revenue_Report_${period}_${new Date().toISOString().split('T')[0]}`);
    } else {
      alert("No records found for this period.");
    }
    setLoading(false);
  };

  return (
    <div className="flex gap-4">
      {['month', 'quarter', 'year'].map((p) => (
        <button
          key={p}
          onClick={() => handleExport(p as any)}
          disabled={loading}
          className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white border border-emerald-500/20 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={14} /> : <FileSpreadsheet size={14} />}
          Export {p}
        </button>
      ))}
    </div>
  );
}