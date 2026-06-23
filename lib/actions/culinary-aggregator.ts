// lib/actions/culinary-aggregator.ts
"use server";

import { db } from "@/db";
import { culinaryOutlets, culinaryDishes } from "@/db/schema/culinary";
import { eq, and } from "drizzle-orm";
import { getPlatformOutletUrl } from "@/lib/utils/culinary"; // 🌟 Import your dynamic utility helper

// Strict type interfaces for end-to-end type safety compliance
export interface ComputedComparisonItem {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  zomatoPrice: number;
  swiggyPrice: number;
  toingPrice: number;
  whatsappNumber: string;
  zomatoOutletUrl: string | null;
  swiggyOutletUrl: string | null;
  toingOutletUrl: string | null; // Added to fully support your platform matrix
}

/**
 * CLIENT DATA-FETCH CONTROLLER
 * Aggregates on-premise values against platform marks.
 */
export async function getComputedComparisonMenuAction(outletIdStr: string) {
  // Defensive scale gates
  if (!outletIdStr || outletIdStr.trim() === "") {
    return { success: false, error: "Execution blocked: Invalid target outlet parameters identifier." };
  }

  try {
    // 1. Query target physical outlet branch credentials
    const [targetBranch] = await db
      .select()
      .from(culinaryOutlets)
      .where(and(eq(culinaryOutlets.id, outletIdStr), eq(culinaryOutlets.isActive, true)))
      .limit(1);

    if (!targetBranch) {
      return { success: false, error: "Target culinary channel node was unconfigured or suspended." };
    }

    // 2. Fetch the catalogued menu items registered to this kitchen branch
    const rawDishes = await db
      .select()
      .from(culinaryDishes)
      .where(eq(culinaryDishes.outletId, outletIdStr));

    // 3. Process the dataset through our comparison algorithm
    const computedDataset: ComputedComparisonItem[] = rawDishes.map((dish) => {
      // MULTI-APP PRICING ENGINE LOGIC:
      // If Apify has populated a verified scraped row price, serve it immediately.
      // If the row column is null (e.g. initial onboarding phase), project a graceful markup fallback.
      const zomatoFinalPrice = dish.scrapedZomatoPrice || Math.round(dish.basePrice * 1.20);
      const swiggyFinalPrice = dish.scrapedSwiggyPrice || Math.round(dish.basePrice * 1.22);
      const toingFinalPrice = dish.scrapedToingPrice || Math.round(dish.basePrice * 1.15);

      // 🛠️ FIX: Resolve URLs dynamically from raw platform store string IDs instead of pulling dead columns
      const zomatoUrl = getPlatformOutletUrl("zomato", targetBranch);
      const swiggyUrl = getPlatformOutletUrl("swiggy", targetBranch);
      const toingUrl = getPlatformOutletUrl("toing", targetBranch);

      return {
        id: dish.id,
        name: dish.name,
        category: dish.category,
        basePrice: dish.basePrice,
        zomatoPrice: zomatoFinalPrice,
        swiggyPrice: swiggyFinalPrice,
        toingPrice: toingFinalPrice,
        whatsappNumber: targetBranch.whatsappNumber,
        zomatoOutletUrl: zomatoUrl,
        swiggyOutletUrl: swiggyUrl,
        toingOutletUrl: toingUrl,
      };
    });

    return { 
      success: true, 
      data: computedDataset 
    };

  } catch (error: any) {
    console.error("❌ Critical Menu Extraction Exception Loop Fault:", error.message);
    return { 
      success: false, 
      error: "Internal transactional cluster timeout error while pulling menu records." 
    };
  }
}