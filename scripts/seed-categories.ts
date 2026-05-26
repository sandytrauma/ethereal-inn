// scripts/seed-categories.ts
import dotenv from "dotenv";
import path from "path";

// 🌟 STEP 1: Immediately pull configuration parameters before anything else evaluates
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { inventoryCategories } from "@/db/schema";
import { sql } from "drizzle-orm";

const masterCategories = [
  {
    slug: "toiletries-amenities",
    name: "Toiletries & Guest Amenities",
    description: "Personal care cosmetics, guest soaps, dental packs, premium vanity kits, and bathroom disposables.",
  },
  {
    slug: "housekeeping-laundry",
    name: "Housekeeping & Laundry Tools",
    description: "Industrial cleaning concentrates, vacuum maintenance filters, sanitation mops, and linen replenishment stock.",
  },
  {
    slug: "fire-safety",
    name: "Fire, Health & Safety Equipment",
    description: "ABC Dry chemical cylinders, smoke alarm sensors, fire axes, emergency signage, and first-aid response assets.",
  },
  {
    slug: "electrical-power",
    name: "Electrical & Power Infrastructure",
    description: "LED lighting fixtures, miniature circuit breakers (MCBs), electrical conduit tools, and backup generator service cells.",
  },
  {
    slug: "mechanical-hardware",
    name: "Mechanical, Plumbing & Hardware",
    description: "Power drills, high-torque wrenches, plumbing valves, replacement security lock cylinders, and structural hardware.",
  },
];

async function main() {
  try {
    console.log("⚡ Initializing master inventory category synchronization pass...");

    // 🌟 STEP 2: Dynamically load your DB module *after* variables are securely hydrated in memory!
    const { db } = await import("@/db");

    await db
      .insert(inventoryCategories)
      .values(masterCategories)
      .onConflictDoUpdate({
        target: inventoryCategories.slug,
        set: {
          name: sql`EXCLUDED.name`,
          description: sql`EXCLUDED.description`,
        },
      });

    console.log("✔ Global inventory categories synchronized cleanly.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Critical Failure executing category schema seed operation:", error);
    process.exit(1);
  }
}

main();