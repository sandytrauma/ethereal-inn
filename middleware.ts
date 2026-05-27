// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server'; 
import { decrypt } from '@/lib/auth'; // Master Hotel Decrypter Pass
import { getSalonSession } from '@/lib/salon-token'; // 🌟 Brand new Salon Decrypter Pass

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const hostname = req.headers.get('host') || '';

  // 🌟 READ COOKIES FROM INDEPENDENT ISOLATED NAMESPACES
  const hotelToken = req.cookies.get('auth-token')?.value;
  const glamToken = req.cookies.get('salon_session_token')?.value; // Matches COOKIE_NAME from lib/salon-token.ts
  const masterSessionToken = req.cookies.get('glam_master_session')?.value;

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
  
  const isGlamMasterAdmin = path === '/glam/master-hub';
  const isGlamAuthPortal = path === '/glam/login' || path === '/glam';
  const isGlamProtectedView = path.startsWith('/glam/') && !isGlamMasterAdmin && path !== '/glam/login';

  const STATIC_PUBLIC_ROUTES = [
    '/ethereal-inn', 
    '/glam', 
    '/glam/login', 
    '/suites', 
    '/culinary', 
    '/contact',
    '/sanctuary'
  ];

  const isPublicPage = 
    STATIC_PUBLIC_ROUTES.includes(path) || 
    path.startsWith('/sanctuary/') ||      
    path.startsWith('/invoices');

  const isPmsRoute = !isAdminRoute && (path === '/pms' || path.startsWith('/pms/') || path.includes('/occupancy'));

  // =========================================================================
  // 3. SECURE DECRYPTION LAYER (COMPLETELY DECOUPLED)
  // =========================================================================
  // Hotel sessions decrypt via hotel secret; Salon sessions decrypt via salon secret
  const hotelSession = hotelToken ? await decrypt(hotelToken).catch(() => null) : null;
  
  // 🌟 Leverage your standard token verification helper (simulates req parsing via cookies context)
  const glamSession = glamToken ? await getSalonSession().catch(() => null) : null;

  // =========================================================================
  // 4. SECURITY GATEWAY FIREWALL MATRIX
  // =========================================================================

  // A. EXCEPTION GATE: Master Super-Admin Provisioning Hub Control
  if (isGlamMasterAdmin) {
    return NextResponse.next();
  }

  // B. HOTEL PMS ADMIN ZONE GATEWAY
  if (isAdminRoute) {
    if (!hotelSession) {
      return NextResponse.redirect(new URL('/ethereal-inn', req.url));
    }
    return NextResponse.next();
  }

  // C. 🛡️ GLAM WORKSPACE GUARD: Protect salon routes independently of hotel states
  if (!glamSession && isGlamProtectedView) {
    return NextResponse.redirect(new URL('/glam/login?error=Session expired', req.url));
  }

  if (glamSession && path === '/glam/login') {
    return NextResponse.redirect(new URL('/glam/dashboard', req.url));
  }

  // D. 🛡️ HOTEL PMS BASE PLATFORM GUARD: Handles standard core app views
  if (!hotelSession && !path.startsWith('/glam') && (isPmsRoute || path === '/' || !isPublicPage)) {
    return NextResponse.redirect(new URL('/ethereal-inn', req.url));
  }

  if (hotelSession && path === '/ethereal-inn') {
    return NextResponse.redirect(new URL('/', req.url)); 
  }

  // =========================================================================
  // 5. SAAS SUBDOMAIN VIRTUAL DIRECTORY REWRITE LAYER
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