/**
 * Next.js Middleware
 * Schützt geschützte Routen und leitet nicht-authentifizierte Benutzer um
 * Vereinfachte Version ohne Prisma (Edge Runtime kompatibel)
 */
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Prüfe auf Auth-Token in Cookies
  const token = request.cookies.get('next-auth.session-token') || 
                request.cookies.get('__Secure-next-auth.session-token')

  // Wenn kein Token und auf geschützte Route, umleiten
  if (!token) {
    if (
      request.nextUrl.pathname.startsWith('/dashboard') ||
      request.nextUrl.pathname.startsWith('/admin')
    ) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // API Routes werden in den Route Handlers selbst geprüft
  return NextResponse.next()
}

// Geschützte Routen definieren
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
  ],
}
