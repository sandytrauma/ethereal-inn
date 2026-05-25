"use client";

import React, { useState, useEffect } from 'react';
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
  BedDouble,
  Building2,
  ChevronDown,
  Calendar,
  History
} from 'lucide-react';
import { closeDayBook, manualAdjustment } from '@/lib/actions/finance';
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
  // 🌟 Direct pre-filtered multi-tenant parent configuration access
  properties?: Array<{ id: string; name: string }>; 
  initialPropertyId?: string; 
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
      <Icon size={12} className={isNegative ? "text-rose-500" : "text-amber-400"} aria-hidden="true" />
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

export function DayBookForm({ onSuccess, properties = [], initialPropertyId }: DayBookFormProps) {
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isManual, setIsManual] = useState(false); 
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(initialPropertyId || "");
  
  const [values, setValues] = useState({
    selectedDate: '', 
    cashRevenue: '',
    upiRevenue: '',
    otaPayouts: '',
    roomRevenue: '',
    serviceRevenue: '',
    pettyExpenses: '',
    notes: ''
  });

  useEffect(() => {
    if (properties.length > 0 && !selectedPropertyId) {
      setSelectedPropertyId(properties[0].id);
    }
  }, [properties, selectedPropertyId]);

  const totalCollection = (Number(values.cashRevenue) || 0) + (Number(values.upiRevenue) || 0) + (Number(values.otaPayouts) || 0);
  const totalAllocation = (Number(values.roomRevenue) || 0) + (Number(values.serviceRevenue) || 0);
  const netCash = totalCollection - (Number(values.pettyExpenses) || 0);
  const allocationGap = totalCollection - totalAllocation;

  const handleSubmit = async () => {
    if (!selectedPropertyId || selectedPropertyId === "") {
      alert("Malformed or missing Property ID. Please select a property.");
      return;
    }

    if (isManual && !values.selectedDate) {
      alert("Please select a date for manual adjustment.");
      return;
    }

    if (totalCollection <= 0 && !values.notes) {
      alert("Please enter revenue details.");
      return;
    }

    setLoading(true);
    try {
      const actionToRun = isManual ? manualAdjustment : closeDayBook;
      
      // =========================================================================
      // 🌟 THE STRUCTURAL FIX: EXPLICIT CLEAN DATA PAYLOAD OBJECT MAPPING
      // Formats data explicitly based on mode to prevent DB type parsing crashes.
      // =========================================================================
      const cleanPayload = {
        cashRevenue: values.cashRevenue || "0",
        upiRevenue: values.upiRevenue || "0",
        otaPayouts: values.otaPayouts || "0",
        roomRevenue: values.roomRevenue || "0",
        serviceRevenue: values.serviceRevenue || "0",
        pettyExpenses: values.pettyExpenses || "0",
        notes: values.notes || "",
        totalCollection: totalCollection.toString(),
        netCash: netCash.toString(),
        // Only append selectedDate if we are performing a back-dated correction entry
        ...(isManual && { selectedDate: values.selectedDate })
      };
      
      const result = await actionToRun(cleanPayload, selectedPropertyId);
      
      if (result.success) {
        setIsSuccess(true);
        setTimeout(() => {
          setValues({ 
            selectedDate: '',
            cashRevenue: '', 
            upiRevenue: '', 
            otaPayouts: '', 
            roomRevenue: '', 
            serviceRevenue: '', 
            pettyExpenses: '', 
            notes: '' 
          });
          setIsSuccess(false);
          setIsManual(false); 
          if (onSuccess) onSuccess();
        }, 1500);
      } else {
        alert(result.error || "Failed to save record");
      }
    } catch (err) {
      console.error("Submission error:", err);
      alert("An internal error occurred during entry tracking processing.");
    } finally {
      setLoading(false); 
    }
  };

  return (
    <main className="w-full max-w-2xl mx-auto py-4 font-sans selection:bg-amber-400 selection:text-black">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="bg-slate-900/40 backdrop-blur-xl border-white/5 rounded-[3rem] overflow-hidden shadow-2xl relative">
          
          <AnimatePresence>
            {isSuccess && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center space-y-4"
              >
                <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                  <CheckCircle className="text-slate-950" size={40} />
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">
                  {isManual ? "Adjustment Archived" : "Vault Updated"}
                </h3>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">Records securely synced</p>
              </motion.div>
            )}
          </AnimatePresence>

          <CardHeader className="p-8 pb-4">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-white text-2xl font-black tracking-tight uppercase italic">
                  {isManual ? "Manual Adjustment" : "Closing Entry"}
                </CardTitle>
                <CardDescription className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">
                  {isManual 
                    ? "Back-dated correction" 
                    : new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                </CardDescription>
              </div>

              <button 
                type="button"
                onClick={() => setIsManual(!isManual)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                  isManual 
                    ? 'bg-amber-400 text-slate-950 border-amber-400 font-black' 
                    : 'bg-white/5 text-slate-400 border-white/10 font-bold hover:text-white'
                }`}
              >
                {isManual ? <Calendar size={14} /> : <History size={14} />}
                <span className="text-[9px] font-black uppercase tracking-widest">
                  {isManual ? "Switch to Daily" : "Manual Mode"}
                </span>
              </button>
            </div>

            {/* PROPERTY SELECTOR SECTION */}
            <div className="mt-6 space-y-2">
              <label className="text-[9px] font-black text-amber-400 uppercase tracking-[0.3em] px-1 flex items-center gap-2">
                <Building2 size={12} />
                Property Context
              </label>
              <div className="relative">
                <select
                  value={selectedPropertyId}
                  onChange={(e) => setSelectedPropertyId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 appearance-none text-white font-bold focus:border-amber-500 outline-none transition-all pr-12 cursor-pointer text-sm"
                >
                  <option value="" disabled>Select a property...</option>
                  {properties.map(prop => (
                    <option key={prop.id} value={prop.id} className="bg-slate-900">{prop.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={18} />
              </div>
            </div>

            {/* DATE SELECTOR (Only in Manual Mode) */}
            <AnimatePresence>
              {isManual && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 space-y-2 overflow-hidden"
                >
                  <label className="text-[9px] font-black text-rose-400 uppercase tracking-[0.3em] px-1 flex items-center gap-2">
                    <Calendar size={12} />
                    Entry Date
                  </label>
                  <input 
                    type="date"
                    value={values.selectedDate}
                    onChange={(e) => setValues({...values, selectedDate: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white font-bold focus:border-rose-500 outline-none transition-all shadow-inner"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </CardHeader>

          <CardContent className="px-8 space-y-6">
            <div className="h-[1px] w-full bg-white/5" />
            
            <section className="space-y-4">
              <h4 className="text-[9px] font-black text-amber-400 uppercase tracking-[0.3em]">1. Payment Sources</h4>
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
                label="OTA Payouts" 
                icon={Globe}
                value={values.otaPayouts} 
                onChange={(v) => setValues({...values, otaPayouts: v})} 
              />
            </section>

            <section className="space-y-4 p-6 bg-white/5 rounded-[2.5rem] border border-white/5">
              <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">2. Category Allocation</h4>
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
                <p className="text-[8px] font-bold text-rose-400 uppercase text-center italic tracking-wider">
                  Discrepancy: ₹{allocationGap.toLocaleString('en-IN')}
                </p>
              )}
            </section>

            <section>
              <InputField 
                label="Petty Expenses" 
                icon={MinusCircle}
                value={values.pettyExpenses} 
                onChange={(v) => setValues({...values, pettyExpenses: v})} 
                isNegative={true}
              />
            </section>

            <section className="p-8 bg-slate-950 rounded-[2.5rem] border border-white/10 relative overflow-hidden group">
              <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]">
                <span>Gross Collection</span>
                <span className="text-slate-300 font-bold">₹{totalCollection.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center border-t border-white/5 mt-4 pt-4">
                <span className="text-slate-400 text-sm font-bold">In-Hand Cash</span>
                <span className="text-3xl font-black text-white tracking-tighter italic">
                  ₹{netCash.toLocaleString('en-IN')}
                </span>
              </div>
            </section>

            <section className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                <FileText size={12} className="text-slate-500" />
                Shift Notes
              </label>
              <textarea 
                rows={2}
                value={values.notes}
                onChange={(e) => setValues({...values, notes: e.target.value})}
                placeholder="Important highlights or reason for manual adjustment..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 focus:border-amber-500 outline-none text-sm text-white resize-none transition-all placeholder:text-slate-800 font-medium"
              />
            </section>
          </CardContent>

          <CardFooter className="px-8 flex flex-col gap-6 pb-10">
            <button 
              disabled={loading || isSuccess || !selectedPropertyId}
              onClick={handleSubmit}
              className={`w-full font-black py-6 rounded-[2rem] shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 ${
                isManual 
                  ? 'bg-rose-500 text-white shadow-rose-500/20 hover:bg-rose-600' 
                  : 'bg-amber-400 text-slate-950 shadow-amber-400/20 hover:bg-amber-300'
              }`}
            >
              {loading ? (
                <Loader2 className="animate-spin h-6 w-6" />
              ) : (
                <>
                  <Save size={18} strokeWidth={3} />
                  <span className="uppercase tracking-[0.2em] text-[11px]">
                    {isManual ? "Save Manual Record" : "Finalize Day Book"}
                  </span>
                </>
              )}
            </button>

            <div className={`flex items-start gap-4 p-5 rounded-[1.8rem] border ${
              isManual ? 'bg-amber-500/5 border-amber-500/10' : 'bg-rose-500/5 border-rose-500/10'
            }`}>
              <AlertCircle className={`${isManual ? 'text-amber-500' : 'text-rose-500'} w-5 h-5 mt-0.5 flex-shrink-0`} />
              <p className={`text-[9px] font-black leading-relaxed uppercase tracking-wider ${
                isManual ? 'text-amber-500/70' : 'text-rose-500/70'
              }`}>
                {isManual 
                  ? "Audit Note: You are editing historical data. This will trigger a re-calculation of current opening balances."
                  : "Note: Ensure the property context above matches the current physical location to avoid auditing errors."}
              </p>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </main>
  );
}