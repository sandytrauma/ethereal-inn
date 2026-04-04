import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth'; 

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const token = req.cookies.get('auth-token')?.value;

  // 1. Define all Publicly Accessible Pages
  const PUBLIC_ROUTES = [
    '/ethereal-inn', // Login Page
    '/glam',         // Membership Page
    '/suites',       // Accommodations
    '/culinary',     // Urban Ambrosia
    '/contact'       // Contact Page
  ];

  const isPublicPage = PUBLIC_ROUTES.includes(path);
  
  const isPublicAsset = 
    path.startsWith('/_next') || 
    path.startsWith('/api') || 
    path.includes('.');

  // If it's a static asset, let it pass immediately
  if (isPublicAsset) return NextResponse.next();

  // 2. Decrypt the session
  const session = token ? await decrypt(token).catch(() => null) : null;

  // 3. REDIRECT LOGIC
  
  // If no session and the user is NOT on a public page, redirect to login
  if (!session && !isPublicPage) {
    return NextResponse.redirect(new URL('/ethereal-inn', req.url));
  }

  // If session exists (staff logged in) and they try to go to login, send to dashboard
  if (session && path === '/ethereal-inn') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Allow access to all public pages or protected routes (if session exists)
  return NextResponse.next();
}

// Optimized matcher
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};