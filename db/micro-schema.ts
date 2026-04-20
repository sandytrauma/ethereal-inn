import { pgTable, uuid, text, doublePrecision, timestamp, numeric } from "drizzle-orm/pg-core";

// 1. New Table: The Master Directory of all your properties
export const properties = pgTable("properties", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  city: text("city").notNull(),
  managerEmail: text("manager_email").notNull(),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 2. New Table: Revenue bridge (to fetch "Global Outcome" later)
export const propertyRevenueBridge = pgTable("property_revenue_bridge", {
  id: uuid("id").primaryKey().defaultRandom(),
  propertyId: uuid("property_id").references(() => properties.id),
  amount: numeric("amount", { precision: 12, scale: 2 }).default("0"),
  source: text("source"), // e.g., "Room Revenue", "Urban Ambrosia"
  date: timestamp("date").defaultNow(),
});