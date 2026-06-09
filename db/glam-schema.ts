// db/glam-schema.ts
import { 
  pgSchema, serial, integer, text, timestamp, 
  boolean, decimal, date, uuid, varchar
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// =========================================================================
// 🔮 INITIALIZE THE DETACHED SALON SCHEMA NAMESPACE
// =========================================================================
export const glamSchema = pgSchema("glam");

// --- LIFECYCLE ENUMS (ENTIRELY INTERNAL TO GLAM) ---
export const appointmentStatusEnum = glamSchema.enum("appointment_status", [
  "scheduled", "active_service", "completed", "no_show", "cancelled"
]);

export const staffSpecialtyEnum = glamSchema.enum("staff_specialty", [
  "bridal_artistry", "couture_styling", "aesthetic_procedures", "general_hair_skin"
]);

export const businessTierEnum = glamSchema.enum("business_tier", [
  "trial", "basic_single", "growth_multi", "enterprise_infinity"
]);

export const inventoryAlertEnum = glamSchema.enum("inventory_alert", [
  "good", "low_stock", "critical_empty"
]);

export const assetCategoryEnum = glamSchema.enum("asset_category", [
  "consumable", "fixed_asset"
]);



// =========================================================================
// 1. SAAS TENANTS (The Master Salon Business Accounts)
// =========================================================================
// Represents the business owner who purchases a subscription/rental plan
export const salonTenants = glamSchema.table("salon_tenants", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerName: varchar("owner_name", { length: 255 }).notNull(),
  ownerEmail: varchar("owner_email", { length: 255 }).notNull().unique(),
  ownerPassword: text("owner_password").notNull(), // Hashed auth token password
  businessName: varchar("business_name", { length: 255 }).notNull(),
  tier: businessTierEnum("tier").default("trial").notNull(),
  subscriptionStatus: varchar("subscription_status", { length: 50 }).default("active").notNull(), // "active", "suspended"
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  maxAllowedOutlets: integer("max_allowed_outlets").default(1).notNull(), 
  subscriptionValidUntil: timestamp("subscription_valid_until").notNull(),
  brandLogoUrl: text("brand_logo_url"),
brandBannerUrl: text("brand_banner_url"),
brandBio: text("brand_bio"),
brandMetaTitle: varchar("brand_meta_title", { length: 255 }),
brandMetaDescription: text("brand_meta_description"),
googleAnalyticsId: varchar("google_analytics_id", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// =========================================================================
// 2. SALON OUTLETS (Multi-Location Management Anchor)
// =========================================================================
// Replaces hotel properties completely. Salon owners can spin up 1 or many locations here.
export const salonOutlets = glamSchema.table("salon_outlets", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => salonTenants.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(), // e.g., "Ethereal Glam - GK2 Outlet"
  address: text("address").notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  taxRegistrationNumber: varchar("tax_registration_number", { length: 100 }), // GSTIN
  latitude: decimal("latitude", { precision: 10, scale: 7 }),  // e.g., 25.4489000
  longitude: decimal("longitude", { precision: 10, scale: 7 }), // e.g., 81.8212000
  operatingHoursOpen: varchar("operating_hours_open", { length: 10 }).default("09:00").notNull(),
  operatingHoursClose: varchar("operating_hours_close", { length: 10 }).default("21:00").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// =========================================================================
// 3. SALON USERS & OPERATORS (Staff, Managers, Receptionists)
// =========================================================================
export const salonStaff = glamSchema.table("salon_staff", {
  id: serial("id").primaryKey(),
  tenantId: uuid("tenant_id").references(() => salonTenants.id, { onDelete: "cascade" }).notNull(),
  currentOutletId: uuid("current_outlet_id").references(() => salonOutlets.id, { onDelete: "set null" }), // Allows stylists to float between branches
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).default("stylist").notNull(), // "manager", "receptionist", "stylist"
  specialty: staffSpecialtyEnum("specialty").default("general_hair_skin").notNull(),
  isAvailable: boolean("is_available").default(true).notNull(),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("5.00"),
});

// Roster Engine for tracking working shifts and leaves
export const salonStaffShifts = glamSchema.table("salon_staff_shifts", {
  id: serial("id").primaryKey(),
  staffId: integer("staff_id").references(() => salonStaff.id, { onDelete: "cascade" }).notNull(),
  outletId: uuid("outlet_id").references(() => salonOutlets.id, { onDelete: "cascade" }).notNull(),
  shiftDate: date("shift_date").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  isOnLeave: boolean("is_on_leave").default(false).notNull(),
});

// =========================================================================
// 4. SALON CLIENTS DIRECTORY (Isolated Customer Records per Tenant)
// =========================================================================
export const salonClients = glamSchema.table("salon_clients", {
  id: serial("id").primaryKey(),
  tenantId: uuid("tenant_id").references(() => salonTenants.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }).notNull(),
  skinTypeSensitivities: text("skin_type_sensitivities"), // Value-add for luxury salons
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// =========================================================================
// 5. SALON SERVICES CATALOGUE (Treatment Pricing Matrix)
// =========================================================================
export const salonServices = glamSchema.table("salon_services", {
  id: serial("id").primaryKey(),
  tenantId: uuid("tenant_id").references(() => salonTenants.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(), 
  slug: varchar("slug", { length: 100 }).notNull(),
  description: text("description"),
  durationMinutes: integer("duration_minutes").default(60).notNull(), // Vital for fractional calendar math
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  isAestheticProcedure: boolean("is_aesthetic_procedure").default(false).notNull(), 
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// =========================================================================
// 6. RESOURCE MANAGEMENT (Service Chairs, Massage Beds, Special Equipment)
// =========================================================================
export const salonResources = glamSchema.table("salon_resources", {
  id: serial("id").primaryKey(),
  outletId: uuid("outlet_id").references(() => salonOutlets.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 100 }).notNull(), // e.g., "Aesthetics Bed Alpha", "Nail Station 1"
  resourceType: varchar("resource_type", { length: 100 }).notNull(), 
  status: varchar("status", { length: 50 }).default("operational").notNull(), 
});

// =========================================================================
// 7. APPOINTMENTS TIMELINE ENGINE (With Advanced Token Generation)
// =========================================================================
export const salonAppointments = glamSchema.table("salon_appointments", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => salonTenants.id, { onDelete: "cascade" }).notNull(),
  outletId: uuid("outlet_id").references(() => salonOutlets.id, { onDelete: "cascade" }).notNull(),
  clientId: integer("client_id").references(() => salonClients.id, { onDelete: "cascade" }).notNull(),
  staffId: integer("staff_id").references(() => salonStaff.id, { onDelete: "set null" }),
  resourceId: integer("resource_id").references(() => salonResources.id, { onDelete: "set null" }),
  
  tokenNumber: varchar("token_number", { length: 50 }).notNull(), // Dynamic sequence generation e.g., "GLAM-DWK-024"
  appointmentDate: date("appointment_date").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  
  status: appointmentStatusEnum("status").default("scheduled").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Support booking multiple treatments inside a single appointment timeline transaction basket
export const appointmentServicesBridge = glamSchema.table("appointment_services_bridge", {
  id: serial("id").primaryKey(),
  appointmentId: uuid("appointment_id").references(() => salonAppointments.id, { onDelete: "cascade" }).notNull(),
  serviceId: integer("service_id").references(() => salonServices.id, { onDelete: "cascade" }).notNull(),
});

// Link products to services (e.g., "Airbrush Makeup" service uses "Foundation" + "Primer" products)
export const serviceProductsBridge = glamSchema.table("service_products_bridge", {
  id: serial("id").primaryKey(),
  tenantId: uuid("tenant_id").references(() => salonTenants.id, { onDelete: "cascade" }).notNull(),
  serviceId: integer("service_id").references(() => salonServices.id, { onDelete: "cascade" }).notNull(),
  productId: integer("product_id").references(() => salonProductsStock.id, { onDelete: "cascade" }).notNull(),
  defaultUsageVolume: integer("default_usage_volume").notNull(), // Default ml/grams to deduct
});

// =========================================================================
// 8. SALON CONSUMABLES MATERIAL STOCK & PRODUCT CONSUMPTION LOGS
// =========================================================================
export const salonProductsStock = glamSchema.table("salon_products_stock", {
  id: serial("id").primaryKey(),
  tenantId: uuid("tenant_id").references(() => salonTenants.id, { onDelete: "cascade" }).notNull(),
  outletId: uuid("outlet_id").references(() => salonOutlets.id, { onDelete: "cascade" }).notNull(),
  productName: varchar("product_name", { length: 255 }).notNull(),
  sku: varchar("sku", { length: 100 }),
  currentVolumeMlGrams: integer("current_volume_ml_grams").notNull(),
  alertLevel: inventoryAlertEnum("alert_level").default("good").notNull(),
  // 🌟 ADDED: Dynamic threshold to clear Server Action compilation errors
  alertThreshold: integer("alert_threshold").default(100).notNull(),
  // 🌟 ADDED: Financial tracking variables mapped as decimal strings to match product modals
 
  assetCategory: assetCategoryEnum("asset_category").default("consumable").notNull(),
  unitType: varchar("unit_type", { length: 20 }).default("ml").notNull(),
  
  purchasePrice: decimal("purchase_price", { precision: 10, scale: 2 }).default("0.00").notNull(),
  retailPrice: decimal("retail_price", { precision: 10, scale: 2 }).default("0.00").notNull(),
});

export const salonProductConsumptionLogs = glamSchema.table("salon_product_consumption_logs", {
  id: serial("id").primaryKey(),
  appointmentId: uuid("appointment_id").references(() => salonAppointments.id, { onDelete: "cascade" }).notNull(),
  productId: integer("product_id").references(() => salonProductsStock.id, { onDelete: "cascade" }).notNull(),
  consumedVolume: integer("consumed_volume").notNull(), // Tracks precise usage costs per appointment execution
  loggedAt: timestamp("logged_at").defaultNow().notNull(),
});


// =========================================================================
// 🔒 ISOLATED SAAS SALON AUTHENTICATION USERS
// =========================================================================
// Ensures hotel credentials fail completely on salon gateway routes
export const salonAuthUsers = glamSchema.table("salon_auth_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => salonTenants.id, { onDelete: "cascade" }).notNull(),
  outletId: uuid("outlet_id").references(() => salonOutlets.id, { onDelete: "set null" }), // Nullable for cross-outlet Managers/Admins
  
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(), // Unique constraint handles scoped validation logic
  passwordHash: text("password_hash").notNull(), 
  
  role: varchar("role", { length: 50 }).default("stylist").notNull(), // "tenant_admin", "branch_manager", "receptionist", "stylist"
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const salonQueueTokens = glamSchema.table("salon_queue_tokens", {
  id: serial("id").primaryKey(),
  // 🌟 UPDATE: Changed from integer() to uuid()
  tenantId: uuid("tenant_id").references(() => salonTenants.id, { onDelete: "cascade" }).notNull(),
  outletId: uuid("outlet_id").references(() => salonOutlets.id, { onDelete: "cascade" }).notNull(),
  tokenNumber: integer("token_number").notNull(),
  clientName: varchar("client_name", { length: 255 }),
  status: varchar("status", { length: 50 }).default("waiting").notNull(), 
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Update salonAuthUsers relations in your relations matrix blocks down below
export const salonAuthUsersRelations = relations(salonAuthUsers, ({ one }) => ({
  tenant: one(salonTenants, { fields: [salonAuthUsers.tenantId], references: [salonTenants.id] }),
  outlet: one(salonOutlets, { fields: [salonAuthUsers.outletId], references: [salonOutlets.id] }),
}));


// =========================================================================
// 🔗 IN-MEMORY DRIZZLE REAL RELATION MATCHERS
// =========================================================================
export const salonTenantsRelations = relations(salonTenants, ({ many }) => ({
  outlets: many(salonOutlets),
 services: many(salonServices, { relationName: "tenant_to_services_bridge" }),
  staff: many(salonStaff),
  clients: many(salonClients),
  appointments: many(salonAppointments),
  queueTokens: many(salonQueueTokens),
}));

export const salonOutletsRelations = relations(salonOutlets, ({ one, many }) => ({
  tenant: one(salonTenants, { fields: [salonOutlets.tenantId], references: [salonTenants.id] }),
  staff: many(salonStaff),
  shifts: many(salonStaffShifts),
  resources: many(salonResources),
  appointments: many(salonAppointments),
  stock: many(salonProductsStock),
  queueTokens: many(salonQueueTokens),
}));

export const salonServicesRelations = relations(salonServices, ({ one, many }) => ({
  appointments: many(appointmentServicesBridge),
 tenant: one(salonTenants, {
    fields: [salonServices.tenantId],
    references: [salonTenants.id],
    relationName: "tenant_to_services_bridge",
  }),
}));

export const salonStaffRelations = relations(salonStaff, ({ one, many }) => ({
  tenant: one(salonTenants, { fields: [salonStaff.tenantId], references: [salonTenants.id] }),
  outlet: one(salonOutlets, { fields: [salonStaff.currentOutletId], references: [salonOutlets.id] }),
  shifts: many(salonStaffShifts),
  appointments: many(salonAppointments),
}));

export const salonStaffShiftsRelations = relations(salonStaffShifts, ({ one }) => ({
  staff: one(salonStaff, { fields: [salonStaffShifts.staffId], references: [salonStaff.id] }),
  outlet: one(salonOutlets, { fields: [salonStaffShifts.outletId], references: [salonOutlets.id] }),
}));

export const salonClientsRelations = relations(salonClients, ({ one, many }) => ({
  tenant: one(salonTenants, { fields: [salonClients.tenantId], references: [salonTenants.id] }),
  appointments: many(salonAppointments),
}));

export const salonResourcesRelations = relations(salonResources, ({ one, many }) => ({
  outlet: one(salonOutlets, { fields: [salonResources.outletId], references: [salonOutlets.id] }),
  appointments: many(salonAppointments),
}));

export const salonAppointmentsRelations = relations(salonAppointments, ({ one, many }) => ({
  tenant: one(salonTenants, { fields: [salonAppointments.tenantId], references: [salonTenants.id] }),
  outlet: one(salonOutlets, { fields: [salonAppointments.outletId], references: [salonOutlets.id] }),
  client: one(salonClients, { fields: [salonAppointments.clientId], references: [salonClients.id] }),
  staff: one(salonStaff, { fields: [salonAppointments.staffId], references: [salonStaff.id] }),
  resource: one(salonResources, { fields: [salonAppointments.resourceId], references: [salonResources.id] }),
  services: many(appointmentServicesBridge),
  productConsumptions: many(salonProductConsumptionLogs),
}));

export const appointmentServicesBridgeRelations = relations(appointmentServicesBridge, ({ one }) => ({
  appointment: one(salonAppointments, { fields: [appointmentServicesBridge.appointmentId], references: [salonAppointments.id] }),
  service: one(salonServices, { fields: [appointmentServicesBridge.serviceId], references: [salonServices.id] }),
}));

export const serviceProductsBridgeRelations = relations(serviceProductsBridge, ({ one }) => ({
  tenant: one(salonTenants, { fields: [serviceProductsBridge.tenantId], references: [salonTenants.id] }),
  service: one(salonServices, { fields: [serviceProductsBridge.serviceId], references: [salonServices.id] }),
  product: one(salonProductsStock, { fields: [serviceProductsBridge.productId], references: [salonProductsStock.id] }),
}));

export const salonProductsStockRelations = relations(salonProductsStock, ({ one, many }) => ({
  tenant: one(salonTenants, { fields: [salonProductsStock.tenantId], references: [salonTenants.id] }),
  outlet: one(salonOutlets, { fields: [salonProductsStock.outletId], references: [salonOutlets.id] }),
  consumptionLogs: many(salonProductConsumptionLogs),
}));

export const salonProductConsumptionLogsRelations = relations(salonProductConsumptionLogs, ({ one }) => ({
  appointment: one(salonAppointments, { fields: [salonProductConsumptionLogs.appointmentId], references: [salonAppointments.id] }),
  product: one(salonProductsStock, { fields: [salonProductConsumptionLogs.productId], references: [salonProductsStock.id] }),
}));

export const salonQueueTokensRelations = relations(salonQueueTokens, ({ one }) => ({
  tenant: one(salonTenants, { fields: [salonQueueTokens.tenantId], references: [salonTenants.id] }),
  outlet: one(salonOutlets, { fields: [salonQueueTokens.outletId], references: [salonOutlets.id] }),
}));