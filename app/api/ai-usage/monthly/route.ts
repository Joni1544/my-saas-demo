/**
 * AI Usage Monthly API Route
 * Monatliche Übersicht
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
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    const now = new Date()
    const targetMonth = month ? parseInt(month) : now.getMonth() + 1
    const targetYear = year ? parseInt(year) : now.getFullYear()

    const monthlyUsage = await aiUsageService.getMonthlyUsage(
      session.user.tenantId,
      targetMonth,
      targetYear
    )

    return NextResponse.json({ monthlyUsage })
  } catch (error) {
    console.error('[AI Usage Monthly API] Error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der monatlichen Nutzung' },
      { status: 500 }
    )
  }
}

