// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server'; 
import { decrypt } from '@/lib/auth';

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const token = req.cookies.get('auth-token')?.value;
  // 🌟 Read the specialized 7-day session cookie we created for your Master Admin Hub
  const masterSessionToken = req.cookies.get('glam_master_session')?.value;
  const hostname = req.headers.get('host') || '';

  // Skip middleware execution for internal Next.js engine chunks, build file passes, and assets
  const isInternalAsset = path.startsWith('/_next') || path.startsWith('/api') || path.includes('.');
  if (isInternalAsset) return NextResponse.next();

  // =========================================================================
  // 1. DYNAMIC SUBDOMAIN / TENANT EXTRACTION LAYER
  // =========================================================================
  const domainParts = hostname.split('.');
  let currentSubdomain = '';

  if (domainParts.length > 2 && domainParts[0] !== 'www') {
    currentSubdomain = domainParts[0];
  } else if (domainParts.length === 2 && hostname.includes('localhost') && domainParts[0] !== 'localhost') {
    currentSubdomain = domainParts[0];
  }

  // =========================================================================
  // 2. ROUTE CLASSIFICATION MATRIX
  // =========================================================================
  const isAdminRoute = path.startsWith('/pms-admin');
  
  // 👑 GLAM TRACKING BOUNDARIES: Identify your multi-tenant salon routes cleanly
  const isGlamMasterAdmin = path === '/glam/master-hub';
  const isGlamAuthPortal = path === '/glam/login' || path === '/glam';
  const isGlamProtectedView = path.startsWith('/glam/') && !isGlamMasterAdmin && path !== '/glam/login';

  const STATIC_PUBLIC_ROUTES = [
    '/ethereal-inn', 
    '/glam', 
    '/glam/login', // 🌟 Explicitly allow the salon login interface uninhibited
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
  const isProtectedSystem = isPmsRoute || isGlamProtectedView || path === '/';

  // 3. Decrypt Active Encrypted Passports for standard tenant operators
  const session = token ? await decrypt(token).catch(() => null) : null;

  // =========================================================================
  // 3. SECURITY GATEWAY FIREWALL EXCEPTIONS
  // =========================================================================

  // A. EXCEPTION GATE: Protect the Master Super-Admin Provisioning Hub autonomously
  if (isGlamMasterAdmin) {
    // If a 7-day cookie exists, let them straight through; otherwise, allow them to view the input lock screen
    return NextResponse.next();
  }

  // B. SPECIAL GATE: For internal hotel onboarding routes, handle security independently
  if (isAdminRoute) {
    if (!session) {
      return NextResponse.redirect(new URL('/ethereal-inn', req.url));
    }
    return NextResponse.next();
  }

  // C. Block unauthenticated salon requests and route them straight to your specialized salon login page
  if (!session && isGlamProtectedView) {
    return NextResponse.redirect(new URL('/glam/login?error=Session expired', req.url));
  }

  // D. Block generic unauthenticated core/hotel platform requests
  if (!session && (isProtectedSystem || !isPublicPage)) {
    return NextResponse.redirect(new URL('/ethereal-inn', req.url));
  }

  // E. Prevent active salon sessions from falling backward into the login page
  if (session && path === '/glam/login') {
    return NextResponse.redirect(new URL('/glam/dashboard', req.url));
  }

  // F. Protect active hotel sessions from bouncing backward into the login interface
  if (session && path === '/ethereal-inn') {
    return NextResponse.redirect(new URL('/', req.url)); 
  }

  // =========================================================================
  // 4. SAAS SUBDOMAIN VIRTUAL DIRECTORY REWRITE LAYER
  // =========================================================================
  if (currentSubdomain && !isPublicPage && !isAdminRoute && !path.startsWith('/glam')) {
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