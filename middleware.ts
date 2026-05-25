import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server'; 
import { decrypt } from '@/lib/auth';

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const token = req.cookies.get('auth-token')?.value;
  const hostname = req.headers.get('host') || '';

  // Skip middleware execution for internal Next.js engine chunks, build file optimization passes, and images
  const isInternalAsset = path.startsWith('/_next') || path.startsWith('/api') || path.includes('.');
  if (isInternalAsset) return NextResponse.next();

  // =========================================================================
  // 1. DYNAMIC SUBDOMAIN / TENANT EXTRACTION LAYER
  // =========================================================================
  const domainParts = hostname.split('.');
  let currentSubdomain = '';

  // Handle extracting subdomains from your live domain (www.etherealinn.com)
  if (domainParts.length > 2 && domainParts[0] !== 'www') {
    currentSubdomain = domainParts[0];
  } else if (domainParts.length === 2 && hostname.includes('localhost') && domainParts[0] !== 'localhost') {
    currentSubdomain = domainParts[0];
  }

  // =========================================================================
  // 2. ROUTE CLASSIFICATION MATRIX
  // =========================================================================
  const isAdminRoute = path.startsWith('/pms-admin');

  const STATIC_PUBLIC_ROUTES = [
    '/ethereal-inn', // Your master system authentication portal login view
    '/glam', 
    '/suites', 
    '/culinary', 
    '/contact',
    '/sanctuary'
  ];

  const isPublicPage = 
    STATIC_PUBLIC_ROUTES.includes(path) || 
    path.startsWith('/sanctuary/') ||      
    path.startsWith('/invoices');

  // Strict folder structure checks to isolate active dashboard actions cleanly
  const isPmsRoute = !isAdminRoute && (path === '/pms' || path.startsWith('/pms/') || path.includes('/occupancy'));
  const isProtectedSystem = isPmsRoute || path === '/';

  // 3. Decrypt Active Encrypted Passports
  const session = token ? await decrypt(token).catch(() => null) : null;

  // =========================================================================
  // 3. SECURITY GATEWAY SECURITY FIREWALL
  // =========================================================================

  // SPECIAL GATE: For internal onboarding routes, handle security independently
  if (isAdminRoute) {
    if (!session) {
      return NextResponse.redirect(new URL('/ethereal-inn', req.url));
    }
    return NextResponse.next(); // Hands off control to page.tsx for the admin@ethereal.com email verification check
  }

  // A. Block unauthenticated requests trying to touch backend workflows
  if (!session && (isProtectedSystem || !isPublicPage)) {
    return NextResponse.redirect(new URL('/ethereal-inn', req.url));
  }

  // B. Protect active sessions from bouncing backward into the login interface
  if (session && path === '/ethereal-inn') {
    return NextResponse.redirect(new URL('/', req.url)); 
  }

  // =========================================================================
  // 4. SAAS SUBDOMAIN VIRTUAL DIRECTORY REWRITE LAYER
  // =========================================================================
  if (currentSubdomain && !isPublicPage && !isAdminRoute) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-tenant-subdomain', currentSubdomain);

    return NextResponse.rewrite(new URL(path, req.url), {
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};