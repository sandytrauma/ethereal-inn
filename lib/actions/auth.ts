"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { encrypt } from "../auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation"; // Added for routing
import bcrypt from "bcryptjs";

export async function loginUser(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // We'll store the redirect path here to avoid calling redirect inside a try/catch
  let success = false;

  try {
    // 1. Fetch user from Drizzle
    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) return { error: "User not found" };

    // 2. Check Password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) return { error: "Invalid password" };

    // 3. Create Session
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const session = await encrypt({ 
      userId: user.id, 
      role: user.role,
      name: user.name // Added name for the dashboard UI
    });

    // 4. Set Cookie
    const cookieStore = await cookies();
    cookieStore.set("auth-token", session, { 
      expires, 
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production",
      sameSite: 'lax',
      path: '/' // Ensure cookie is available globally
    });

    success = true;
  } catch (e) {
    console.error("Login Error:", e);
    return { error: "Authentication failed. Please try again." };
  }

  // Next.js redirect must be called outside of the try/catch block
  if (success) {
    redirect("/"); // Or "/dashboard" depending on your setup
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.set("auth-token", "", { expires: new Date(0) });
  redirect("/login");
}