import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth'; 

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const token = req.cookies.get('auth-token')?.value;

  // 1. Define Public vs Private routes
  const isLoginPage = path === '/login';
  const isGlamPage = path === '/glam'; 
  
  // Define static assets and internal Next.js paths
  const isPublicAsset = 
    path.startsWith('/_next') || 
    path.startsWith('/api') || 
    path.includes('.');

  if (isPublicAsset) return NextResponse.next();

  // 2. Decrypt the session
  const session = token ? await decrypt(token).catch(() => null) : null;

  // 3. SECURE REDIRECT LOGIC
  
  // If no session and trying to access protected routes
  if (!session && !isLoginPage && !isGlamPage) {
    // SECURITY CHECK: If this is an iframe request (POS context), 
    // a redirect to /login might fail due to cookie partitioning.
    const isIframe = req.headers.get('sec-fetch-dest') === 'iframe' || req.headers.get('x-requested-with') === 'XMLHttpRequest';
    
    if (isIframe) {
      // Instead of a hard redirect which breaks iframes, return a 401 Unauthorized
      // This allows the client-side to handle the logout gracefully
      return new NextResponse('Unauthorized', { status: 401 });
    }

    return NextResponse.redirect(new URL('/login', req.url));
  }

  // If session exists and user tries to go to login, send to dashboard
  if (session && isLoginPage) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // 4. SECURITY HEADERS (Crucial for POS/Iframe stability)
  const response = NextResponse.next();
  
  // Allow your own domain to frame the POS (replace with your actual domain if different)
  response.headers.set('Content-Security-Policy', "frame-ancestors 'self'");
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};