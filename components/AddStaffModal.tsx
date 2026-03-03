"use client";

import React, { useState } from 'react';
import { X, UserPlus, Loader2, ShieldCheck } from 'lucide-react';
import { createStaffMember } from '@/lib/actions/users';

export function AddStaffModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff' });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await createStaffMember(form);
    if (res.success) {
      alert("Staff added successfully!");
      setForm({ name: '', email: '', password: '', role: 'staff' });
      onClose();
    } else {
      alert(res.error);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-10">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-400 rounded-xl text-slate-950">
              <UserPlus size={20} />
            </div>
            <h3 className="text-white font-bold text-lg">New Staff Member</h3>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
            <input 
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white outline-none focus:border-amber-400 transition-all"
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
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white outline-none focus:border-amber-400 transition-all"
              placeholder="rahul@etherealinn.com"
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
            <input 
              required
              type="password"
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white outline-none focus:border-amber-400 transition-all"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">System Role</label>
            <select 
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white outline-none focus:border-amber-400 transition-all appearance-none"
              value={form.role}
              onChange={e => setForm({...form, role: e.target.value})}
            >
              <option value="staff">Staff (Daily Entries Only)</option>
              <option value="manager">Manager (View Reports)</option>
              <option value="admin">Admin (Full Control)</option>
            </select>
          </div>

          <button 
            disabled={loading}
            className="w-full bg-amber-400 text-slate-950 font-black py-5 rounded-[1.5rem] shadow-xl hover:bg-amber-300 transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-4"
          >
            {loading ? <Loader2 className="animate-spin" /> : <ShieldCheck size={20} />}
            Confirm & Create Access
          </button>
        </form>
      </div>
    </div>
  );
}