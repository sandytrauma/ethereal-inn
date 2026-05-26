// app/(dashboard)/inventory/page.tsx
import React from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { db } from "@/db";
import { properties } from "@/db/micro-schema"; // Ensure this matches your micro-schema path
import { asc, inArray } from "drizzle-orm";
import { getInventoryList, getInventoryAlerts, getGlobalInventoryCategories } from "@/lib/actions/inventory";
import { InventoryWorkspace } from "@/components/inventory/InventoryWorkspace";

export default async function InventoryPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  const session = token ? await decrypt(token).catch(() => null) : null;

  if (!session) {
    redirect("/login");
  }

  const userId = Number((session as any).id || (session as any).userId);
  const isMasterAdmin = userId === 1;
  const sessionPropertyId = (session as any).propertyId;

  // 🌟 RESOLVE ACCESSIBLE SCOPE: Read arrays for multi-property tenants, or fall back to their single active property context
  const accessibleProperties: string[] = (session as any).accessibleProperties || 
    (sessionPropertyId ? [String(sessionPropertyId)] : []);

  // --- 1. FETCH PERMITTED PROPERTIES LIST FOR DROPDOWN SELECTION ---
  let propertiesList: { id: string; name: string }[] = [];
  
  if (isMasterAdmin) {
    // Master Admin can select from all properties system-wide
    propertiesList = await db
      .select({ id: properties.id, name: properties.name })
      .from(properties)
      .orderBy(asc(properties.name));
  } else if (accessibleProperties.length > 0) {
    // Multi-property tenants only see the 2 or 3 branches assigned to their session token account
    propertiesList = await db
      .select({ id: properties.id, name: properties.name })
      .from(properties)
      .where(inArray(properties.id, accessibleProperties))
      .orderBy(asc(properties.name));
  }

  // --- 2. FETCH MULTI-TENANT WORKSPACE DATA IN PARALLEL ---
  // Pass the entire accessible tracking scope array right down to the database query operations pass
  const queryScope = isMasterAdmin ? sessionPropertyId : accessibleProperties;

  const [listRes, alertsRes, categoriesRes] = await Promise.all([
    getInventoryList(queryScope),
    getInventoryAlerts(queryScope),
    getGlobalInventoryCategories()
  ]);

  return (
    <main className="min-h-screen bg-[#060608] text-slate-100 p-6 md:p-12 font-sans selection:bg-[#c5a059] selection:text-black">
      <InventoryWorkspace 
        initialItems={listRes.success && listRes.data ? listRes.data : []}
        alerts={alertsRes.success && alertsRes.data ? alertsRes.data : { lowStock: [], overdueService: [] }}
        categories={categoriesRes.success && categoriesRes.data ? categoriesRes.data : []}
        propertiesList={propertiesList} // 🌟 Correctly supplies either all hotels or the tenant's specific branch array portfolio
        propertyId={sessionPropertyId || ""}
        isMasterAdmin={isMasterAdmin}
      />
    </main>
  );
}