import { relations } from "drizzle-orm";
import { pgTable, uuid, text, doublePrecision, timestamp, numeric, integer, serial, varchar } from "drizzle-orm/pg-core";
import { financialRecords, rooms } from "./schema";

// 1. New Table: The Master Directory of all your properties
export const properties = pgTable("properties", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  city: text("city").notNull(),
  managerEmail: text("manager_email").notNull(),
  ownerId: integer("owner_id")
    .default(1)
    .notNull(),
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

export const propertiesRelations = relations(properties, ({ many }) => ({
  rooms: many(rooms),
  finance: many(financialRecords),
}));

export const propertyRevenueBridgeRelations = relations(propertyRevenueBridge, ({ one }) => ({
  property: one(properties, {
    fields: [propertyRevenueBridge.propertyId],
    references: [properties.id],
  }),
}));

// 📊 Strict Type Constraints: Onboarding Lifecycle States
export const inquiryStatusEnum = varchar("inquiry_status", { 
  enum: ["pending", "reviewing", "contacted", "approved"] 
});

// 🏢 High-Efficiency Ledger: Public Hotel Applications Tracker
export const partnerInquiries = pgTable("partner_inquiries", {
  id: serial("id").primaryKey(),
  hotelName: varchar("hotel_name", { length: 255 }).notNull(),
  ownerName: varchar("owner_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  totalRooms: integer("total_rooms").default(0).notNull(),
  message: text("message"),
  status: text("status").default("pending").notNull(), // Managed by server action validation checks
  loggedAt: timestamp("logged_at", { withTimezone: true }).defaultNow().notNull(),
});