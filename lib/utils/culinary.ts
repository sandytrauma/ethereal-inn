// lib/utils/culinary.ts

/**
 * Expected minimal shape of a Culinary Outlet database record required for URL generation.
 * Maps cleanly to your Drizzle ORM schema fields.
 */
export interface OutletStoreData {
  zomatoStoreId: string | null;
  swiggyStoreId: string | null;
  toingStoreId: string | null;
}

/**
 * Valid supported food aggregator platform identifier tokens.
 */
export type CulinaryPlatform = "zomato" | "swiggy" | "toing";

/**
 * 🌐 GENERATE PLATFORM OUTLET URL
 * Constructs absolute live restaurant listing hyperlinks dynamically using raw store string IDs.
 * Prevents hardcoding static URLs directly inside your columns.
 * 
 * @param platform The targeting food aggregator system token.
 * @param outlet Object containing the platform-specific unique store identifiers.
 * @returns The absolute URL string, or null if the ID is missing or empty.
 */
export function getPlatformOutletUrl(
  platform: CulinaryPlatform,
  outlet: OutletStoreData
): string | null {
  if (!outlet) return null;

  switch (platform) {
    case "zomato":
      return outlet.zomatoStoreId 
        ? `https://www.zomato.com/restaurant-link-path/${outlet.zomatoStoreId}` 
        : null;
        
    case "swiggy":
      return outlet.swiggyStoreId 
        ? `https://www.swiggy.com/restaurants/${outlet.swiggyStoreId}` 
        : null;
        
    case "toing":
      return outlet.toingStoreId 
        ? `https://toing.com/store/${outlet.toingStoreId}` 
        : null;

    default:
      const _exhaustiveCheck: never = platform;
      return null;
  }
}

/**
 * 🏷️ FORMAT CULINARY PRICE
 * Formats a raw numeric price value into a standard currency string (INR) 
 * for frontend menus and dashboards.
 * 
 * @param price Raw numeric amount.
 * @returns Formatted currency text structure.
 */
export function formatCulinaryPrice(price: number | string | null | undefined): string {
  if (price === null || price === undefined) return "₹0.00";
  const numericPrice = typeof price === "string" ? parseFloat(price) : price;
  if (isNaN(numericPrice)) return "₹0.00";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(numericPrice);
}

/**
 * 📊 CALCULATE PRICE VARIANCE
 * Computes price differences between your base price and scraped platform aggregators
 * to flag inflated metrics or tracking variance loops.
 */
export interface PriceVarianceReport {
  difference: number;
  percentageInflation: number;
  isInflated: boolean;
}

export function calculatePriceVariance(
  basePrice: number,
  scrapedPrice: number
): PriceVarianceReport {
  if (basePrice <= 0) {
    return { difference: 0, percentageInflation: 0, isInflated: false };
  }

  const difference = scrapedPrice - basePrice;
  const percentageInflation = (difference / basePrice) * 100;

  return {
    difference: parseFloat(difference.toFixed(2)),
    percentageInflation: parseFloat(percentageInflation.toFixed(2)),
    isInflated: difference > 0,
  };
}