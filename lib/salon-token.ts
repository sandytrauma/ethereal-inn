// lib/salon-token.ts
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

// =========================================================================
// 🛡️ CRITICAL ENCRYPTION SECURITY SHIELD
// =========================================================================
if (!process.env.SALON_JWT_SECRET) {
  throw new Error(
    "🚨 CRITICAL SECURITY EXCEPTION: 'SALON_JWT_SECRET' is not defined inside the active environment variables. Core auth runtime aborted."
  );
}

const SALON_SECRET = new TextEncoder().encode(process.env.SALON_JWT_SECRET);
export const COOKIE_NAME = "salon_session_token";

export interface SalonSessionPayload {
  id: string;
  tenantId: string;
  outletId: string | null;
  role: string;
  name: string;
}

/**
 * Encrypts user payload into a signed JWT and saves it to a secure, HTTP-only cookie
 */
export async function createSalonSession(payload: SalonSessionPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h") 
    .sign(SALON_SECRET);

  // 🌟 Ensure clean promise unwrapping for Next.js 15+ configurations
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/", 
    maxAge: 60 * 60 * 12, // 12 hours
  });
}

/**
 * Decrypts and verifies the active salon cookie token
 */
export async function getSalonSession(): Promise<SalonSessionPayload | null> {
  // 🌟 THE PRODUCTION FIX: Explicitly await the cookies promise context before pulling values
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SALON_SECRET, {
      algorithms: ["HS256"],
    });
    return payload as unknown as SalonSessionPayload;
  } catch (error) {
    // Fail silently for corrupted/tampered tokens to trigger your middleware redirect
    return null;
  }
}

/**
 * Completely clears the salon cookie on logout
 */
export async function destroySalonSession() {
  const cookieStore = await cookies();
  
  // 🌟 Enforce explicit cookie deletion pass natively
  cookieStore.set(COOKIE_NAME, "", {
    path: "/", 
    maxAge: 0,
  });
}