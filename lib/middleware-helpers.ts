/**
 * Middleware Helper Functions
 * Hilfsfunktionen für Role-Based Access Control
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from './auth'

export interface AuthResult {
  session: Awaited<ReturnType<typeof auth>>
  isAuthenticated: boolean
  isAdmin: boolean
  isMitarbeiter: boolean
  tenantId: string | null
}

/**
 * Prüft ob User authentifiziert ist
 */
export async function checkAuth(): Promise<AuthResult> {
  const session = await auth()
  
  return {
    session,
    isAuthenticated: !!session?.user,
    isAdmin: session?.user?.role === 'ADMIN',
    isMitarbeiter: session?.user?.role === 'MITARBEITER',
    tenantId: session?.user?.tenantId || null,
  }
}

/**
 * Prüft ob User Admin ist
 */
export async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
  const authResult = await checkAuth()
  
  if (!authResult.isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  if (!authResult.isAdmin) {
    return NextResponse.json(
      { error: 'Nicht autorisiert. Nur Administratoren haben Zugriff.' },
      { status: 403 }
    )
  }
  
  return null
}

/**
 * Prüft ob User Mitarbeiter oder Admin ist
 */
export async function requireAuth(request: NextRequest): Promise<NextResponse | null> {
  const authResult = await checkAuth()
  
  if (!authResult.isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  return null
}

