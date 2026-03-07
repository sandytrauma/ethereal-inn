"use client";

import React, { useState, useMemo } from 'react';
import { 
  Shield, Users, Database, LogOut, 
  UserPlus, Trash2, UserCog, RefreshCcw, 
  ChevronRight, X, ShieldCheck, Loader2, Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- ACTIONS ---
import { updateUserRole, removeStaff, exportFinancialData } from '@/lib/actions/settings';
import { createStaffMember, updateStaffProfile } from '@/lib/actions/users';
import { logout } from '@/lib/actions/auth';

// --- TYPES ---
interface User {
  id: string | number;
  name: string;
  role: string;
  email?: string;
}

interface StaffMember {
  id: string | number;
  name: string;
  role: string;
  email?: string;
}

interface SettingsTabProps {
  user: User;
  allStaff: StaffMember[];
  onNameChange: (newName: string) => void;
}

export function SettingsTab({ user, allStaff: initialStaff }: SettingsTabProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [localStaff, setLocalStaff] = useState<StaffMember[]>(initialStaff || []);

  // Robust Role Check
  const isAdmin = useMemo(() => user.role?.toLowerCase().trim() === 'admin', [user.role]);

  // Admins see everyone, Staff see only their own card
  const visibleStaff = useMemo(() => {
    if (isAdmin) return localStaff;
    return localStaff.filter(s => Number(s.id) === Number(user.id));
  }, [localStaff, isAdmin, user.id]);

  // --- HANDLERS ---
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await exportFinancialData();
      if (res?.data) {
        const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ethereal-inn-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      alert("Export failed.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleRoleUpdate = async (staffId: string | number, currentRole: string) => {
    if (!isAdmin) return;
    const newRole = currentRole.trim() === 'admin' ? 'staff' : 'admin';
    const res = await updateUserRole(Number(staffId), newRole);
    if (res.success) {
      setLocalStaff(prev => prev.map(s => s.id === staffId ? { ...s, role: newRole } : s));
    }
  };

  const handleRemoveStaff = async (staffId: string | number, name: string) => {
    if (!isAdmin) return;
    if (!confirm(`Permanently revoke access for ${name}?`)) return;
    const res = await removeStaff(Number(staffId));
    if (res.success) {
      setLocalStaff(prev => prev.filter(s => s.id !== staffId));
    }
  };

  return (
    <div className="space-y-10 pb-32 font-sans max-w-2xl mx-auto px-4">
      {/* SECTION: USER PROFILE CARD */}
      <section className="bg-slate-900/40 p-8 rounded-[3rem] border border-white/5 text-center shadow-2xl backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-400/20 to-transparent" />
        <div className="w-24 h-24 bg-gradient-to-tr from-amber-400 to-orange-500 rounded-[2rem] mx-auto flex items-center justify-center text-slate-950 text-4xl font-black mb-6 shadow-2xl shadow-amber-400/20 uppercase">
          {user.name?.[0] || 'U'}
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight">{user.name}</h2>
        <div className="flex flex-col items-center gap-3 mt-4">
          <span className="text-[10px] text-amber-400 font-black uppercase tracking-[0.3em] bg-amber-400/10 px-4 py-1.5 rounded-full border border-amber-400/20">
            {user.role?.trim()} Identity
          </span>
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-white transition-colors uppercase tracking-widest"
          >
            <Edit3 size={12} /> Edit Profile
          </button>
        </div>
      </section>

      {/* SECTION: STAFF MANAGEMENT */}
      <section className="space-y-6">
        <div className="flex justify-between items-end px-4">
          <div>
            <h3 className="text-white text-lg font-black tracking-tight">{isAdmin ? "Staff Control" : "Account Identity"}</h3>
            <p className="text-[9px] text-slate-500 uppercase font-black tracking-[0.2em] mt-1">
              {isAdmin ? "Personnel & Access Keys" : "Verified Credentials"}
            </p>
          </div>
          {isAdmin && (
            <button 
              onClick={() => setIsAddModalOpen(true)} 
              className="p-4 bg-amber-400 text-slate-950 rounded-2xl hover:bg-amber-300 active:scale-95 transition-all shadow-xl shadow-amber-400/20"
            >
              <UserPlus size={24} strokeWidth={2.5} />
            </button>
          )}
        </div>

        <div className="space-y-3">
          {visibleStaff.map((staff) => (
            <motion.div layout key={staff.id} className="flex items-center justify-between p-5 bg-slate-900/60 rounded-[2.5rem] border border-white/5 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-sm font-black text-slate-400 uppercase">
                  {staff.name?.[0]}
                </div>
                <div>
                  <p className="text-sm font-black text-white">
                    {staff.name} {Number(staff.id) === Number(user.id) && <span className="text-amber-400/50 ml-1 text-[10px]">(You)</span>}
                  </p>
                  <p className="text-[9px] text-amber-400/60 uppercase font-black tracking-widest mt-0.5">{staff.role?.trim()}</p>
                </div>
              </div>
              
              {isAdmin ? (
                <div className="flex gap-1">
                  <button 
                    onClick={() => handleRoleUpdate(staff.id, staff.role)} 
                    title="Toggle Admin/Staff"
                    className="p-3 text-slate-500 hover:text-amber-400 hover:bg-amber-400/10 rounded-xl transition-all"
                  >
                    <UserCog size={18} />
                  </button>
                  {Number(staff.id) !== Number(user.id) && (
                    <button 
                      onClick={() => handleRemoveStaff(staff.id, staff.name)} 
                      className="p-3 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-3 text-emerald-500"><ShieldCheck size={20} /></div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* SECTION: SYSTEM CONTROLS */}
      <section className="space-y-4 px-2">
        <h3 className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] ml-4">System Core</h3>
        <div className="grid grid-cols-1 gap-4">
          {isAdmin && <SettingsAction icon={Database} title="Export Ledger" desc="Backup of all financial history" loading={isExporting} onClick={handleExport} />}
          <SettingsAction icon={RefreshCcw} title="Cloud Sync" desc="Force refresh local cache" onClick={() => window.location.reload()} />
          <SettingsAction icon={LogOut} title="Terminate Session" desc="Sign out of Ethereal Cloud" danger onClick={() => logout()} />
        </div>
      </section>

      {/* MODAL OVERLAYS */}
      <AnimatePresence>
        {isAddModalOpen && <AddStaffModal onClose={() => setIsAddModalOpen(false)} />}
        
        {isEditModalOpen && (
          <EditProfileModal 
            user={user} 
            onClose={() => setIsEditModalOpen(false)} 
            onSuccess={() => window.location.reload()}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// --- MODAL: ADD STAFF ---
function AddStaffModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await createStaffMember(form);
    if (res.success) {
      window.location.reload();
    } else {
      alert(res.error || "Registration failed.");
    }
    setLoading(false);
  };

  return (
    <ModalWrapper title="New Identity" subtitle="Registering Staff Member" onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-8 space-y-5">
        <Input label="Display Name" placeholder="e.g. Rahul Sharma" value={form.name} onChange={(v) => setForm({...form, name: v})} />
        <Input label="Email Address" type="email" placeholder="rahul@ethereal.inn" value={form.email} onChange={(v) => setForm({...form, email: v})} />
        <Input label="Access Key" type="password" placeholder="Min. 6 characters" value={form.password} onChange={(v) => setForm({...form, password: v})} />
        
        <div className="space-y-2 pb-4">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Authority Level</label>
          <div className="relative">
            <select 
              className="w-full bg-slate-900/50 border border-white/5 rounded-[1.5rem] p-5 text-white outline-none appearance-none text-sm font-bold focus:border-amber-400/50 transition-all"
              value={form.role} 
              onChange={e => setForm({...form, role: e.target.value})}
            >
              <option value="staff">Standard Staff</option>
              <option value="manager">Manager</option>
              <option value="admin">System Admin</option>
            </select>
            <ChevronRight size={16} className="absolute right-5 top-1/2 -translate-y-1/2 rotate-90 text-slate-600 pointer-events-none" />
          </div>
        </div>
        
        <SubmitButton loading={loading} text="INITIALIZE ACCOUNT" />
      </form>
    </ModalWrapper>
  );
}

// --- MODAL: EDIT PROFILE ---
function EditProfileModal({ user, onClose, onSuccess }: { user: User, onClose: () => void, onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: user.name, password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await updateStaffProfile(Number(user.id), form);
    if (res.success) {
      onSuccess();
    } else {
      alert(res.error || "Update failed.");
    }
    setLoading(false);
  };

  return (
    <ModalWrapper title="Update Profile" subtitle="Modify your credentials" onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-8 space-y-5">
        <Input label="Display Name" value={form.name} onChange={(v) => setForm({...form, name: v})} />
        <Input label="New Password" type="password" placeholder="Leave blank to keep current" value={form.password} onChange={(v) => setForm({...form, password: v})} />
        <p className="text-[9px] text-slate-500 px-2 italic text-center leading-relaxed">Identity changes require a system refresh to take effect.</p>
        <SubmitButton loading={loading} text="UPDATE CREDENTIALS" />
      </form>
    </ModalWrapper>
  );
}

// --- HELPER UI COMPONENTS ---

function ModalWrapper({ children, title, subtitle, onClose }: { children: React.ReactNode; title: string; subtitle: string; onClose: () => void; }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl">
      <motion.div initial={{ y: 100, scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: 100, scale: 0.95 }} className="w-full max-w-md bg-[#020617] border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
          <div>
            <h3 className="text-white font-black text-xl tracking-tight">{title}</h3>
            <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mt-1">{subtitle}</p>
          </div>
          <button onClick={onClose} className="p-3 text-slate-500 hover:text-white bg-white/5 rounded-2xl transition-all"><X size={24} /></button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

function Input({ label, type = "text", placeholder, value, onChange }: { label: string; type?: string; placeholder?: string; value: string; onChange: (v: string) => void; }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">{label}</label>
      <input 
        type={type} 
        required={type !== "password"} 
        className="w-full bg-slate-900/50 border border-white/5 rounded-[1.5rem] p-5 text-white outline-none focus:border-amber-400/50 transition-all text-sm font-medium" 
        placeholder={placeholder} 
        value={value} 
        onChange={e => onChange(e.target.value)} 
      />
    </div>
  );
}

function SubmitButton({ loading, text }: { loading: boolean; text: string; }) {
  return (
    <button 
      disabled={loading} 
      className="w-full bg-amber-400 text-slate-950 font-black py-6 rounded-[2rem] hover:bg-amber-300 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg shadow-amber-400/10"
    >
      {loading ? <Loader2 className="animate-spin" /> : <ShieldCheck size={20} strokeWidth={3} />}
      {text}
    </button>
  );
}

function SettingsAction({ icon: Icon, title, desc, onClick, danger, loading }: { icon: any; title: string; desc: string; onClick: () => void; danger?: boolean; loading?: boolean; }) {
  return (
    <button 
      onClick={onClick} 
      disabled={loading} 
      className={`w-full flex items-center justify-between p-6 rounded-[2.5rem] border transition-all active:scale-[0.98] group ${danger ? 'bg-rose-500/5 border-rose-500/10 hover:bg-rose-500/10' : 'bg-slate-900/40 border-white/5 hover:bg-slate-800/60'}`}
    >
      <div className="flex items-center gap-5 text-left">
        <div className={`p-4 rounded-2xl transition-all ${danger ? 'text-rose-500 bg-rose-500/10' : 'text-amber-400 bg-amber-400/10 group-hover:scale-110'}`}>
          <Icon size={22} className={loading ? 'animate-spin' : ''} />
        </div>
        <div>
          <p className={`text-sm font-black tracking-tight ${danger ? 'text-rose-500' : 'text-white'}`}>{title}</p>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{desc}</p>
        </div>
      </div>
      <ChevronRight size={18} className="text-slate-800 group-hover:text-slate-400 transition-colors" />
    </button>
  );
}