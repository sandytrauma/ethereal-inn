import { 
  pgTable, 
  serial, 
  integer, 
  text, 
  timestamp, 
  numeric, 
  pgEnum, 
  boolean, 
  decimal,
  date,
  uuid,
  uniqueIndex,
  varchar
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { properties } from "./micro-schema";

// --- ENUMS ---
export const recordStatusEnum = pgEnum("record_status", ["pending", "deposited", "reconciled"]);
export const taskStatusEnum = pgEnum("task_status", ["todo", "in_progress", "completed", "backlog"]);

// --- TABLES ---

// 1. Users (Staff & Admin)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
propertyId: uuid("property_id").references(() => properties.id, { onDelete: "set null" }),

  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(), // Hashed
  role: text("role").default("staff"), // admin, manager, staff
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 2. Clients (Guests or Corporate entities)
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone").notNull(),
  address: text("address"),
  gstin: text("gstin"), 
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 3. Rooms
export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  number: integer("number").notNull(),
  floor: integer("floor").notNull(),
  status: text("status").$type<"available" | "occupied" | "cleaning" | "maintenance">().default("available"),
  guestName: text("guest_name"),
  checkInTime: timestamp("check_in_time"),
  propertyId: uuid("property_id").references(() => properties.id).notNull(),
},(table) => {
  return {
    // This allows Room 101 to exist in multiple properties, 
    // but prevents duplicate 101s in the SAME property.
    propertyRoomIndex: uniqueIndex("property_room_idx").on(table.propertyId, table.number),
  };
});

