// db/schema/culinary.ts
import { pgSchema, uuid, varchar, integer, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Initialize standalone schema workspace boundary
export const culinarySchema = pgSchema("culinary");

// 🏪 PARTNER KITCHEN OUTLETS TABLE
export const culinaryOutlets = culinarySchema.table("outlets", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(), // The dynamic sub-domain routing identifier
  locationContext: varchar("location_context", { length: 255 }).notNull(), // e.g., "Mohan Garden, Delhi"
  whatsappNumber: varchar("whatsapp_number", { length: 20 }).notNull(),

  platformRank: integer("platform_rank").default(0).notNull(),
  
  // 🌟 ANCHOR CODES: Provided by clients like SK Butter Momos during onboarding passes
  zomatoStoreId: varchar("zomato_store_id", { length: 100 }),
  swiggyStoreId: varchar("swiggy_store_id", { length: 100 }),
  toingStoreId: varchar("toing_store_id", { length: 100 }),
  
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 🥟 KITCHEN DISHES INVENTORY MENU MATRIX
export const culinaryDishes = culinarySchema.table("dishes", {
  id: uuid("id").defaultRandom().primaryKey(),
  outletId: uuid("outlet_id").references(() => culinaryOutlets.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(), // e.g., "Momos", "Fusion Thali"
  
  basePrice: integer("base_price").notNull(), // Direct WhatsApp price
  
  // LIVE CACHED PRICE VALUATION CELLS
  scrapedZomatoPrice: integer("scraped_zomato_price"), // Managed dynamically via webhooks
  scrapedSwiggyPrice: integer("scraped_swiggy_price"), // Managed dynamically via webhooks
  scrapedToingPrice: integer("scraped_toing_price"),
  
  isAvailableDirect: boolean("is_available_direct").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const culinaryOutletsRelations = relations(culinaryOutlets, ({ many }) => ({
  dishes: many(culinaryDishes),
}));

export const culinaryDishesRelations = relations(culinaryDishes, ({ one }) => ({
  outlet: one(culinaryOutlets, { fields: [culinaryDishes.outletId], references: [culinaryOutlets.id] }),
}));