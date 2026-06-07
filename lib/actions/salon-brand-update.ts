// lib/actions/salon-brand-update.ts
"use server";

import { db } from "@/db";
import { salonTenants } from "@/db/glam-schema";
import { eq } from "drizzle-orm";
import { getSalonSession } from "@/lib/salon-token";
import { revalidatePath } from "next/cache";

interface UpdateBrandInput {
  businessName: string;
  brandBio: string;
  brandLogoUrl: string;
  brandBannerUrl: string;
  brandMetaTitle: string;
  brandMetaDescription: string;
  googleAnalyticsId: string;
}

/**
 * TENANT OPERATOR ONLY ACTION
 * Modifies public-facing branding parameters, assets, and tracking metrics securely.
 */
export async function updateTenantBrandAction(input: UpdateBrandInput) {
  try {
    // 🛡️ Ensure only an active, authenticated tenant administrator can modify profile fields
    const session = await getSalonSession();
    if (!session || !session.tenantId) {
      return { success: false, error: "Authentication required. Operation aborted." };
    }

    const targetTenantId = String(session.tenantId);

    // =========================================================================
    // 🛠️ DEFENSIVE EXECUTION RUNWAY (CRASH PREVENTION GATES)
    // =========================================================================
    await db
      .update(salonTenants)
      .set({
        // Safe ternary checks shield the engine from calling methods on undefined/null form fields
        businessName: input.businessName ? input.businessName.trim() : "Ethereal Glam Studio",
        brandBio: input.brandBio ? input.brandBio.trim() : null,
        brandLogoUrl: input.brandLogoUrl || null,
        brandBannerUrl: input.brandBannerUrl || null,
        brandMetaTitle: input.brandMetaTitle ? input.brandMetaTitle.trim() : null,
        brandMetaDescription: input.brandMetaDescription ? input.brandMetaDescription.trim() : null,
        googleAnalyticsId: input.googleAnalyticsId ? input.googleAnalyticsId.toUpperCase().trim() : null,
      })
      .where(eq(salonTenants.id, targetTenantId));

    // Instantly purge page caching models to force live edge page refresh updates
    if (session.slug) {
      revalidatePath(`/glam/brand/${session.slug}`);
    }
    revalidatePath("/glam/dashboard");

    return { 
      success: true, 
      message: "Branding parameters and asset schemas updated successfully." 
    };

  } catch (error: any) {
    console.error("❌ CRITICAL DATABASE BRAND SYNC FAILURE:", error.message);
    return { success: false, error: error.message || "Internal processing failure while committing profile rows." };
  }
}