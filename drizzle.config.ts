// drizzle.config.ts
import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

export default defineConfig({
  // 🌟 FIX 1: Provide an explicit array path pattern for all your schema segments
  schema: ["./db/schema.ts", "./db/micro-schema.ts", "./db/glam-schema.ts"],
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // 🌟 FIX 2: Explicitly authorize Drizzle Kit to create and manage the custom 'glam' schema namespace
  schemaFilter: ["public", "glam"],
});