import { sql } from "drizzle-orm";

export function logQuery(query: any) {
  console.log("DEBUG_QUERY:", query.sql || query);
}