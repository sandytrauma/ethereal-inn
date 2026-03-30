import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(SECRET);
}

export async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, SECRET, {
    algorithms: ["HS256"],
  });
  return payload;
}

// --- ADD THIS FUNCTION TO FIX LOGOUTS ---
export async function setSession(user: any) {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  const session = await encrypt({ user, expires });

  // Access cookies correctly for Next.js 15+ (awaiting cookies())
  const cookieStore = await cookies();
  
  cookieStore.set("auth-token", session, { 
    expires, 
    httpOnly: true, 
    path: "/",
    // CRITICAL FOR IFRAMES/POS:
    secure: true, 
    sameSite: "none", 
  });
}

export async function getSession() {
  const session = (await cookies()).get("auth-token")?.value;
  if (!session) return null;
  return await decrypt(session);
}

export async function updateSession() {
  const session = (await cookies()).get("auth-token")?.value;
  if (!session) return null;

  // Refresh the expiration so the user doesn't get logged out mid-work
  const parsed = await decrypt(session);
  parsed.expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  
  const res = await encrypt(parsed);
  const cookieStore = await cookies();
  
  cookieStore.set("auth-token", res, {
    expires: parsed.expires,
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });
}