// lib/actions/culinary-onboard.ts
"use server";

import { db } from "@/db";
import { culinaryOutlets } from "@/db/schema/culinary";
import { eq } from "drizzle-orm";

export interface OnboardTenantInput {
  name: string;
  slug: string;
  locationContext: string;
  whatsappNumber: string;
  zomatoStoreId?: string;
  swiggyStoreId?: string;
  toingStoreId?: string;
}

/**
 * MASTER ADMIN SYSTEM WORKFLOW
 * Securely provisions a new cloud kitchen tenant instance dynamically.
 */
export async function onboardCulinaryTenantAction(
  inputData: OnboardTenantInput,
  masterSecretInput: string
) {
  // 🛡️ SECURITY GUARD 1: Cryptographic validation check
  const internalSecretToken = process.env.MASTER_ADMIN_SECRET_CULINARY;
  if (!internalSecretToken || masterSecretInput !== internalSecretToken) {
    return { success: false, error: "Unauthorized: Invalid Master Admin Culinary Credentials String." };
  }

  // 📦 VALIDATION LAYER 2: Robust structural property parsing
  const cleanName = inputData.name?.trim();
  const cleanSlug = inputData.slug?.toLowerCase().replace(/[^a-z0-9-]/g, "").trim();
  const cleanLocation = inputData.locationContext?.trim();
  const cleanWhatsapp = inputData.whatsappNumber?.trim();

  if (!cleanName || !cleanSlug || !cleanLocation || !cleanWhatsapp) {
    return { success: false, error: "Validation Failure: Missing essential tenant configuration properties." };
  }

  try {
    // 🔍 INTEGRITY GUARD 3: Verify slug uniqueness to prevent routing collisions
    const [existingSlug] = await db
      .select({ id: culinaryOutlets.id })
      .from(culinaryOutlets)
      .where(eq(culinaryOutlets.slug, cleanSlug))
      .limit(1);

    if (existingSlug) {
      return { success: false, error: `Conflict Error: The tenantSlug "${cleanSlug}" is already registered.` };
    }

    // 🚀 EXECUTION LAYER: Atomically insert the verified tenant asset node
    const [newOutlet] = await db
      .insert(culinaryOutlets)
      .values({
        name: cleanName,
        slug: cleanSlug,
        locationContext: cleanLocation,
        whatsappNumber: cleanWhatsapp,
        zomatoStoreId: inputData.zomatoStoreId?.trim() || null,
        swiggyStoreId: inputData.swiggyStoreId?.trim() || null,
        toingStoreId: inputData.toingStoreId?.trim() || null,
        isActive: true,
      })
      .returning({
        id: culinaryOutlets.id,
        slug: culinaryOutlets.slug,
        name: culinaryOutlets.name,
      });

    return {
      success: true,
      message: `Tenant "${newOutlet.name}" successfully provisioned inside the cloud kitchen matrix engine.`,
      data: {
        outletId: newOutlet.id,
        accessPath: `/culinary/brand/${newOutlet.slug}`
      }
    };

  } catch (error: any) {
    console.error("❌ Critical Tenant Onboarding Runtime Fault:", error.message);
    return { success: false, error: "Internal transactional cluster breakdown during tenant instantiation." };
  }
}