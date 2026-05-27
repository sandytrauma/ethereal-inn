import { neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from './schema'; // Main schema (rooms, tasks, etc.)
import * as microSchema from "./micro-schema"; // Micro schema (properties)
import * as glamSchema from "./glam-schema"; // 🌟 NEW: Detached Salon SaaS Schema

if (typeof window === 'undefined') {
  neonConfig.webSocketConstructor = ws;
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * FIX: Spread all three schemas into the configuration object.
 * This flattens the tables and exposes 'salonAuthUsers' to the 'db.query' engine.
 */
export const db = drizzle(pool, { 
  schema: { 
    ...schema, 
    ...microSchema, 
    ...glamSchema // 🌟 Spread completely flat on the root level
  } 
});