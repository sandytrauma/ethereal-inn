// lib/actions/salon-brand-update.ts
"use server";

import { db } from "@/db";
import { salonTenants, salonServices } from "@/db/glam-schema";
import { eq, and } from "drizzle-orm";
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

// 🌟 NEW TYPING CONTRACT FOR THE INLINE SERVICE PUBLISHER
interface NewServiceInput {
  name: string;
  description: string;
  durationMinutes: number;
  price: string;
  isAestheticProcedure: boolean;
}

/**
 * TENANT OPERATOR ONLY ACTION
 * Modifies public-facing branding parameters, assets, and tracking metrics securely.
 */
export async function updateTenantBrandAction(input: UpdateBrandInput) {
  try {
    const session = await getSalonSession();
    if (!session || !session.tenantId) {
      return { success: false, error: "Authentication required. Operation aborted." };
    }

    const targetTenantId = String(session.tenantId);

    await db
      .update(salonTenants)
      .set({
        businessName: input.businessName ? input.businessName.trim() : "Ethereal Glam Studio",
        brandBio: input.brandBio ? input.brandBio.trim() : null,
        brandLogoUrl: input.brandLogoUrl || null,
        brandBannerUrl: input.brandBannerUrl || null,
        brandMetaTitle: input.brandMetaTitle ? input.brandMetaTitle.trim() : null,
        brandMetaDescription: input.brandMetaDescription ? input.brandMetaDescription.trim() : null,
        googleAnalyticsId: input.googleAnalyticsId ? input.googleAnalyticsId.toUpperCase().trim() : null,
      })
      .where(eq(salonTenants.id, targetTenantId));

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

/**
 * 🌟 NEW SERVICE CREATION SERVER ACTION
 * Inserts custom owner treatments into the database securely via session context hooks.
 */
export async function addSalonServiceAction(input: NewServiceInput) {
  try {
    const session = await getSalonSession();
    if (!session || !session.tenantId) {
      return { success: false, error: "Authentication expired. Service could not be published." };
    }

    const tenantIdStr = String(session.tenantId);

    // Compute slug string cleanly from treatment name for cleaner schema assignment
    const derivedSlug = input.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    await db.insert(salonServices).values({
      tenantId: tenantIdStr,
      name: input.name.trim(),
      slug: derivedSlug,
      description: input.description ? input.description.trim() : null,
      durationMinutes: input.durationMinutes,
      price: input.price, // Drizzle accepts numerical strings for decimal maps perfectly
      isAestheticProcedure: input.isAestheticProcedure,
    });

    if (session.slug) {
      revalidatePath(`/glam/brand/${session.slug}`);
    }

    return { success: true, message: "Custom treatment entry successfully published directly to database layout." };
  } catch (error: any) {
    console.error("❌ CREATE SERVICE MATRICES EXCEPTION:", error.message);
    return { success: false, error: "Database rejected service creation parameters." };
  }
}