import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const session = await auth()
  const pathname = request.nextUrl.pathname

  // Öffentliche Routen
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/invite') ||
    pathname.startsWith('/api/auth')
  ) {
    return NextResponse.next()
  }

  // Dashboard-Routen erfordern Authentifizierung
  if (pathname.startsWith('/dashboard')) {
    // Nicht authentifiziert → Login
    if (!session?.user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Admin-only Routen
    const adminOnlyRoutes = [
      '/dashboard/admin',
      '/dashboard/revenue',
      '/dashboard/employees',
      '/dashboard/expenses',
      '/dashboard/recurring-expenses',
      '/dashboard/finance',
      '/dashboard/settings',
    ]

    const isAdminRoute = adminOnlyRoutes.some(route => pathname.startsWith(route))
    
    if (isAdminRoute && session.user.role !== 'ADMIN') {
      // Mitarbeiter versucht auf Admin-Route zuzugreifen → Dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Mitarbeiter-Routen (optional, falls später spezielle Mitarbeiter-Routen gewünscht)
    // const mitarbeiterRoutes = ['/dashboard/staff']
    // const isMitarbeiterRoute = mitarbeiterRoutes.some(route => pathname.startsWith(route))
    
    // if (isMitarbeiterRoute && session.user.role !== 'MITARBEITER') {
    //   return NextResponse.redirect(new URL('/dashboard', request.url))
    // }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/invite/:path*',
    '/onboarding/:path*',
  ],
}
