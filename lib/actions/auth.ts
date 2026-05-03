"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { encrypt, getSession, setSession } from "../auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";


/**
 * Handles Staff and Admin Login
 * Injects the propertyId UUID into the JWT session for global data filtering.
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

    // 3. Create Session Payload (CRITICAL: passing propertyId for operational context)
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 Hours
    const session = await encrypt({ 
      userId: user.id, 
      role: user.role,
      name: user.name,
      propertyId: user.propertyId 
    });

    // 4. Set Secure Cookie
    const cookieStore = await cookies();
    cookieStore.set("auth-token", session, { 
      expires, 
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production",
      sameSite: 'lax',
      path: '/',
      priority: 'high' 
    });

    success = true;
  } catch (e) {
    console.error("Login Server Error:", e);
    return { error: "A server error occurred. Please try again." };
  }

  // 5. Final Redirect
  if (success) {
    redirect("/"); 
  }
}

/**
 * UPDATED: Allows Designated Partners to switch between hotels
 * Uses custom getSession and encrypt instead of NextAuth 'auth()'
 */
export async function switchProperty(propertyId: string) {
  try {
    // 1. Retrieve the session using your custom getSession function
    const session = await getSession(); 

    if (!session) {
       return { success: false, error: "No active session" };
    }

    // 2. Update the propertyId in the session payload
    const updatedPayload = {
      ...session,
      propertyId: propertyId // Update to the new property UUID
    };

    // 3. Re-encrypt the session and set the new cookie
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const newToken = await encrypt(updatedPayload);

    const cookieStore = await cookies();
    cookieStore.set("auth-token", newToken, { 
      expires, 
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production",
      sameSite: 'lax',
      path: '/',
      priority: 'high'
    });

    console.log(`Successfully switched session to property: ${propertyId}`);
    
    // 4. Clear cache to ensure UI reflects new property data
    revalidatePath("/");
    
    return { success: true };
  } catch (error) {
    console.error("Internal Auth Error:", error);
    return { success: false, error: "Failed to switch property context" };
  }
}

/**
 * Clears session and redirects to the Ethereal Inn public landing page
 */
export async function logout() {
  const cookieStore = await cookies();
  
  cookieStore.set("auth-token", "", { 
    expires: new Date(0),
    path: '/' 
  });
  
  redirect("/ethereal-inn");
}