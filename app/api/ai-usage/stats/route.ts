/**
 * AI Usage Stats API Route
 * Detaillierte Statistiken
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { aiUsageService } from '@/services/ai/AiUsageService'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const global = searchParams.get('global') === 'true'

    // Globale Stats nur für Admins
    if (global && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert für globale Statistiken' },
        { status: 403 }
      )
    }

    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (global) {
      const stats = await aiUsageService.getGlobalUsageStats(
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      )
      return NextResponse.json({ stats })
    } else {
      const stats = await aiUsageService.getTenantUsageStats(
        session.user.tenantId,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      )
      return NextResponse.json({ stats })
    }
  } catch (error) {
    console.error('[AI Usage Stats API] Error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Statistiken' },
      { status: 500 }
    )
  }
}

