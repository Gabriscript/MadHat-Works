import { NextResponse, type NextRequest } from 'next/server';
import { verifySession, ADMIN_COOKIE } from '@/lib/auth';

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Login page must always be reachable (no longer under /admin, kept for safety).
  if (pathname === '/login' || pathname.startsWith('/login/')) {
    return NextResponse.next();
  }

  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  const session = await verifySession(token);
  if (session) return NextResponse.next();

  // Not authenticated -> redirect to login with `from` preserved.
  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.search = '';
  url.searchParams.set('from', pathname + (search || ''));
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
