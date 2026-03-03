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

export async function getSession() {
  const session = (await cookies()).get("auth-token")?.value;
  if (!session) return null;
  return await decrypt(session);
}