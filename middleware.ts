import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('auth-token')?.value;
  const { pathname } = request.nextUrl;

  // 1. Allow internal Next.js requests and static files to pass through
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') || 
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // 2. If you are NOT using a separate /login folder:
  // We only need to protect the /dashboard route (if you have one)
  // or just let the app/page.tsx handle the conditional rendering.
  
  if (!session && pathname === '/dashboard') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 3. If a user is logged in and tries to go to the landing/root, 
  // you might want to force them to the dashboard view
  // (Only if you have a separate /dashboard/page.tsx)
  /*
  if (session && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  */

  return NextResponse.next();
}

export const config = {
  // We match everything except specific static/api paths
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};