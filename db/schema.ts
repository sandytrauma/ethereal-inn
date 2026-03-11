import { 
  pgTable, 
  serial, 
  integer, 
  text, 
  timestamp, 
  numeric, 
  pgEnum, 
  boolean, 
  decimal
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// --- ENUMS ---
export const recordStatusEnum = pgEnum("record_status", ["pending", "deposited", "reconciled"]);
export const taskStatusEnum = pgEnum("task_status", ["todo", "in_progress", "completed", "backlog"]);

// --- TABLES ---

// 1. Users (Staff & Admin)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
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
  gstin: text("gstin"), // For corporate billing
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 3. Inquiries (Lead management)
export const inquiries = pgTable("inquiries", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id),
  source: text("source"), // e.g., Direct, MMT, Booking.com
  message: text("message"),
  status: text("status").default("new"), // new, followed_up, closed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 4. Tasks (Internal operations)
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(), // e.g., "Checkout: Room 101"
  description: text("description"), // e.g., "Guest: John Doe"
  status: text("status").default("todo"), // Or your taskStatusEnum
  
  // New Reconciliation Fields
  roomNumber: integer("room_number"), // Ties the task to the specific unit
  amount: decimal("amount", { precision: 10, scale: 2 }).default("0.00"), // Stores checkout revenue
  
  assignedTo: integer("assigned_to").references(() => users.id),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 5. Statutory Master (Compliance, Licenses, Tax rules)
export const statutoryMaster = pgTable("statutory_master", {
  id: serial("id").primaryKey(),
  licenseName: text("license_name").notNull(),
  authority: text("authority"),
  expiryDate: timestamp("expiry_date"),
  reminderDays: integer("reminder_days").default(30),
  isCritical: boolean("is_critical").default(false),
});

// 6. Documents (Storage for bills, licenses, IDs)
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(), // S3 or Uploadthing URL
  fileType: text("file_type"),
  relatedType: text("related_type"), // e.g., 'task', 'client', 'financial_record'
  relatedId: integer("related_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 7. Financial Records (The Day Book)
// ... (keep your existing imports and other tables)

export const financialRecords = pgTable("financial_records", {
  id: serial("id").primaryKey(),
date: timestamp("date").defaultNow().notNull().unique(),  
  // Revenue
  cashRevenue: numeric("cash_revenue", { precision: 12, scale: 2 }).default("0").notNull(),
  upiRevenue: numeric("upi_revenue", { precision: 12, scale: 2 }).default("0").notNull(),
  otaPayouts: numeric("ota_payouts", { precision: 12, scale: 2 }).default("0").notNull(),
  
  // Expenses
  pettyExpenses: numeric("petty_expenses", { precision: 12, scale: 2 }).default("0").notNull(),

  roomRevenue: numeric("room_revenue", { precision: 12, scale: 2 }).default("0").notNull(),
  serviceRevenue: numeric("service_revenue", { precision: 12, scale: 2 }).default("0").notNull(),
  
  // Totals
  totalCollection: numeric("total_collection", { precision: 12, scale: 2 }).default("0").notNull(),
  netCash: numeric("net_cash", { precision: 12, scale: 2 }).default("0").notNull(),
  
  notes: text("notes"),
  status: recordStatusEnum("status").default("pending"),
  
  // UPDATED: Changed createdById to userId for simpler joins in server actions
  userId: integer("user_id").references(() => users.id), 
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- RELATIONSHIPS UPDATE ---

export const usersRelations = relations(users, ({ many }) => ({
  tasks: many(tasks),
  financialEntries: many(financialRecords),
}));

export const financialRecordsRelations = relations(financialRecords, ({ one }) => ({
  author: one(users, {
    fields: [financialRecords.userId], // Updated reference
    references: [users.id],
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

export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  number: integer("number").notNull().unique(),
  floor: integer("floor").notNull(),
  status: text("status").$type<"available" | "occupied" | "cleaning" | "maintenance">().default("available"),
  guestName: text("guest_name"),
  checkInTime: timestamp("check_in_time"),
});

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  roomNumber: integer("room_number"),
  guestName: text("guest_name"),
  totalAmount: integer("total_amount"),
  checkoutDate: timestamp("checkout_date").defaultNow(),
});