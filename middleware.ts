// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server'; 
import { decrypt } from '@/lib/auth'; // Master Hotel Decrypter Pass
import { getSalonSession } from '@/lib/salon-token'; // 🌟 Brand new Salon Decrypter Pass

// =========================================================================
// 🌍 EDGE-COMPATIBLE GEOLOCATION BARRIER PROTECTION FENCE
// =========================================================================
function checkGeoProximity(req: NextRequest, userRole: string): { isAllowed: boolean; distanceKm: number } {
  // 🌟 ADMINISTRATIVE OVERRIDE GATEWAY: Admins/Owners bypass spatial fences for remote operations
  if (userRole === 'admin' || userRole === 'owner' || userRole === 'tenant_admin') {
    return { isAllowed: true, distanceKm: 0 };
  }

  // Read incoming device coordinates provided natively by Vercel Edge Headers
  const userLat = parseFloat(req.headers.get('x-vercel-ip-latitude') || '0');
  const userLng = parseFloat(req.headers.get('x-vercel-ip-longitude') || '0');

  // Exact spatial coordinates for the Prayagraj physical operational anchor depot/base point
  const PROPERTY_LAT = 25.4358; 
  const PROPERTY_LNG = 81.8463;

  // Defensive check: If geolocation headers are missing (e.g., local offline development), pass safely
  if (!userLat || !userLng) {
    return { isAllowed: true, distanceKm: 0 }; 
  }

  // Haversine Mathematical Distance Calculation Formulation
  const R = 6371; // Earth's radius in kilometers
  const dLat = (PROPERTY_LAT - userLat) * Math.PI / 180;
  const dLng = (PROPERTY_LNG - userLng) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(userLat * Math.PI / 180) * Math.cos(PROPERTY_LAT * Math.PI / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;

  const ALLOWED_RADIUS_KM = 5.0; // Enforced storefront perimeter constraint range

  return {
    isAllowed: distanceKm <= ALLOWED_RADIUS_KM,
    distanceKm
  };
}

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
  const hotelSession = hotelToken ? await decrypt(hotelToken).catch(() => null) : null;
  const glamSession = glamToken ? await getSalonSession().catch(() => null) : null;

  // Extract the raw user role string from whichever session is currently active
  const userRole = String((hotelSession as any)?.role || (glamSession as any)?.role || 'staff').toLowerCase().trim();

  // =========================================================================
  // 4. SECURITY GATEWAY FIREWALL MATRIX & GEO-FENCE ENFORCEMENT
  // =========================================================================

  // A. EXCEPTION GATE: Master Super-Admin Provisioning Hub Control
  if (isGlamMasterAdmin) {
    return NextResponse.next();
  }

  // 🌍 GEOLOCATION RADIAL PERIMETER BARRIER ENFORCEMENT
  // Evaluated before individual application access handlers to avoid unnecessary server cycles
  if (isAdminRoute || isPmsRoute || isGlamProtectedView) {
    const geo = checkGeoProximity(req, userRole);
    if (!geo.isAllowed) {
      return new NextResponse(
        `⚠️ Terminal Access Restricted: You are currently located ${geo.distanceKm.toFixed(2)} km away. Device operations are locked to a 5 km storefront radius.`,
        { status: 403 }
      );
    }
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