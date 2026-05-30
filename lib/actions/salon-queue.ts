// lib/actions/salon-queue.ts
"use server";

import { db } from "@/db";
import { salonQueueTokens } from "@/db/glam-schema";
import { getSalonSession } from "@/lib/salon-token";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * 🎟️ Dispenses a brand new walk-in token for today's sequence
 */
export async function issueWalkInQueueToken(clientName: string) {
  const session = await getSalonSession();
  if (!session) return { success: false, error: "Authentication credentials expired." };

  const tenantIdStr = String(session.tenantId);
  const outletIdStr = String(session.outletId);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  try {
    const [maxResult] = await db
      .select({ maxToken: sql<number>`max(${salonQueueTokens.tokenNumber})` })
      .from(salonQueueTokens)
      .where(
        and(
          eq(salonQueueTokens.tenantId, tenantIdStr),
          eq(salonQueueTokens.outletId, outletIdStr),
          gte(salonQueueTokens.createdAt, startOfDay),
          lte(salonQueueTokens.createdAt, endOfDay)
        )
      );

    const nextTokenNum = (maxResult?.maxToken ?? 0) + 1;

    await db.insert(salonQueueTokens).values({
      tenantId: tenantIdStr,
      outletId: outletIdStr,
      tokenNumber: nextTokenNum,
      clientName: clientName?.trim() || "Walk-In Customer",
      status: "waiting",
    });

    revalidatePath("/glam/dashboard");
    revalidatePath("/glam/queue");
    
    return { success: true, message: `Token issued successfully! Position: TKN-${String(nextTokenNum).padStart(3, "0")}` };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to generate sequence token." };
  }
}

/**
 * ⚡ Transitions a waiting token to an active styling chair
 */
export async function transitionTokenToServing(tokenId: string) {
  const session = await getSalonSession();
  if (!session) return { success: false, error: "Authentication expired." };

  const tenantIdStr = String(session.tenantId);
  const outletIdStr = String(session.outletId);

  try {
    await db
      .update(salonQueueTokens)
      .set({ status: "serving" })
      .where(
        and(
          eq(salonQueueTokens.id, parseInt(tokenId, 10)),
          eq(salonQueueTokens.tenantId, tenantIdStr),
          eq(salonQueueTokens.outletId, outletIdStr)
        )
      );

    revalidatePath("/glam/queue");
    revalidatePath("/glam/dashboard");
    
    return { success: true, message: "Client called to chair successfully." };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update queue status." };
  }
}

/**
 * 🏁 Concludes a queue token lifecycle once service completes
 */
export async function completeQueueService(tokenId: string) {
  const session = await getSalonSession();
  if (!session) return { success: false, error: "Authentication expired." };

  const tenantIdStr = String(session.tenantId);
  const outletIdStr = String(session.outletId);

  try {
    await db
      .update(salonQueueTokens)
      .set({ status: "completed" })
      .where(
        and(
          eq(salonQueueTokens.id, parseInt(tokenId, 10)),
          eq(salonQueueTokens.tenantId, tenantIdStr),
          eq(salonQueueTokens.outletId, outletIdStr)
        )
      );

    revalidatePath("/glam/queue");
    revalidatePath("/glam/dashboard");
    
    return { success: true, message: "Queue entry service finalized cleanly." };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to complete queue item." };
  }
}