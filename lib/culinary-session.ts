// lib/culinary-session.ts
import { decrypt } from '@/lib/auth';

export async function getCulinarySession(token: string | undefined) {
  if (!token) return null;
  try {
    const session = await decrypt(token);
    // Return only what the culinary module needs, keeping it clean
    return session;
  } catch {
    return null;
  }
}