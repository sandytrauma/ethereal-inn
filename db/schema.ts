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
  date
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
  gstin: text("gstin"), 
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 3. Rooms
export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  number: integer("number").notNull().unique(),
  floor: integer("floor").notNull(),
  status: text("status").$type<"available" | "occupied" | "cleaning" | "maintenance">().default("available"),
  guestName: text("guest_name"),
  checkInTime: timestamp("check_in_time"),
});

// 4. Inquiries (Lead management)
export const inquiries = pgTable("inquiries", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id),
  source: text("source"), 
  message: text("message"),
  status: text("status").default("new"), 
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 5. Tasks (Internal operations)
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
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
});

// 7. Statutory Master
export const statutoryMaster = pgTable("statutory_master", {
  id: serial("id").primaryKey(),
  licenseName: text("license_name").notNull(),
  authority: text("authority"),
  expiryDate: timestamp("expiry_date"),
  reminderDays: integer("reminder_days").default(30),
  isCritical: boolean("is_critical").default(false),
});

// 8. Documents
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
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
  roomNumber: integer("room_number"),
  guestName: text("guest_name"),
  totalAmount: integer("total_amount"),
  checkoutDate: timestamp("checkout_date").defaultNow(),
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