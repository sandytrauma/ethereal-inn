import { neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from './schema'; // Main schema
import * as microSchema from "./micro-schema"; // Micro schema
import * as glamSchema from "./glam-schema"; // Salon SaaS Schema
import * as culinarySchema from "./schema/culinary"; // 🌟 ADDED: Culinary Schema

if (typeof window === 'undefined') {
  neonConfig.webSocketConstructor = ws;
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL,
  max: 10
 });


pool.on('connect', (client: any) => {
  // This allows the connection to see both the dynamic schema (set by middleware)
  // and the 'public' schema where your core tables live.
  client.query('SET search_path TO ');
});

/**
 * UPDATED: Added culinarySchema to the global DB object.
 * This exposes 'culinary.outlets' to the db.select() engine.
 */
export const db = drizzle(pool, { 
  schema: { 
    ...schema, 
    ...microSchema, 
    ...glamSchema,
    ...culinarySchema // 🌟 Spread added here
  } 
});