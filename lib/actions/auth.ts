"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { encrypt } from "../auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

export async function loginUser(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Please enter both email and password." };
  }

  let success = false;

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()));

    if (!user) {
      return { error: "Account not found." };
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return { error: "Incorrect password. Please try again." };
    }

    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 Hours
    const session = await encrypt({ 
      userId: user.id, 
      role: user.role,
      name: user.name 
    });

    // --- UPDATED SECURE COOKIE LOGIC ---
    const cookieStore = await cookies();
    
    cookieStore.set("auth-token", session, { 
      expires, 
      httpOnly: true, 
      // MUST BE TRUE: 'none' requires secure. 
      // If you are testing on localhost WITHOUT HTTPS, use 'lax' temporarily.
      secure: true, 
      // CRITICAL: 'none' allows the cookie to be sent in the POS iframe.
      sameSite: 'none', 
      path: '/',
      priority: 'high'
    });

    success = true;
  } catch (e) {
    console.error("Login Server Error:", e);
    return { error: "A server error occurred. Please try again." };
  }

  if (success) {
    redirect("/"); 
  }
}

export async function logout() {
  const cookieStore = await cookies();
  
  cookieStore.set("auth-token", "", { 
    expires: new Date(0),
    path: '/',
    // Match the login settings for clean removal
    secure: true,
    sameSite: 'none'
  });
  
  redirect("/login");
}