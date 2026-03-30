import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth'; 

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const token = req.cookies.get('auth-token')?.value;

  // 1. Define Public vs Private routes
  const isLoginPage = path === '/login';
  
  // NEW: Define Ethereal Glam as a public-facing marketing page
  const isGlamPage = path === '/glam'; 
  
  const isPublicAsset = 
    path.startsWith('/_next') || 
    path.startsWith('/api') || 
    path.includes('.');

  // If it's a static asset, let it pass immediately
  if (isPublicAsset) return NextResponse.next();

  // 2. Decrypt the session
  const session = token ? await decrypt(token).catch(() => null) : null;

  // 3. REDIRECT LOGIC
  
  // If no session and user is NOT on login OR the public glam page, redirect to login
  if (!session && !isLoginPage && !isGlamPage) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // If session exists and user tries to go to login, send to dashboard
  if (session && isLoginPage) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Allow access to /glam (public), /login (public), or protected routes (if session exists)
  return NextResponse.next();
}

// Optimized matcher
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};