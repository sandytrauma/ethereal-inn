import { neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';

// This allows the serverless driver to work in Node.js environments
if (typeof window === 'undefined') {
  neonConfig.webSocketConstructor = ws;
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const db = drizzle(pool);