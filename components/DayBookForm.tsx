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
  FileText,
  Utensils,
  BedDouble
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
  
  // UPDATED: Added roomRevenue and serviceRevenue for Live Analytics
  const [values, setValues] = useState({
    cashRevenue: '',
    upiRevenue: '',
    otaPayouts: '',
    roomRevenue: '',      // NEW
    serviceRevenue: '',   // NEW
    pettyExpenses: '',
    notes: ''
  });

  // CALCULATIONS
  const totalCollection = (Number(values.cashRevenue) || 0) + (Number(values.upiRevenue) || 0) + (Number(values.otaPayouts) || 0);
  const totalAllocation = (Number(values.roomRevenue) || 0) + (Number(values.serviceRevenue) || 0);
  const netCash = totalCollection - (Number(values.pettyExpenses) || 0);
  
  // Validation: Checking if allocation matches total
  const allocationGap = totalCollection - totalAllocation;

  const handleSubmit = async () => {
    if (totalCollection <= 0 && !values.notes) {
      alert("Please enter revenue details.");
      return;
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
        setTimeout(() => {
          setValues({ 
            cashRevenue: '', upiRevenue: '', otaPayouts: '', 
            roomRevenue: '', serviceRevenue: '', 
            pettyExpenses: '', notes: '' 
          });
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
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">Vault Updated</h3>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">Shift records archived</p>
            </motion.div>
          )}
        </AnimatePresence>

        <CardHeader className="p-8 pb-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-white text-2xl font-black tracking-tight">Closing Entry</CardTitle>
              <CardDescription className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
              </CardDescription>
            </div>
            <div className="bg-amber-400/10 p-2 rounded-xl">
               <IndianRupee className="text-amber-400" size={20} />
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-8 space-y-6">
          {/* Section 1: Payment Method Breakdown */}
          <div className="space-y-4">
            <p className="text-[9px] font-black text-amber-400 uppercase tracking-[0.3em]">1. Payment Sources</p>
            <div className="grid grid-cols-2 gap-4">
              <InputField 
                label="Cash" 
                icon={IndianRupee}
                value={values.cashRevenue} 
                onChange={(v) => setValues({...values, cashRevenue: v})} 
              />
              <InputField 
                label="Digital/UPI" 
                icon={CreditCard}
                value={values.upiRevenue} 
                onChange={(v) => setValues({...values, upiRevenue: v})} 
              />
            </div>
            <InputField 
              label="OTA Payouts (Agoda/MMT)" 
              icon={Globe}
              value={values.otaPayouts} 
              onChange={(v) => setValues({...values, otaPayouts: v})} 
            />
          </div>

          {/* Section 2: Revenue Allocation (For Analytics) */}
          <div className="space-y-4 p-6 bg-white/5 rounded-[2.5rem] border border-white/5">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">2. Category Allocation</p>
            <div className="grid grid-cols-2 gap-4">
              <InputField 
                label="Room Rev" 
                icon={BedDouble}
                value={values.roomRevenue} 
                onChange={(v) => setValues({...values, roomRevenue: v})} 
              />
              <InputField 
                label="Services/Food" 
                icon={Utensils}
                value={values.serviceRevenue} 
                onChange={(v) => setValues({...values, serviceRevenue: v})} 
              />
            </div>
            {allocationGap !== 0 && totalCollection > 0 && (
              <p className="text-[8px] font-bold text-slate-500 uppercase text-center italic tracking-wider">
                Unallocated: ₹{allocationGap.toLocaleString()}
              </p>
            )}
          </div>

          {/* Section 3: Deductions */}
          <InputField 
            label="Petty Expenses (Daily Spends)" 
            icon={MinusCircle}
            value={values.pettyExpenses} 
            onChange={(v) => setValues({...values, pettyExpenses: v})} 
            isNegative={true}
          />

          {/* TOTALS SUMMARY */}
          <div className="p-8 bg-slate-950 rounded-[2.5rem] border border-white/10 relative overflow-hidden group">
            <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]">
              <span>Gross Collection</span>
              <span className="text-slate-300">₹{totalCollection.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center border-t border-white/5 mt-4 pt-4">
              <span className="text-slate-400 text-sm font-bold">In-Hand Cash</span>
              <span className="text-3xl font-black text-white tracking-tighter italic">
                ₹{netCash.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* NOTES */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
              <FileText size={12} className="text-slate-500" />
              Daily Shift Report
            </label>
            <textarea 
              rows={2}
              value={values.notes}
              onChange={(e) => setValues({...values, notes: e.target.value})}
              placeholder="Maintenance issues, late check-ins, or guest complaints..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 focus:border-amber-500 outline-none text-sm text-white resize-none transition-all placeholder:text-slate-800"
            />
          </div>
        </CardContent>

        <CardFooter className="px-8 flex flex-col gap-6 pb-10">
          <button 
            disabled={loading || isSuccess}
            onClick={handleSubmit}
            className="w-full bg-amber-400 text-slate-950 font-black py-6 rounded-[2rem] shadow-2xl shadow-amber-400/20 hover:bg-amber-300 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="animate-spin h-6 w-6" />
            ) : (
              <>
                <Save size={18} strokeWidth={3} />
                <span className="uppercase tracking-[0.2em] text-[11px]">Finalize Day Book</span>
              </>
            )}
          </button>

          <div className="flex items-start gap-4 p-5 bg-rose-500/5 rounded-[1.8rem] border border-rose-500/10">
            <AlertCircle className="text-rose-500 w-5 h-5 mt-0.5 flex-shrink-0" />
            <p className="text-[9px] text-rose-500/70 font-black leading-relaxed uppercase tracking-wider">
              Legal Disclaimer: By clicking submit, you confirm that physical cash holdings match the <span className="text-white underline">Net Cash</span> total above. 
            </p>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}