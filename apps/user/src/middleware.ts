import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // We read the zustand store state from localStorage if it's there.
  // Wait, Next.js middleware runs on the Edge runtime and cannot access localStorage.
  // The session state in this app is currently maintained purely in client-side localStorage via Zustand persist.
  // The cookies are NOT used by default in this setup unless we explicitly set them.
  // Let's check if the current project uses cookies for the JWT.
  
  // As a placeholder, we'll allow the request to pass through and rely on the client-side
  // useEffect hooks in AdminShell and UserShell for route protection as currently implemented.
  // If a cookie-based approach is required, the login endpoint and client API need to be refactored to set cookies.
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*'],
};
