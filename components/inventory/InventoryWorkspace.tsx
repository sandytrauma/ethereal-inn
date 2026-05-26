"use client";

import React, { useState, useTransition, useMemo } from "react";
import { 
  Plus, Layers, Wrench, AlertTriangle, CheckCircle2, 
  ChevronRight, Loader2, Minus, Search, ShieldCheck, Home
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { adjustStockLevel, addInventoryItem, issueInventoryItem } from "@/lib/actions/inventory";
import { useRouter } from "next/navigation";

interface PropertyLookup {
  id: string;
  name: string;
}

interface InventoryWorkspaceProps {
  initialItems: any[];
  alerts: { lowStock: any[]; overdueService: any[] };
  categories: any[];
  propertiesList: PropertyLookup[]; 
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
  
  // 🌟 Lifecycle Availability Filters and Operational Modal Hooks
  const [stockFilter, setStockFilter] = useState<"all" | "instock" | "lowstock" | "outstock">("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isIssueOpen, setIsIssueOpen] = useState(false);
  const [selectedItemToIssue, setSelectedItemToIssue] = useState<any>(null);
  const [issueForm, setIssueForm] = useState({ quantity: "1", allocatedTo: "", notes: "" });

  // Multi-tenant selection context routing setup
  const [targetPropertyId, setTargetPropertyId] = useState<string>(propertyId || "");

  // Initial Form Field Allocation State Mapper
  const [newItem, setNewItem] = useState({
    name: "", categoryId: "", itemType: "consumable", sku: "",
    currentStock: "0", minRequiredStock: "5", unitOfMeasurement: "pcs",
    serialNumber: "", locationInProperty: "", nextServiceDate: ""
  });

  // Reactive multi-property matrix sorting engine
  const filteredItems = useMemo(() => {
    return initialItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesTab = activeTab === "all" || item.itemType === activeTab;
      const matchesCategory = selectedCategory === "all" || Number(item.categoryId) === Number(selectedCategory);
      
      const matchesStockState = 
        stockFilter === "all" ||
        (stockFilter === "outstock" && (item.currentStock === 0 || (item.itemType === "fixed_asset" && item.nextServiceDate && new Date(item.nextServiceDate) <= new Date()))) ||
        (stockFilter === "lowstock" && item.itemType === "consumable" && item.currentStock > 0 && item.currentStock <= item.minRequiredStock) ||
        (stockFilter === "instock" && (item.itemType === "consumable" ? item.currentStock > item.minRequiredStock : item.status === "active"));

      return matchesSearch && matchesTab && matchesCategory && matchesStockState;
    });
  }, [initialItems, searchQuery, activeTab, selectedCategory, stockFilter]);

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

    if (!targetPropertyId || targetPropertyId === "global" || targetPropertyId.trim() === "") {
      alert("Validation Rejection: An explicit Property Context anchor must be chosen before asset deployment.");
      return;
    }

    startTransition(async () => {
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

  const handleIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await issueInventoryItem(selectedItemToIssue.propertyId, {
        itemId: selectedItemToIssue.id,
        quantity: Number(issueForm.quantity),
        allocatedTo: issueForm.allocatedTo,
        notes: issueForm.notes
      });
      if (res.success) {
        setIsIssueOpen(false);
        setSelectedItemToIssue(null);
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
          <h1 className="text-3xl md:text-4xl font-serif font-bold italic text-white">Inventory Management</h1>
        </div>
        <button
          onClick={() => {
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
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-center bg-zinc-900/20 p-4 border border-white/5 rounded-2xl">
        <div className="flex bg-black/40 border border-white/10 rounded-xl p-1 w-full xl:w-auto overflow-x-auto scrollbar-none">
          {(["all", "consumable", "fixed_asset"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer whitespace-nowrap ${activeTab === tab ? 'bg-[#c5a059] text-black shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              {tab.replace("_", " ")}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto items-center">
          <div className="relative w-full sm:flex-1 md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
            <input 
              type="text" 
              placeholder="Query Name or SKU..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/10 focus:border-[#c5a059] text-white rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold outline-none transition-all font-sans"
            />
          </div>

          <div className="relative w-full sm:w-44">
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as "all" | "instock" | "lowstock" | "outstock")}
              className="w-full bg-black/40 border border-white/10 focus:border-[#c5a059] text-white rounded-xl pl-4 pr-10 py-2.5 text-xs font-bold outline-none transition-all cursor-pointer appearance-none font-sans"
            >
              <option value="all">All Availability States</option>
              <option value="instock" className="bg-zinc-950">In Stock Nodes</option>
              <option value="lowstock" className="bg-zinc-950">Low Stock Indicators</option>
              <option value="outstock" className="bg-zinc-950">Out of Stock / Overdue</option>
            </select>
            <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-500 pointer-events-none" />
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
                  const isOut = item.currentStock === 0;
                  const isLow = item.itemType === "consumable" && item.currentStock > 0 && item.currentStock <= item.minRequiredStock;
                  
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
                          <div className="space-y-1.5">
                            {isOut ? (
                              <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-md">
                                <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" /> Out of Stock
                              </span>
                            ) : isLow ? (
                              <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md">
                                <span className="w-1 h-1 rounded-full bg-amber-500" /> Low Stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md">
                                <span className="w-1 h-1 rounded-full bg-emerald-500" /> In Stock
                              </span>
                            )}
                            <div className="text-[11px] text-slate-400 font-bold pl-0.5">
                              <span className="text-white font-black">{item.currentStock}</span>
                              <span className="text-slate-600 font-medium mx-1">/</span>
                              <span className="text-slate-500">{item.minRequiredStock} {item.unitOfMeasurement}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {item.nextServiceDate && new Date(item.nextServiceDate) <= new Date() ? (
                              <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-md">
                                <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" /> Compliance Overdue
                              </span>
                            ) : item.status === "needs_service" ? (
                              <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md">
                                <span className="w-1 h-1 rounded-full bg-amber-500" /> Maintenance Needed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2.5 py-1 rounded-md">
                                <span className="w-1 h-1 rounded-full bg-sky-500" /> Operational
                              </span>
                            )}
                            <div className="text-[10px] text-slate-500 font-mono tracking-wide pl-0.5 uppercase">
                              {item.nextServiceDate ? `Inspection: ${item.nextServiceDate}` : "No Service Date Logged"}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* 🌟 INCORPORATED: DYNAMIC ACTION DESK MATRIX */}
                      <td className="p-6">
                        {item.itemType === "consumable" ? (
                          <div className="flex items-center justify-center gap-3">
                            <div className="flex items-center gap-1">
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

                            <button
                              onClick={() => {
                                setSelectedItemToIssue(item);
                                setIssueForm({ quantity: "1", allocatedTo: "", notes: "" });
                                setIsIssueOpen(true);
                              }}
                              disabled={isPending || item.currentStock === 0}
                              className="px-3 py-1.5 bg-[#c5a059]/10 hover:bg-[#c5a059] text-[#c5a059] hover:text-black border border-[#c5a059]/20 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer whitespace-nowrap"
                            >
                              Issue Unit
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

      {/* --- 🌟 DETACHED TRANSACTIONAL DISPATCH OVERLAY MODAL --- */}
      <AnimatePresence>
        {isIssueOpen && selectedItemToIssue && (
          <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#0c0c0e] border border-white/5 p-6 rounded-3xl space-y-6 text-left"
            >
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-[#c5a059]">Stock Dispatch Logging Terminal</span>
                <h3 className="text-xl font-serif text-white italic font-bold mt-1">Issue: {selectedItemToIssue.name}</h3>
                <p className="text-[11px] text-slate-500 mt-1">Available in storage: <span className="text-white font-black">{selectedItemToIssue.currentStock} {selectedItemToIssue.unitOfMeasurement}</span></p>
              </div>

              <form onSubmit={handleIssueSubmit} className="space-y-4 font-sans">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Quantity</label>
                    <input 
                      required 
                      type="number" 
                      min="1" 
                      max={selectedItemToIssue.currentStock} 
                      value={issueForm.quantity} 
                      onChange={e => setIssueForm({...issueForm, quantity: e.target.value})} 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-[#c5a059]" 
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Allocation Destination / Staff</label>
                    <input 
                      required 
                      type="text" 
                      placeholder="e.g. Room 404, Housekeeping Cart A" 
                      value={issueForm.allocatedTo} 
                      onChange={e => setIssueForm({...issueForm, allocatedTo: e.target.value})} 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-[#c5a059]" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Internal Notes</label>
                  <textarea 
                    placeholder="Reason for issuance..." 
                    value={issueForm.notes} 
                    onChange={e => setIssueForm({...issueForm, notes: e.target.value})} 
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-xs font-bold text-white outline-none focus:border-[#c5a059] resize-none" 
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsIssueOpen(false);
                      setSelectedItemToIssue(null);
                    }} 
                    className="flex-1 border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-[10px] uppercase font-black tracking-widest py-3.5 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isPending}
                    className="flex-1 bg-[#c5a059] text-black text-[10px] uppercase font-black tracking-widest py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#c5a059]/10"
                  >
                    {isPending ? <Loader2 className="animate-spin" size={14} /> : <><ShieldCheck size={14} /> Authorize Dispatch</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function X({ size }: { size: number }) { return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>; }