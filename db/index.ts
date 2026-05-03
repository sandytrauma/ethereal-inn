import { neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from './schema'; // Main schema (rooms, tasks, etc.)
import * as microSchema from "./micro-schema"; // Micro schema (properties)

if (typeof window === 'undefined') {
  neonConfig.webSocketConstructor = ws;
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * FIX: Spread both schemas into the config.
 * This allows 'db.query' to find the 'referencedTable' for relations.
 */
export const db = drizzle(pool, { 
  schema: { ...schema, ...microSchema } 
});