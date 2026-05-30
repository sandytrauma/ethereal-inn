// lib/actions/salon-logout.ts
"use server";

import { destroySalonSession } from "@/lib/salon-token";
import { redirect } from "next/navigation";

/**
 * Destroys the active session token vault and safely redirects the user to the gateway entry point
 */
export async function logoutSalonOperator() {
  // 1. Core security wipe: Clears out 'salon_session_token' explicitly
  await destroySalonSession();
  
  // 🚀 Direct redirect pass straight back to the centralized glam login layout portal
  redirect("/glam/login");
}