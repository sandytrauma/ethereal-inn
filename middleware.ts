import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server'; // Correct path
import { decrypt } from '@/lib/auth';

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const token = req.cookies.get('auth-token')?.value;

  // 1. Define Public Routes (Landing pages anyone can see)
  const PUBLIC_ROUTES = [
    '/ethereal-inn', // Login Page
    '/glam', 
    '/suites', 
    '/culinary', 
    '/contact'
  ];

  const isPublicPage = PUBLIC_ROUTES.includes(path);
  
  // 2. Identify the PMS Route
  // This ensures /pms and everything under it (e.g., /pms/123) is flagged
  const isPmsRoute = path.startsWith('/pms');

  // Skip middleware for internal Next.js assets and API routes
  const isInternalAsset = path.startsWith('/_next') || path.startsWith('/api') || path.includes('.');
  if (isInternalAsset) return NextResponse.next();

  // 3. Decrypt the session
  const session = token ? await decrypt(token).catch(() => null) : null;

  // --- REDIRECT LOGIC ---

  // A. Guest trying to access protected routes (PMS or Dashboard)
  if (!session && (isPmsRoute || !isPublicPage)) {
    return NextResponse.redirect(new URL('/ethereal-inn', req.url));
  }

  // B. Staff already logged in trying to hit the login page
  if (session && path === '/ethereal-inn') {
    // Redirect to the first PMS property or main dashboard
    return NextResponse.redirect(new URL('/pms', req.url));
  }

  return NextResponse.next();
}

// Optimized matcher: Ensure it catches the root and all dynamic paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};