"use client";

import React, { useState } from 'react';
import { X, UserPlus, Loader2, ShieldCheck } from 'lucide-react';
import { createStaffMember } from '@/lib/actions/users';

interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string; // 🌟 ADDED: Secure contextual multi-tenant identifier prop
}

export function AddStaffModal({ isOpen, onClose, propertyId }: AddStaffModalProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff' });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Safety check to completely block orphan creation passes
    if (!propertyId || propertyId === "global" || propertyId === "undefined") {
      alert("Security Error: An active Property context must be provided to bind this staff account.");
      return;
    }

    setLoading(true);
    try {
      // 🌟 THE FIX: Spread the form input data and append the tenant's propertyId into the payload
      const res = await createStaffMember({
        ...form,
        propertyId: propertyId 
      });

      if (res.success) {
        alert("Staff member profile deployed successfully!");
        setForm({ name: '', email: '', password: '', role: 'staff' });
        onClose();
      } else {
        alert(res.error || "Failed to initialize staff credentials.");
      }
    } catch (error) {
      console.error("Staff Creation Error:", error);
      alert("An internal connection error disrupted user data syncing.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-10">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-400 rounded-xl text-slate-950">
              <UserPlus size={20} />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg leading-none">New Staff Member</h3>
              <p className="text-[8px] text-amber-500/50 uppercase tracking-widest mt-1.5">Context: #{propertyId.slice(0, 8)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors cursor-pointer">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
            <input 
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white outline-none focus:border-amber-400 transition-all text-sm font-medium"
              placeholder="e.g. Rahul Sharma"
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
            <input 
              required
              type="email"
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white outline-none focus:border-amber-400 transition-all text-sm font-medium"
              placeholder="rahul@ethereal.inn"
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
            <input 
              required
              type="password"
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white outline-none focus:border-amber-400 transition-all text-sm font-medium"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">System Role</label>
            <div className="relative">
              <select 
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white outline-none focus:border-amber-400 transition-all appearance-none text-sm font-bold cursor-pointer"
                value={form.role}
                onChange={e => setForm({...form, role: e.target.value})}
              >
                <option value="staff" className="bg-slate-950">Staff (Daily Entries Only)</option>
                <option value="manager" className="bg-slate-950">Manager (View Reports)</option>
                <option value="admin" className="bg-slate-950">Admin (Full Control)</option>
              </select>
            </div>
          </div>

          <button 
            disabled={loading}
            className="w-full bg-amber-400 text-slate-950 font-black py-5 rounded-[1.5rem] shadow-xl hover:bg-amber-300 transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-4 cursor-pointer active:scale-[0.98]"
          >
            {loading ? <Loader2 className="animate-spin text-slate-950 h-5 w-5" /> : <ShieldCheck size={20} strokeWidth={2.5} />}
            Confirm & Create Access
          </button>
        </form>
      </div>
    </div>
  );
}