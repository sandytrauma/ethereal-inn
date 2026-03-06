"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { encrypt } from "../auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

/**
 * Handles Staff and Admin Login
 * Note: redirect() throws a NEXT_REDIRECT error which is caught 
 * internally by Next.js. We keep it outside the try/catch block.
 */
export async function loginUser(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Early validation
  if (!email || !password) {
    return { error: "Please enter both email and password." };
  }

  let success = false;

  try {
    // 1. Fetch user from Drizzle
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()));

    if (!user) {
      return { error: "Account not found." };
    }

    // 2. Verify Password with bcrypt
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return { error: "Incorrect password. Please try again." };
    }

    // 3. Create Session Payload
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 Hours
    const session = await encrypt({ 
      userId: user.id, 
      role: user.role,
      name: user.name 
    });

    // 4. Set Secure Cookie
    const cookieStore = await cookies();
    cookieStore.set("auth-token", session, { 
      expires, 
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production",
      sameSite: 'lax',
      path: '/',
      priority: 'high' // Ensures the redirect picks up the cookie immediately
    });

    success = true;
  } catch (e) {
    console.error("Login Server Error:", e);
    return { error: "A server error occurred. Please try again." };
  }

  // 5. Final Redirect
  if (success) {
    // Ensure this matches your protected route (usually "/" or "/dashboard")
    redirect("/"); 
  }
}

/**
 * Clears session and redirects to public landing
 */
export async function logout() {
  const cookieStore = await cookies();
  
  // Clear the cookie by setting expiration to past
  cookieStore.set("auth-token", "", { 
    expires: new Date(0),
    path: '/' 
  });
  
  redirect("/login");
}