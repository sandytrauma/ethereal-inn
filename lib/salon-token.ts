// lib/salon-token.ts
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SALON_SECRET = new TextEncoder().encode(
  process.env.SALON_JWT_SECRET || "fallback_super_secure_glam_secret_key_2026_prod"
);

// 🌟 Make sure this matches the exact key name checked inside your middleware.ts file!
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

  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/", // 🌟 CHANGED: Scoped globally so global middleware can intercept it instantly
    maxAge: 60 * 60 * 12, // 12 hours
  });
}

/**
 * Decrypts and verifies the active salon cookie token
 */
export async function getSalonSession(): Promise<SalonSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SALON_SECRET, {
      algorithms: ["HS256"],
    });
    return payload as unknown as SalonSessionPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Completely clears the salon cookie on logout
 */
export async function destroySalonSession() {
  const cookieStore = await cookies();
  
  cookieStore.set(COOKIE_NAME, "", {
    path: "/", // 🌟 CHANGED: Explicitly match root scope path to ensure deletion
    maxAge: 0,
  });
}