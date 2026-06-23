import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

export default defineConfig({
  // 🌟 FIX 1: Add the path to the culinary schema file
  schema: [
    "./db/schema.ts", 
    "./db/micro-schema.ts", 
    "./db/glam-schema.ts",
    "./db/schema/culinary.ts" // Added this path
  ],
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // 🌟 FIX 2: Explicitly include 'culinary' in the schemaFilter array
  schemaFilter: ["public", "glam", "culinary"],
});