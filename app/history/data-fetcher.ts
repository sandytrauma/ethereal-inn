import { db } from "@/db"; // Path to your drizzle db instance
import { invoices } from "@/db/schema"; // Path to your schema
import { desc } from "drizzle-orm";

export async function getCheckoutHistory() {
  try {
    // This fetches the actual records from your 'invoices' table
    const data = await db
      .select()
      .from(invoices)
      .orderBy(desc(invoices.checkoutDate));
    
    return data;
  } catch (error) {
    console.error("Database Error:", error);
    return [];
  }
}