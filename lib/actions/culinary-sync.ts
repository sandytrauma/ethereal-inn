// lib/actions/culinary-sync.ts
"use server";

import { db } from "@/db";
import { culinaryDishes, culinaryOutlets } from "@/db/schema/culinary";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

interface IngestionItemPayload {
  title: string;
  category: string;
  price: number; // Public aggregator price value
}

// Strictly define the permissible update structure instead of using 'any'
interface DishUpdatePayload {
  updatedAt: Date;
  scrapedZomatoPrice?: number;
  scrapedSwiggyPrice?: number;
  scrapedToingPrice?: number;
}

/**
 * PRODUCTION INTEGRITY PIPELINE
 * Upserts pricing datasets safely into isolated column targets.
 */
export async function reconcileScrapedPricesAction(
  targetOutletId: string,
  scrapedMenuDataset: IngestionItemPayload[],
  platformSource: "zomato" | "swiggy" | "toing"
) {
  if (!targetOutletId || !scrapedMenuDataset || scrapedMenuDataset.length === 0) {
    return { success: false, error: "Empty or faulty parameters payload package." };
  }

  try {
    // 1. Validate that the target outlet exists
    const [outletContext] = await db
      .select({
        id: culinaryOutlets.id,
        slug: culinaryOutlets.slug,
      })
      .from(culinaryOutlets)
      .where(eq(culinaryOutlets.id, targetOutletId))
      .limit(1);

    if (!outletContext) {
      return { success: false, error: "Target platform outlet node does not exist inside configuration arrays." };
    }

    // 2. Process records sequentially (or in small controlled chunks) to prevent pool saturation
    for (const item of scrapedMenuDataset) {
      if (!item.title) continue; // Skip malformed rows safely

      const targetNameNormalized = item.title.trim();
      const fallbacksCategory = item.category?.trim() || "General Consumables";
      const actualPrice = Math.max(0, Number(item.price) || 0);

      // Check for an existing item on this outlet with the same name
      const [existingItemRow] = await db
        .select({ id: culinaryDishes.id })
        .from(culinaryDishes)
        .where(
          and(
            eq(culinaryDishes.outletId, targetOutletId),
            eq(culinaryDishes.name, targetNameNormalized)
          )
        )
        .limit(1);

      const payloadFieldsUpdate: DishUpdatePayload = { updatedAt: new Date() };
      
      if (platformSource === "zomato") payloadFieldsUpdate.scrapedZomatoPrice = actualPrice;
      if (platformSource === "swiggy") payloadFieldsUpdate.scrapedSwiggyPrice = actualPrice;
      if (platformSource === "toing") payloadFieldsUpdate.scrapedToingPrice = actualPrice;

      if (existingItemRow) {
        // Execute dynamic item updates
        await db
          .update(culinaryDishes)
          .set(payloadFieldsUpdate)
          .where(eq(culinaryDishes.id, existingItemRow.id));
      } else {
        // Compute organic base markdown fallback price safely
        const calculatedBaseDirectPrice = Math.round(actualPrice / 1.20);

        await db
          .insert(culinaryDishes)
          .values({
            outletId: targetOutletId,
            name: targetNameNormalized,
            category: fallbacksCategory,
            basePrice: calculatedBaseDirectPrice,
            scrapedZomatoPrice: platformSource === "zomato" ? actualPrice : null,
            scrapedSwiggyPrice: platformSource === "swiggy" ? actualPrice : null,
            scrapedToingPrice: platformSource === "toing" ? actualPrice : null,
          });
      }
    }

    // 3. Clear router memory allocations using server cache invalidation paths
    if (outletContext.slug) {
      revalidatePath(`/culinary/brand/${outletContext.slug}`);
    }
    
    return { 
      success: true, 
      message: `Database synchronized with ${platformSource} parameters successfully.` 
    };

  } catch (error: any) {
    console.error("❌ Critical Ingestion Thread Runtime Fault:", error.message);
    return { success: false, error: "Internal cluster write exception transaction block fault." };
  }
}