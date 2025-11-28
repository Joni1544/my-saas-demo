/**
 * Next.js Middleware
 * Schützt geschützte Routen und leitet nicht-authentifizierte Benutzer um
 */
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    // Zusätzliche Middleware-Logik kann hier hinzugefügt werden
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Überprüfe, ob der Benutzer authentifiziert ist
        if (!token) {
          return false
        }

        // Admin-Routen schützen
        if (req.nextUrl.pathname.startsWith('/admin')) {
          return token.role === 'ADMIN'
        }

        // Dashboard-Routen schützen
        if (req.nextUrl.pathname.startsWith('/dashboard')) {
          return !!token
        }

        return true
      },
    },
  }
)

// Geschützte Routen definieren
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/api/customers/:path*',
    '/api/appointments/:path*',
    '/api/tasks/:path*',
  ],
}

