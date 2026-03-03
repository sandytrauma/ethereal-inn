"use client";

import React, { useState } from 'react';
import { Save, AlertCircle, Loader2 } from 'lucide-react';
import { closeDayBook } from '@/lib/actions/finance';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";

// 1. Define Props Interface to fix the TypeScript "IntrinsicAttributes" error
interface DayBookFormProps {
  onSuccess?: () => void;
}

interface InputFieldProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: "number" | "text";
  placeholder?: string;
  className?: string;
}

const InputField = ({ label, value, onChange, type = "number", placeholder = "₹ 0", className = "" }: InputFieldProps) => (
  <div className={`space-y-2 ${className}`}>
    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
      {label}
    </label>
    <input 
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 focus:border-amber-500 outline-none text-white font-bold transition-all placeholder:text-slate-700"
    />
  </div>
);

// 2. Destructure onSuccess from props
export function DayBookForm({ onSuccess }: DayBookFormProps) {
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState({
    cashRevenue: '',
    upiRevenue: '',
    otaPayouts: '',
    pettyExpenses: '',
    notes: ''
  });

  const totalCollection = (Number(values.cashRevenue) || 0) + (Number(values.upiRevenue) || 0) + (Number(values.otaPayouts) || 0);
  const netCash = totalCollection - (Number(values.pettyExpenses) || 0);

  const handleSubmit = async () => {
    // Basic validation
    if (totalCollection <= 0 && !values.notes) {
      alert("Please enter records before closing.");
      return;
    }

    setLoading(true);
    try {
      // 3. Call the updated server action
      const result = await closeDayBook({ 
        ...values, 
        totalCollection, 
        netCash 
      });
      
      if (result.success) {
        // Reset local state
        setValues({ cashRevenue: '', upiRevenue: '', otaPayouts: '', pettyExpenses: '', notes: '' });
        
        // 4. Trigger the tab switch and data refresh in the Dashboard
        if (onSuccess) {
          onSuccess();
        }
      } else {
        alert(result.error || "Failed to save record");
      }
    } catch (err) {
      console.error("Submission error:", err);
      alert("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-slate-900/50 backdrop-blur-md border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-xl">Day Close Details</CardTitle>
        <CardDescription className="text-slate-500 font-medium">Manual End-of-Day Entry</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Revenue Section */}
        <div className="grid grid-cols-2 gap-4">
          <InputField 
            label="Cash Revenue" 
            value={values.cashRevenue} 
            onChange={(v) => setValues({...values, cashRevenue: v})} 
          />
          <InputField 
            label="UPI / Card" 
            value={values.upiRevenue} 
            onChange={(v) => setValues({...values, upiRevenue: v})} 
          />
        </div>

        <InputField 
          label="OTA Settlements (MMT/Agoda)" 
          value={values.otaPayouts} 
          onChange={(v) => setValues({...values, otaPayouts: v})} 
        />

        <InputField 
          label="Petty Expenses" 
          value={values.pettyExpenses} 
          onChange={(v) => setValues({...values, pettyExpenses: v})} 
          className="text-rose-400"
        />

        {/* Totals Display */}
        <div className="p-6 bg-slate-950/50 rounded-[2rem] border border-slate-800 space-y-3 shadow-inner">
          <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase font-black tracking-widest">
            <span>Gross Collection</span>
            <span className="text-white font-bold">₹{totalCollection.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between items-center border-t border-slate-800 pt-3">
            <span className="text-slate-400 text-sm font-bold">Net Cash to Bank</span>
            <span className="text-2xl font-black text-emerald-400 tracking-tighter">
              ₹{netCash.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Shift Notes</label>
          <textarea 
            rows={2}
            value={values.notes}
            onChange={(e) => setValues({...values, notes: e.target.value})}
            placeholder="Describe any issues, maintenance, or guest feedback..."
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 focus:border-amber-500 outline-none text-sm text-white resize-none transition-all placeholder:text-slate-700"
          />
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-4 pb-8">
        <button 
          disabled={loading}
          onClick={handleSubmit}
          className="w-full bg-amber-400 text-slate-950 font-black py-5 rounded-[1.5rem] shadow-xl shadow-amber-500/10 hover:bg-amber-300 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin h-5 w-5" />
              <span>Updating Ledger...</span>
            </>
          ) : (
            <>
              <Save size={20} strokeWidth={2.5} />
              <span>Close Day Book</span>
            </>
          )}
        </button>

        <div className="flex items-start gap-3 p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10">
          <AlertCircle className="text-amber-500 w-4 h-4 mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-amber-500/70 font-medium leading-relaxed">
            This action will record today's figures in the permanent ledger. Please verify the <strong>Net Cash</strong> amount before submission.
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}