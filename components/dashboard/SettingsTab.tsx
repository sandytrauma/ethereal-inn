"use client";

import React, { useState } from 'react';
import { 
  Shield, Users, Database, Key, LogOut, 
  UserPlus, Trash2, UserCog, Download, RefreshCcw, 
  ChevronRight, X, ShieldCheck, Loader2
} from 'lucide-react';
import { updateUserRole, removeStaff, exportFinancialData } from '@/lib/actions/settings';
import { createStaffMember } from '@/lib/actions/users';
import { logout } from '@/lib/actions/auth';
import { motion, AnimatePresence } from 'framer-motion';

export function SettingsTab({ user, allStaff }: { user: any, allStaff: any[] }) {
  const [isExporting, setIsExporting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await exportFinancialData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ethereal-inn-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } catch (error) {
      alert("Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-10 pb-20">
      {/* SECTION: USER PROFILE */}
      <section className="bg-slate-900/40 p-6 rounded-[2.5rem] border border-white/5 text-center shadow-xl">
        <div className="w-20 h-20 bg-amber-400 rounded-3xl mx-auto flex items-center justify-center text-slate-950 text-3xl font-black mb-4 shadow-lg shadow-amber-400/20">
          {user.name[0]}
        </div>
        <h2 className="text-xl font-black text-white">{user.name}</h2>
        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
          {user.role} Account • Verified
        </p>
      </section>

      {/* SECTION: STAFF MANAGEMENT (ADMIN ONLY) */}
      {user.role === 'admin' && (
        <section className="space-y-4">
          <div className="flex justify-between items-end px-4">
            <div>
              <h3 className="text-white font-bold">Staff Control</h3>
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Manage Access & Roles</p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="p-3 bg-amber-400 text-slate-950 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-amber-400/10"
            >
              <UserPlus size={20} />
            </button>
          </div>

          <div className="space-y-2">
            {allStaff.map((staff) => (
              <div key={staff.id} className="flex items-center justify-between p-4 bg-slate-900/60 rounded-[1.5rem] border border-slate-800/50 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-xs font-bold text-slate-400">
                    {staff.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{staff.name}</p>
                    <p className="text-[10px] text-amber-400/60 uppercase font-black tracking-tighter">{staff.role}</p>
                  </div>
                </div>
                
                <div className="flex gap-1">
                  <button 
                    title="Change Role"
                    onClick={() => updateUserRole(staff.id, staff.role === 'admin' ? 'staff' : 'admin')}
                    className="p-2 text-slate-500 hover:text-amber-400 hover:bg-amber-400/5 rounded-lg transition-colors"
                  >
                    <UserCog size={16} />
                  </button>
                  {staff.id !== user.id && (
                    <button 
                      title="Remove Staff"
                      onClick={() => {
                        if(confirm(`Remove ${staff.name} from system?`)) removeStaff(staff.id)
                      }}
                      className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-500/5 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION: SYSTEM CONTROLS */}
      <section className="space-y-4 px-2">
        <h3 className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-2">System Operations</h3>
        <div className="grid grid-cols-1 gap-3">
          <SettingsAction 
            icon={Database} 
            title="Export Ledger" 
            desc="Download all financial data (JSON)" 
            loading={isExporting}
            onClick={handleExport}
          />
          <SettingsAction 
            icon={RefreshCcw} 
            title="Force Sync" 
            desc="Refresh dashboard & clear cache" 
            onClick={() => window.location.reload()}
          />
          <SettingsAction 
            icon={LogOut} 
            title="Terminate Session" 
            desc="Sign out of Ethereal Inn" 
            danger 
            onClick={() => logout()}
          />
        </div>
      </section>

      {/* MODAL: ADD STAFF */}
      <AnimatePresence>
        {isModalOpen && (
          <AddStaffModal onClose={() => setIsModalOpen(false)} />
        )}
      </AnimatePresence>

      <footer className="text-center opacity-20 py-10">
        <p className="text-[10px] font-black uppercase tracking-[0.5em]">Ethereal Inn • Cloud Edition</p>
      </footer>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function AddStaffModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await createStaffMember(form);
    if (res.success) {
      onClose();
    } else {
      alert(res.error);
    }
    setLoading(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md"
    >
      <motion.div 
        initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
        className="w-full max-w-md bg-[#020617] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900/20">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <UserPlus size={20} className="text-amber-400" /> Add New Staff
          </h3>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Name</label>
            <input required className="w-full bg-slate-900 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-amber-400/50"
              placeholder="Full Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email</label>
            <input required type="email" className="w-full bg-slate-900 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-amber-400/50"
              placeholder="Email Address" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
            <input required type="password" className="w-full bg-slate-900 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-amber-400/50"
              placeholder="Minimum 6 chars" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
          </div>
          <div className="space-y-1 pb-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Role</label>
            <select className="w-full bg-slate-900 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-amber-400/50 appearance-none"
              value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
              <option value="staff">Staff</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button disabled={loading} className="w-full bg-amber-400 text-slate-950 font-black py-5 rounded-[1.5rem] hover:bg-amber-300 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin" /> : <ShieldCheck size={20} />}
            Create Staff Account
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

function SettingsAction({ icon: Icon, title, desc, onClick, danger, loading }: any) {
  return (
    <button 
      onClick={onClick}
      disabled={loading}
      className={`w-full flex items-center justify-between p-5 rounded-[2rem] border transition-all active:scale-[0.98] ${
        danger 
        ? 'bg-rose-500/5 border-rose-500/10 hover:bg-rose-500/10' 
        : 'bg-slate-900/40 border-slate-800/50 hover:bg-slate-800/60'
      }`}
    >
      <div className="flex items-center gap-4 text-left">
        <div className={`p-3 rounded-2xl ${danger ? 'text-rose-500 bg-rose-500/10' : 'text-amber-400 bg-amber-400/10'}`}>
          <Icon size={20} className={loading ? 'animate-spin' : ''} />
        </div>
        <div>
          <p className={`text-sm font-bold ${danger ? 'text-rose-500' : 'text-white'}`}>{title}</p>
          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter">{desc}</p>
        </div>
      </div>
      <ChevronRight size={16} className="text-slate-700" />
    </button>
  );
}