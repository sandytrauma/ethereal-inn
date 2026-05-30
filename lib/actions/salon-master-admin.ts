// lib/actions/salon-master-admin.ts
"use server";

import { db } from "@/db";
import { salonTenants, salonOutlets, salonAuthUsers } from "@/db/glam-schema";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

interface ProvisionTenantInput {
  secretKey: string;
  ownerName: string;
  ownerEmail: string;
  passwordRaw: string;
  businessName: string;
  tier: "trial" | "basic_single" | "growth_multi" | "enterprise_infinity";
  firstOutletName: string;
  firstOutletAddress: string;
  firstOutletPhone: string;
}

/**
 * MASTER ADMIN ONLY ENGINE
 * Provisions a completely isolated tenant ecosystem inside the 'glam' schema namespace.
 */
export async function masterProvisionTenant(input: ProvisionTenantInput) {
  // =========================================================================
  // 🛡️ UN-BYPASSABLE SERVER SIDE SECRET ENFORCEMENT
  // =========================================================================
  // Prevents empty string fallback attacks if environment configurations leak or slip
  if (!process.env.MASTER_ADMIN_SECRET) {
    throw new Error(
      "🚨 CRITICAL RUNTIME EXCEPTION: 'MASTER_ADMIN_SECRET' configuration is missing inside active variables block."
    );
  }

  const trueSecret: string = process.env.MASTER_ADMIN_SECRET;  
  if (input.secretKey !== trueSecret) {
    return { 
      success: false, 
      error: "Critical Authorization Breach. Request Terminated Natively." 
    };
  }

  try {
    // 1. Password security hashing pass
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(input.passwordRaw, salt);

    // Calculate structural system parameters based on targeted rental tier
    let maxOutlets = 1;
    if (input.tier === "growth_multi") maxOutlets = 5;
    if (input.tier === "enterprise_infinity") maxOutlets = 999;

    const sessionDurationDays = 30; // Default trial/billing cycle envelope
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + sessionDurationDays);

    // 2. Execute Atomically across the glam namespace database engine via Transaction
    const result = await db.transaction(async (tx) => {
      
      // Step A: Create the Business Master Tenant Account
      const [newTenant] = await tx.insert(salonTenants).values({
        ownerName: input.ownerName,
        ownerEmail: input.ownerEmail.toLowerCase().trim(),
        ownerPassword: hashedPassword,
        businessName: input.businessName,
        tier: input.tier,
        maxAllowedOutlets: maxOutlets,
        subscriptionValidUntil: validUntil,
        subscriptionStatus: "active",
      }).returning({ id: salonTenants.id });

      // Step B: Spin up their first base physical operating outlet location
      const [firstOutlet] = await tx.insert(salonOutlets).values({
        tenantId: newTenant.id,
        name: input.firstOutletName,
        address: input.firstOutletAddress,
        phone: input.firstOutletPhone,
        operatingHoursOpen: "09:00",
        operatingHoursClose: "21:00",
      }).returning({ id: salonOutlets.id });

      // Step C: Initialize their primary isolated login identity
      const [tenantAdminUser] = await tx.insert(salonAuthUsers).values({
        tenantId: newTenant.id,
        outletId: firstOutlet.id, // Primary anchoring outlet branch
        name: input.ownerName,
        email: input.ownerEmail.toLowerCase().trim(),
        passwordHash: hashedPassword,
        role: "tenant_admin", // Grants them structural rights to manage their own shops
        isActive: true,
      }).returning({ id: salonAuthUsers.id });

      return {
        tenantId: newTenant.id,
        outletId: firstOutlet.id,
        authUserId: tenantAdminUser.id,
      };
    });

    // 🌟 THE PRODUCTION FIX: Force cache validation pass across admin portals cleanly
    revalidatePath("/glam/master-admin");

    return { 
      success: true, 
      message: `Tenant '${input.businessName}' provisioned successfully inside glam schema space.`,
      data: result 
    };

  } catch (error: any) {
    console.error("Master Tenant Provisioning Error:", error.message);
    
    // Catch common PostgreSQL unique constraint violations gracefully
    if (error.message?.includes("unique constraint") || error.message?.includes("already exists")) {
      return { success: false, error: "A salon account with this owner email is already registered." };
    }
    
    return { success: false, error: "Internal core cluster provisioning initialization failure." };
  }
}