"use client";

import React, { useTransition } from "react";
import { deleteTenantEntirely } from "@/lib/actions/saas-actions";
import { Loader2, Trash2 } from "lucide-react";

interface DeleteButtonProps {
  tenantId: number;
  branchCount: number; // 🌟 ADDED: Captures live structural infrastructure weight counters
}

export default function TenantDeleteButton({ tenantId, branchCount }: DeleteButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handlePurge = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    // =========================================================================
    // 🌟 THE SECURITY INTERCEPT MATRIX: Dynamic Multi-Tenant Friction Gates
    // Adjusts warning weight depending on the tenant's data payload weight.
    // =========================================================================
    if (branchCount > 0) {
      const firstConfirm = confirm(
        `🚨 CRITICAL INFRATRUST ALERT: This partner profile actively manages ${branchCount} branches across the network.\n\nPurging this node will execute a cascading delete across ALL linked property structures, room inventories, historical invoices, and cash daybooks.\n\nAre you completely sure you want to trigger this teardown?`
      );
      if (!firstConfirm) return;

      const secondConfirm = confirm(
        `⚠️ FINAL COMPLIANCE CHECKOVER:\nThis action is irreversible. All transaction history logs will be stripped from the cluster forever. Continue with user deletion?`
      );
      if (!secondConfirm) return;
    } else {
      // Streamlined confirmation pass for unpopulated asset nodes
      const standardConfirm = confirm(
        "Permanently revoke access and remove this unpopulated tenant partition node?"
      );
      if (!standardConfirm) return;
    }

    startTransition(async () => {
      const res = await deleteTenantEntirely(tenantId);
      if (!res.success) {
        alert("Purge operation rejected by database boundaries: " + res.error);
      }
    });
  };

  return (
    <button
      onClick={handlePurge}
      disabled={isPending}
      className="p-3 rounded-xl bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white disabled:bg-slate-800 disabled:text-slate-600 border border-red-500/10 transition-all duration-150 flex items-center justify-center cursor-pointer select-none"
      title={branchCount > 0 ? `Cascade Delete ${branchCount} Units` : "Purge Empty Node Partition"}
    >
      {isPending ? (
        <Loader2 className="animate-spin text-red-400" size={14} />
      ) : (
        <Trash2 size={14} className="group-hover:scale-110 transition-transform" />
      )}
    </button>
  );
}