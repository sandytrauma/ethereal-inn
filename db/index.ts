import { neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from './schema'; // IMPORT YOUR SCHEMA HERE

if (typeof window === 'undefined') {
  neonConfig.webSocketConstructor = ws;
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Pass the schema object as the second argument to enable db.query
export const db = drizzle(pool, { schema });