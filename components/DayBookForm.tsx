"use client";

import React, { useState } from 'react';
import { 
  Save, 
  AlertCircle, 
  Loader2, 
  IndianRupee, 
  CreditCard, 
  Globe, 
  MinusCircle, 
  CheckCircle,
  FileText
} from 'lucide-react';
import { closeDayBook } from '@/lib/actions/finance';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";
import { motion, AnimatePresence } from 'framer-motion';

interface DayBookFormProps {
  onSuccess?: () => void;
}

interface InputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: React.ElementType;
  placeholder?: string;
  className?: string;
  isNegative?: boolean;
}

const InputField = ({ label, value, onChange, icon: Icon, placeholder = "0", className = "", isNegative = false }: InputFieldProps) => (
  <div className={`space-y-2 ${className}`}>
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
      <Icon size={12} className={isNegative ? "text-rose-500" : "text-amber-400"} />
      {label}
    </label>
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">₹</span>
      <input 
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 pl-8 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 outline-none text-white font-bold transition-all placeholder:text-slate-800"
      />
    </div>
  </div>
);

export function DayBookForm({ onSuccess }: DayBookFormProps) {
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
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
    if (totalCollection <= 0 && !values.notes) {
      return; // Add a toast notification here if you have one
    }

    setLoading(true);
    try {
      const result = await closeDayBook({ 
        ...values, 
        totalCollection, 
        netCash 
      });
      
      if (result.success) {
        setIsSuccess(true);
        // Short delay to show success animation before switching tabs
        setTimeout(() => {
          setValues({ cashRevenue: '', upiRevenue: '', otaPayouts: '', pettyExpenses: '', notes: '' });
          if (onSuccess) onSuccess();
        }, 1500);
      } else {
        alert(result.error || "Failed to save record");
      }
    } catch (err) {
      console.error("Submission error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="bg-slate-900/40 backdrop-blur-xl border-white/5 rounded-[3rem] overflow-hidden shadow-2xl relative">
        <AnimatePresence>
          {isSuccess && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center space-y-4"
            >
              <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                <CheckCircle className="text-slate-950" size={40} />
              </div>
              <h3 className="text-xl font-black text-white">Day Closed!</h3>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Ledger Updated Successfully</p>
            </motion.div>
          )}
        </AnimatePresence>

        <CardHeader className="p-8 pb-4">
          <CardTitle className="text-white text-2xl font-black tracking-tight">Financial Close</CardTitle>
          <CardDescription className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </CardDescription>
        </CardHeader>

        <CardContent className="px-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <InputField 
              label="Cash Revenue" 
              icon={IndianRupee}
              value={values.cashRevenue} 
              onChange={(v) => setValues({...values, cashRevenue: v})} 
            />
            <InputField 
              label="UPI / Digital" 
              icon={CreditCard}
              value={values.upiRevenue} 
              onChange={(v) => setValues({...values, upiRevenue: v})} 
            />
          </div>

          <InputField 
            label="OTA Settlements (MMT/Agoda)" 
            icon={Globe}
            value={values.otaPayouts} 
            onChange={(v) => setValues({...values, otaPayouts: v})} 
          />

          <InputField 
            label="Petty Expenses" 
            icon={MinusCircle}
            value={values.pettyExpenses} 
            onChange={(v) => setValues({...values, pettyExpenses: v})} 
            className="text-rose-400"
            isNegative={true}
          />

          {/* Totals Display */}
          <div className="p-8 bg-slate-950/80 rounded-[2.5rem] border border-white/5 space-y-4 shadow-inner relative overflow-hidden group">
            <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]">
              <span>Gross Collection</span>
              <span className="text-slate-300">₹{totalCollection.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center border-t border-white/5 pt-4">
              <span className="text-slate-400 text-sm font-bold">Net Cash to Bank</span>
              <span className="text-3xl font-black text-amber-400 tracking-tighter">
                ₹{netCash.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
              <FileText size={12} className="text-slate-500" />
              Closing Notes
            </label>
            <textarea 
              rows={2}
              value={values.notes}
              onChange={(e) => setValues({...values, notes: e.target.value})}
              placeholder="Guest feedback or maintenance notes..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 focus:border-amber-500 outline-none text-sm text-white resize-none transition-all placeholder:text-slate-800"
            />
          </div>
        </CardContent>

        <CardFooter className="px-8 flex flex-col gap-6 pb-10">
          <button 
            disabled={loading || isSuccess}
            onClick={handleSubmit}
            className="w-full bg-amber-400 text-slate-950 font-black py-6 rounded-[1.8rem] shadow-2xl shadow-amber-400/20 hover:bg-amber-300 active:scale-[0.96] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="animate-spin h-6 w-6" />
            ) : (
              <>
                <Save size={20} strokeWidth={3} />
                <span className="uppercase tracking-widest text-xs">Verify & Submit Ledger</span>
              </>
            )}
          </button>

          <div className="flex items-start gap-4 p-5 bg-amber-500/5 rounded-[1.5rem] border border-amber-500/10">
            <AlertCircle className="text-amber-500 w-5 h-5 mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-amber-500/60 font-bold leading-relaxed uppercase tracking-wider">
              Verification Required: Confirm physical cash matches the <span className="text-amber-500">Net Cash</span> field before closing the shift.
            </p>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}