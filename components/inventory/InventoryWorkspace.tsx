"use client";

import React, { useState, useTransition, useMemo } from "react";
import { 
  Plus, Layers, Wrench, AlertTriangle, CheckCircle2, 
  ChevronRight, Loader2, Minus, Search, ShieldCheck, Home
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { adjustStockLevel, addInventoryItem } from "@/lib/actions/inventory";
import { useRouter } from "next/navigation";

interface PropertyLookup {
  id: string;
  name: string;
}

interface InventoryWorkspaceProps {
  initialItems: any[];
  alerts: { lowStock: any[]; overdueService: any[] };
  categories: any[];
  propertiesList: PropertyLookup[]; // 🌟 Received cleanly from parent server frame context
  propertyId: string;
  isMasterAdmin: boolean;
}

export function InventoryWorkspace({ 
  initialItems, 
  alerts, 
  categories, 
  propertiesList, 
  propertyId, 
  isMasterAdmin 
}: InventoryWorkspaceProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"all" | "consumable" | "fixed_asset">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isAddOpen, setIsAddOpen] = useState(false);

  // 🌟 THE FIX: Dynamic Target Property Assignment Hook state tracking context
  const [targetPropertyId, setTargetPropertyId] = useState<string>(propertyId || "");

  // Form State Layout
  const [newItem, setNewItem] = useState({
    name: "", categoryId: "", itemType: "consumable", sku: "",
    currentStock: "0", minRequiredStock: "5", unitOfMeasurement: "pcs",
    serialNumber: "", locationInProperty: "", nextServiceDate: ""
  });

  // Client-side quick-filtering
  const filteredItems = useMemo(() => {
    return initialItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesTab = activeTab === "all" || item.itemType === activeTab;
      const matchesCategory = selectedCategory === "all" || Number(item.categoryId) === Number(selectedCategory);
      return matchesSearch && matchesTab && matchesCategory;
    });
  }, [initialItems, searchQuery, activeTab, selectedCategory]);

  const handleStockDelta = (itemId: string, currentAmount: number, delta: number) => {
    if (currentAmount + delta < 0) return;
    startTransition(async () => {
      const res = await adjustStockLevel(propertyId, itemId, delta);
      if (res.success) router.refresh();
      else alert(res.error);
    });
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();

    // Structural constraint lookup validation pass
    if (!targetPropertyId || targetPropertyId === "global" || targetPropertyId.trim() === "") {
      alert("Validation Rejection: An explicit Property Context anchor must be chosen before asset deployment.");
      return;
    }

    startTransition(async () => {
      // 🌟 THE FIX: Route deployment payload directly using selected target property context bounds
      const res = await addInventoryItem(targetPropertyId, newItem);
      if (res.success) {
        setIsAddOpen(false);
        setNewItem({
          name: "", categoryId: "", itemType: "consumable", sku: "",
          currentStock: "0", minRequiredStock: "5", unitOfMeasurement: "pcs",
          serialNumber: "", locationInProperty: "", nextServiceDate: ""
        });
        router.refresh();
      } else {
        alert(res.error);
      }
    });
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6 text-left">
        <div>
          <span className="text-[10px] tracking-[0.5em] uppercase text-[#c5a059] font-black block mb-1">Ethereal Vault</span>
          <h1 className="text-3xl md:text-4xl font-serif font-bold italic text-white">Inventory Framework</h1>
        </div>
        <button
          onClick={() => {
            // Re-initialize tracking target properties scope dynamically upon modal state trigger opens
            setTargetPropertyId(propertyId || "");
            setIsAddOpen(true);
          }}
          className="bg-[#c5a059] hover:bg-[#b08e4b] text-black font-black text-[10px] uppercase tracking-widest px-6 py-4 rounded-xl flex items-center gap-2 transition-all shadow-xl shadow-[#c5a059]/10 active:scale-[0.98] cursor-pointer"
        >
          <Plus size={14} strokeWidth={3} /> Register Asset Node
        </button>
      </div>

      {/* METRICS & OVERALL HEALTH CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-3xl backdrop-blur-sm flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Total Tracked Items</p>
            <h3 className="text-3xl font-serif font-black text-white mt-1">{initialItems.length}</h3>
          </div>
          <div className="p-4 bg-white/5 rounded-2xl text-slate-400"><Layers size={22} /></div>
        </div>

        <div className={`bg-zinc-900/40 border p-6 rounded-3xl backdrop-blur-sm flex items-center justify-between transition-colors ${alerts.lowStock.length > 0 ? 'border-amber-500/20 bg-amber-500/5' : 'border-white/5'}`}>
          <div>
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">Low Stock Indicators</p>
            <h3 className={`text-3xl font-serif font-black mt-1 ${alerts.lowStock.length > 0 ? 'text-amber-400 animate-pulse' : 'text-white'}`}>
              {alerts.lowStock.length}
            </h3>
          </div>
          <div className={`p-4 rounded-2xl ${alerts.lowStock.length > 0 ? 'bg-amber-400/10 text-amber-400' : 'bg-white/5 text-slate-400'}`}><AlertTriangle size={22} /></div>
        </div>

        <div className={`bg-zinc-900/40 border p-6 rounded-3xl backdrop-blur-sm flex items-center justify-between transition-colors ${alerts.overdueService.length > 0 ? 'border-red-500/20 bg-red-500/5' : 'border-white/5'}`}>
          <div>
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">Fixed Asset Compliance Expirations</p>
            <h3 className={`text-3xl font-serif font-black mt-1 ${alerts.overdueService.length > 0 ? 'text-red-400' : 'text-white'}`}>
              {alerts.overdueService.length}
            </h3>
          </div>
          <div className={`p-4 rounded-2xl ${alerts.overdueService.length > 0 ? 'bg-red-400/10 text-red-400' : 'bg-white/5 text-slate-400'}`}><Wrench size={22} /></div>
        </div>
      </div>

      {/* FILTER SEARCH WORKSPACE TOOLBAR */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-zinc-900/20 p-4 border border-white/5 rounded-2xl">
        <div className="flex bg-black/40 border border-white/10 rounded-xl p-1 w-full md:w-auto">
          {(["all", "consumable", "fixed_asset"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${activeTab === tab ? 'bg-[#c5a059] text-black shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              {tab.replace("_", " ")}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
            <input 
              type="text" 
              placeholder="Query Name or SKU..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/10 focus:border-[#c5a059] text-white rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold outline-none transition-all font-sans"
            />
          </div>

          <div className="relative w-full sm:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-black/40 border border-white/10 focus:border-[#c5a059] text-white rounded-xl pl-4 pr-10 py-2.5 text-xs font-bold outline-none transition-all cursor-pointer appearance-none font-sans"
            >
              <option value="all">All Category Modules</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-zinc-950">{cat.name}</option>
              ))}
            </select>
            <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* PRIMARY DATA TABLE REGISTRY LIST */}
      <div className="bg-zinc-900/10 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02] text-slate-500 text-[9px] font-black uppercase tracking-widest">
                <th className="p-6">Asset Specification</th>
                <th className="p-6">Category Module</th>
                <th className="p-6">Stock Status Metric</th>
                <th className="p-6 text-center">Operational Counter Metrics</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs font-medium">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-16 text-center text-slate-600 font-black tracking-widest uppercase">
                    No active assets registered matching target constraints.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isLow = item.itemType === "consumable" && item.currentStock <= item.minRequiredStock;
                  return (
                    <motion.tr layout key={item.id} className="hover:bg-white/[0.01] transition-all">
                      <td className="p-6 text-left">
                        <div className="font-bold text-white text-sm">{item.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-1 tracking-wider uppercase">
                          {item.sku || "NO SKU ALLOCATED"} {item.locationInProperty && `• Loc: ${item.locationInProperty}`}
                        </div>
                      </td>
                      <td className="p-6 text-left">
                        <span className="text-[10px] font-bold text-slate-400 bg-white/5 px-3 py-1 rounded-md border border-white/5">
                          {item.category?.name || "Uncategorized"}
                        </span>
                      </td>
                      <td className="p-6 text-left">
                        {item.itemType === "consumable" ? (
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-black ${isLow ? 'text-amber-400' : 'text-emerald-400'}`}>
                              {item.currentStock} / {item.minRequiredStock}
                            </span>
                            <span className="text-[10px] text-slate-500 uppercase font-black">{item.unitOfMeasurement}</span>
                          </div>
                        ) : (
                          <div className="text-[10px] font-black uppercase">
                            {item.nextServiceDate ? (
                              <span className={new Date(item.nextServiceDate) <= new Date() ? 'text-red-400 animate-pulse' : 'text-slate-400'}>
                                Next Inspection: {item.nextServiceDate}
                              </span>
                            ) : (
                              <span className="text-slate-600">No Service Deadline Logged</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-6">
                        {item.itemType === "consumable" ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleStockDelta(item.id, item.currentStock, -1)}
                              disabled={isPending || item.currentStock <= 0}
                              className="p-2 bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-white/5 rounded-lg transition-colors cursor-pointer disabled:opacity-30"
                            >
                              <Minus size={12} strokeWidth={3} />
                            </button>
                            <button
                              onClick={() => handleStockDelta(item.id, item.currentStock, 1)}
                              disabled={isPending}
                              className="p-2 bg-white/5 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 border border-white/5 rounded-lg transition-colors cursor-pointer"
                            >
                              <Plus size={12} strokeWidth={3} />
                            </button>
                          </div>
                        ) : (
                          <div className="text-center text-slate-500 font-mono text-[10px]">
                            SN: {item.serialNumber || "N/A"}
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- SLIDE PANEL OVERLAY WRAPPER: RECORD NEW ASSET --- */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-[1000] flex justify-end bg-black/80 backdrop-blur-sm p-0 md:p-4">
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 220 }}
              className="w-full max-w-lg bg-[#0c0c0e] h-full border-l border-white/5 p-8 overflow-y-auto flex flex-col justify-between text-left"
            >
              <div>
                <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-6">
                  <div>
                    <h3 className="text-white font-serif text-xl font-bold italic">Initialize Inventory Node</h3>
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">Asset Registration Registry</p>
                  </div>
                  <button onClick={() => setIsAddOpen(false)} className="p-2 text-slate-500 hover:text-white transition-colors cursor-pointer"><X size={20} /></button>
                </div>

                <form onSubmit={handleAddItem} className="space-y-4 font-sans">
                  
                  {/* =========================================================================
                      🌟 THE FIX: MULTI-PROPERTY SELECTOR COMPONENT SWITCH
                      Reveals choice menu dynamically IF Master Admin OR Tenant has portfolio access layers.
                     ========================================================================= */}
                  <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 text-[#c5a059]">
                      <Home size={13} />
                      <span className="text-[9px] font-black uppercase tracking-widest">Target Destination Context</span>
                    </div>

                    {isMasterAdmin || propertiesList.length > 1 ? (
                      <div className="relative animate-in fade-in duration-200">
                        <select
                          required
                          value={targetPropertyId}
                          onChange={(e) => setTargetPropertyId(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 focus:border-[#c5a059] text-white rounded-xl pl-4 pr-10 py-3.5 text-xs font-bold outline-none transition-all cursor-pointer appearance-none"
                        >
                          <option value="">Select Target Destination Property...</option>
                          {propertiesList.map((prop) => (
                            <option key={prop.id} value={prop.id} className="bg-zinc-950">{prop.name}</option>
                          ))}
                        </select>
                        <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-500 pointer-events-none" />
                      </div>
                    ) : (
                      <div className="text-xs font-bold text-slate-400 pl-1 py-1 flex items-center gap-2 animate-in fade-in duration-200">
                        <CheckCircle2 size={12} className="text-emerald-500" />
                        Locked directly to your active property workspace context terminal.
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Item Name</label>
                    <input required type="text" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} placeholder="e.g. ABC Dry Powder Fire Extinguisher 6Kg" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-xs font-bold text-white outline-none focus:border-[#c5a059]" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Item Nature Module</label>
                      <div className="relative">
                        <select value={newItem.itemType} onChange={e => setNewItem({...newItem, itemType: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-10 py-3.5 text-xs font-bold text-white outline-none focus:border-[#c5a059] cursor-pointer appearance-none">
                          <option value="consumable" className="bg-zinc-950">Consumable Stock</option>
                          <option value="fixed_asset" className="bg-zinc-950">Fixed Structural Asset</option>
                        </select>
                        <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-500 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Master Category Group</label>
                      <div className="relative">
                        <select required value={newItem.categoryId} onChange={e => setNewItem({...newItem, categoryId: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-10 py-3.5 text-xs font-bold text-white outline-none focus:border-[#c5a059] cursor-pointer appearance-none">
                          <option value="" className="bg-zinc-950">Select Group</option>
                          {categories.map(cat => <option key={cat.id} value={cat.id} className="bg-zinc-950">{cat.name}</option>)}
                        </select>
                        <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-500 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {newItem.itemType === "consumable" ? (
                    <div className="grid grid-cols-3 gap-4 animate-in fade-in duration-200">
                      <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Initial Count</label>
                        <input type="number" value={newItem.currentStock} onChange={e => setNewItem({...newItem, currentStock: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-xs font-bold text-white outline-none" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Min Reorder</label>
                        <input type="number" value={newItem.minRequiredStock} onChange={e => setNewItem({...newItem, minRequiredStock: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-xs font-bold text-white outline-none" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Measurement Unit</label>
                        <input type="text" value={newItem.unitOfMeasurement} onChange={e => setNewItem({...newItem, unitOfMeasurement: e.target.value})} placeholder="pcs, boxes" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-xs font-bold text-white outline-none" />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Serial Number / Asset Tag</label>
                          <input type="text" value={newItem.serialNumber} onChange={e => setNewItem({...newItem, serialNumber: e.target.value})} placeholder="e.g. FE-2026-991" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-xs font-bold text-white outline-none" />
                        </div>
                        <div>
                          <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Next Inspection Date</label>
                          <input type="date" value={newItem.nextServiceDate} onChange={e => setNewItem({...newItem, nextServiceDate: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-xs font-bold text-white outline-none text-slate-400" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Exact Placement Location</label>
                        <input type="text" value={newItem.locationInProperty} onChange={e => setNewItem({...newItem, locationInProperty: e.target.value})} placeholder="e.g. Ground Floor Generator Room" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-xs font-bold text-white outline-none" />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-[#c5a059] text-black font-black text-[10px] uppercase tracking-widest py-4 rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 mt-6 cursor-pointer"
                  >
                    {isPending ? <Loader2 className="animate-spin text-black" size={16} /> : <><ShieldCheck size={16} /> Deploy Asset Into Cluster</>}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function X({ size }: { size: number }) { return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>; }