// 4. Inquiries (Lead management)
export const inquiries = pgTable("inquiries", {
  id: serial("id").primaryKey(),
  propertyId: uuid("property_id").references(() => properties.id),
  clientId: integer("client_id").references(() => clients.id),
  source: text("source"), 
  message: text("message"),
  status: text("status").default("new"), 
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 5. Tasks (Internal operations)
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  propertyId: uuid("property_id").references(() => properties.id).notNull(),
  title: text("title").notNull(), 
  description: text("description"), 
  status: text("status").default("todo"), 
  roomNumber: integer("room_number"), 
  amount: decimal("amount", { precision: 10, scale: 2 }).default("0.00"), 
  assignedTo: integer("assigned_to").references(() => users.id),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 6. Financial Records (The Day Book)
export const financialRecords = pgTable("financial_records", {
  id: serial("id").primaryKey(),
  propertyId: uuid("property_id").references(() => properties.id).notNull(),
  // Use date() for uniqueness to ensure one record per day
date: date("date").notNull().unique(),  
  // Revenue
  cashRevenue: numeric("cash_revenue", { precision: 12, scale: 2 }).default("0").notNull(),
  upiRevenue: numeric("upi_revenue", { precision: 12, scale: 2 }).default("0").notNull(),
  otaPayouts: numeric("ota_payouts", { precision: 12, scale: 2 }).default("0").notNull(),
  roomRevenue: numeric("room_revenue", { precision: 12, scale: 2 }).default("0").notNull(),
  serviceRevenue: numeric("service_revenue", { precision: 12, scale: 2 }).default("0").notNull(),
  
  // Expenses
  pettyExpenses: numeric("petty_expenses", { precision: 12, scale: 2 }).default("0").notNull(),

  // Totals
  totalCollection: numeric("total_collection", { precision: 12, scale: 2 }).default("0").notNull(),
  netCash: numeric("net_cash", { precision: 12, scale: 2 }).default("0").notNull(),
  
  notes: text("notes"),
  status: recordStatusEnum("status").default("pending"),
  
  userId: integer("user_id").references(() => users.id), 
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 7. Statutory Master
export const statutoryMaster = pgTable("statutory_master", {
  id: serial("id").primaryKey(),
  propertyId: uuid("property_id").references(() => properties.id, { onDelete: "cascade" }),
  licenseName: text("license_name").notNull(),
  authority: text("authority"),
  expiryDate: timestamp("expiry_date"),
  reminderDays: integer("reminder_days").default(30),
  isCritical: boolean("is_critical").default(false),
});

// 8. Documents
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  propertyId: uuid("property_id").references(() => properties.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  url: text("url").notNull(), 
  fileType: text("file_type"),
  relatedType: text("related_type"), 
  relatedId: integer("related_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 9. Invoices
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  propertyId: uuid("property_id").references(() => properties.id),
  roomNumber: integer("room_number"),
  guestName: text("guest_name"),
  totalAmount: integer("total_amount"),
  checkoutDate: timestamp("checkout_date").defaultNow(),
});


// 1. INVENTORY CATEGORIES
// Groups items logically (e.g., "Toiletries", "Safety Equipment", "Electrical Tools")
export const inventoryCategories = pgTable("inventory_categories", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(), // 🌟 CRITICAL: Added for robust application indexing
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 2. MASTER INVENTORY ITEMS
// Airtight tenant isolation via strict propertyId mapping fences
export const inventoryItems = pgTable("inventory_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  propertyId: uuid("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  categoryId: integer("category_id")
    .notNull()
    .references(() => inventoryCategories.id),
  
  name: varchar("name", { length: 255 }).notNull(),
  sku: varchar("sku", { length: 100 }), // Stock Keeping Unit for scannability
  description: text("description"),
  
  // Inventory Nature Flag
  // 'consumable' (Toiletries, Linens) vs 'fixed_asset' (Fire Extinguishers, Tools)
  itemType: varchar("item_type", { length: 30 }).default("consumable").notNull(),
  
  // Stock Levels (Mainly for Consumables)
  currentStock: integer("current_stock").default(0).notNull(),
  minRequiredStock: integer("min_required_stock").default(5).notNull(), // Automated Reorder Point
  unitOfMeasurement: varchar("unit_of_measurement", { length: 50 }).default("pcs").notNull(), // e.g., "bottles", "pcs", "liters"
  
  // Fixed Asset Specific Metadata (Nullable for Consumables)
  serialNumber: varchar("serial_number", { length: 100 }),
  locationInProperty: varchar("location_in_property", { length: 255 }), // e.g., "Floor 2 Corridor", "Main Kitchen"
  lastAuditDate: date("last_audit_date"),
  nextServiceDate: date("next_service_date"), // Critical for Fire Extinguisher pressure checks
  
  status: varchar("status", { length: 50 }).default("active").notNull(), // "active", "damaged", "depleted", "needs_service"
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedBy: integer("updated_by").references(() => users.id),
});

// 3. ASSET MAINTENANCE LOGS
// Tracks service history for fixed assets (e.g., electrical overhauls, extinguisher refilling)
export const assetMaintenance = pgTable("asset_maintenance", {
  id: serial("id").primaryKey(),
  propertyId: uuid("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  itemId: uuid("item_id")
    .notNull()
    .references(() => inventoryItems.id, { onDelete: "cascade" }),
  
  serviceType: varchar("service_type", { length: 100 }).notNull(), // "refill", "repair", "inspection"
  description: text("description").notNull(),
  cost: integer("cost").default(0),
  serviceDate: date("service_date").notNull(),
  performedBy: varchar("performed_by", { length: 255 }), // External vendor or internal staff name
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- RELATIONSHIPS ---

export const usersRelations = relations(users, ({ many }) => ({
  tasks: many(tasks),
  financialEntries: many(financialRecords),
}));

export const financialRecordsRelations = relations(financialRecords, ({ one }) => ({
  author: one(users, {
    fields: [financialRecords.userId],
    references: [users.id],
  }),
  property: one(properties, {
    fields: [financialRecords.propertyId], // The column inside this table
    references: [properties.id],           // The target column in the parent table
  }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  assignee: one(users, {
    fields: [tasks.assignedTo],
    references: [users.id],
  }),
}));

export const inquiriesRelations = relations(inquiries, ({ one }) => ({
  client: one(clients, {
    fields: [inquiries.clientId],
    references: [clients.id],
  }),
}));

export const roomsRelations = relations(rooms, ({ one }) => ({
  property: one(properties, {
    fields: [rooms.propertyId],
    references: [properties.id],
  }),
}));

// 1. INVENTORY CATEGORY RELATIONS
export const inventoryCategoriesRelations = relations(inventoryCategories, ({ many }) => ({
  items: many(inventoryItems),
}));

// 2. MASTER INVENTORY ITEM RELATIONS
export const inventoryItemsRelations = relations(inventoryItems, ({ one, many }) => ({
  // Every item belongs to a specific property (Tenant boundary)
  property: one(properties, {
    fields: [inventoryItems.propertyId],
    references: [properties.id],
  }),
  // Every item maps to a master categorization category hook
  category: one(inventoryCategories, {
    fields: [inventoryItems.categoryId],
    references: [inventoryCategories.id],
  }),
  // Every item tracked can have multiple historical service audits logged
  maintenanceLogs: many(assetMaintenance),
  // Optional: Tracks the last staff profile identity that modified this row cell
  modifier: one(users, {
    fields: [inventoryItems.updatedBy],
    references: [users.id],
  }),
}));

// 3. ASSET MAINTENANCE LOG RELATIONS
export const assetMaintenanceRelations = relations(assetMaintenance, ({ one }) => ({
  // Logs belong to the overarching property context container boundary
  property: one(properties, {
    fields: [assetMaintenance.propertyId],
    references: [properties.id],
  }),
  // Logs point back directly to the targeted physical capital asset piece row
  item: one(inventoryItems, {
    fields: [assetMaintenance.itemId],
    references: [inventoryItems.id],
  }),
}));