// lib/actions/salon-tokens.ts
"use server";

import { db } from "@/db";
import { salonQueueTokens } from "@/db/glam-schema";
import { getSalonSession } from "@/lib/salon-token";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function issueWalkInQueueToken(clientName: string) {
  const session = await getSalonSession();
  if (!session) return { success: false, error: "Authentication credentials expired." };

  const tenantIdStr = String(session.tenantId);
  const outletIdStr = String(session.outletId);

  // 🕒 Define explicit time envelopes for today's operational window (00:00:00 to 23:59:59)
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  try {
    // 🧮 Natively extract the highest token number issued strictly TODAY
    const [maxResult] = await db
      .select({ maxToken: sql<number>`max(${salonQueueTokens.tokenNumber})` })
      .from(salonQueueTokens)
      .where(
        and(
          eq(salonQueueTokens.tenantId, tenantIdStr),
          eq(salonQueueTokens.outletId, outletIdStr),
          // 🌟 THE PRODUCTION FIX: Restrict the lookup window to today's date bounds
          gte(salonQueueTokens.createdAt, startOfDay),
          lte(salonQueueTokens.createdAt, endOfDay)
        )
      );

    const nextTokenNum = (maxResult?.maxToken ?? 0) + 1;

    // 📝 Insert the clean queue token record into Neon PostgreSQL
    await db.insert(salonQueueTokens).values({
      tenantId: tenantIdStr,
      outletId: outletIdStr,
      tokenNumber: nextTokenNum,
      clientName: clientName?.trim() || "Walk-In Customer",
      status: "waiting", 
    });

    // 🌟 THE PRODUCTION FIX: Synchronize both data panels simultaneously
    revalidatePath("/glam/dashboard");
    revalidatePath("/glam/queue");
    
    return { success: true, message: `Token issued successfully! Position assigned: TKN-${String(nextTokenNum).padStart(3, "0")}` };
  } catch (error: any) {
    console.error("Token Generation Failure Exception:", error.message);
    return { success: false, error: error.message || "Failed to generate sequence token." };
  }
}