// lib/actions/salon-logout.ts
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Destroys the active session token and safely bounces the user to the landing page
 */
export async function logoutSalonOperator() {
  const cookieStore = await cookies();
  
  // Delete the core session cookie namespace cleanly
  cookieStore.delete("auth-token");
  
  // 🚀 Direct standard redirect pass straight to the public landing page route
  redirect("/glam");
}