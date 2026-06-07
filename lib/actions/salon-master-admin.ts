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
  slug: string; // 🌟 Mandatory dynamic tenant slug identifier
  tier: "trial" | "basic_single" | "growth_multi" | "enterprise_infinity";
  firstOutletName: string;
  firstOutletAddress: string;
  firstOutletPhone: string;
}

// 🔴 CRITICAL AUDIT ITEM: Reserved keywords to prevent routing deadlocks
const RESERVED_SUBDOMAINS = [
  "www", "admin", "api", "glam", "pms", "pms-admin", "master-hub", 
  "login", "auth", "status", "cloud", "assets", "static", "mail", "system"
];

/**
 * MASTER ADMIN ONLY ENGINE
 * Provisions a completely isolated tenant ecosystem using the native schema 'slug' column.
 */
export async function masterProvisionTenant(input: ProvisionTenantInput) {
  // =========================================================================
  // 🛡️ UN-BYPASSABLE SERVER SIDE SECRET ENFORCEMENT
  // =========================================================================
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

  if (!input.slug || !input.slug.trim()) {
    return { success: false, error: "SaaS Workspace Routing Slug cannot be empty." };
  }

  // 🌟 SERVER-SIDE NORMALIZATION PASS: Sanitize incoming custom slug
  const normalizedSlug = input.slug
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Strip unique special chars
    .replace(/[\s_-]+/g, "-") // Convert spaces/underscores to clean dashes
    .replace(/^-+|-+$/g, ""); // Clean trailing/leading dash blocks

  // 🟠 HIGH AUDIT ITEM: Subdomain length constraint (RFC 1035 spec limit: 63 chars)
  if (normalizedSlug.length > 63) {
    return { success: false, error: "Validation Failure: Provided routing slug exceeds the absolute 63-character domain limit." };
  }

  // 🔴 CRITICAL AUDIT ITEM: Intercept reserved keywords
  if (RESERVED_SUBDOMAINS.includes(normalizedSlug)) {
    return { success: false, error: `Validation Failure: "${normalizedSlug}" is a reserved system route namespace.` };
  }

  try {
    // 🔒 SECURITY DECOUPLING PASS: Compute independent salts/hashes per entity record
    const tenantSalt = await bcrypt.genSalt(10);
    const tenantHashedPassword = await bcrypt.hash(input.passwordRaw, tenantSalt);

    const operatorSalt = await bcrypt.genSalt(10);
    const operatorHashedPassword = await bcrypt.hash(input.passwordRaw, operatorSalt);

    // Calculate structural system parameters based on targeted rental tier
    let maxOutlets = 1;
    if (input.tier === "growth_multi") maxOutlets = 5;
    if (input.tier === "enterprise_infinity") maxOutlets = 999;

    const sessionDurationDays = 30; // Default trial/billing cycle envelope
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + sessionDurationDays);

    // 2. Execute Atomically across the database engine via Transaction
    const result = await db.transaction(async (tx) => {
      
      // Step A: Create the Business Master Tenant Account using the explicit slug column
      const [newTenant] = await tx.insert(salonTenants).values({
        ownerName: input.ownerName,
        ownerEmail: input.ownerEmail.toLowerCase().trim(),
        ownerPassword: tenantHashedPassword, // 🌟 Handled with independent tenant hash
        businessName: input.businessName,
        slug: normalizedSlug, 
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
        outletId: firstOutlet.id,
        name: input.ownerName,
        email: input.ownerEmail.toLowerCase().trim(),
        passwordHash: operatorHashedPassword, // 🌟 Handled with independent user hash
        role: "tenant_admin", 
        isActive: true,
      }).returning({ id: salonAuthUsers.id });

      // 🟡 MEDIUM AUDIT ITEM: Structural Provisioning Audit Log Generation
      console.log(`[AUDIT LOG] [${new Date().toISOString()}] TENANT_PROVISIONED | Tenant ID: ${newTenant.id} | Router Slug: ${normalizedSlug} | Plan Tier: ${input.tier}`);

      return {
        tenantId: newTenant.id,
        outletId: firstOutlet.id,
        authUserId: tenantAdminUser.id,
        slug: normalizedSlug
      };
    });

    // Force cache validation pass across admin portals cleanly
    revalidatePath("/glam/master-hub");

    return { 
      success: true, 
      message: `Tenant '${input.businessName}' provisioned successfully under the routing scope: ${normalizedSlug}.etherealinn.com`,
      data: result 
    };

  } catch (error: any) {
    console.error("Master Tenant Provisioning Error:", error.message);
    
    // Catch common PostgreSQL unique constraint violations gracefully
    if (error.message?.includes("unique constraint") || error.message?.includes("already exists")) {
      if (error.message?.includes("slug")) {
        return { success: false, error: "This routing subdomain identifier is already allocated to another salon workspace." };
      }
      return { success: false, error: "A salon account with this owner email is already registered on our servers." };
    }
    
    return { success: false, error: "Internal core cluster provisioning initialization failure." };
  }
}