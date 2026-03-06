import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth'; // Ensure this path is correct

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const token = req.cookies.get('auth-token')?.value;

  // 1. Define Public vs Private routes
  const isLoginPage = path === '/login';
  const isPublicAsset = path.startsWith('/_next') || path.startsWith('/api') || path.includes('.');

  if (isPublicAsset) return NextResponse.next();

  // 2. Decrypt the session
  const session = token ? await decrypt(token).catch(() => null) : null;

  // 3. REDIRECT LOGIC (The "303 Loop" Fix)
  // If no session and trying to access protected route (like /), go to login
  if (!session && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // If session exists and user is on login page, go to dashboard (/)
  if (session && isLoginPage) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

// Ensure the middleware runs on all relevant paths
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};