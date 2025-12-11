/**
 * AI Usage API Route
 * Liste aller KI-Nutzungen
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
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const feature = searchParams.get('feature')

    const stats = await aiUsageService.getTenantUsageStats(
      session.user.tenantId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    )

    // Filter nach Feature falls angegeben
    let usages = stats.featureBreakdown
    if (feature) {
      usages = { [feature]: stats.featureBreakdown[feature] || { count: 0, tokens: 0, cost: 0 } }
    }

    return NextResponse.json({
      stats: {
        totalTokens: stats.totalTokens,
        totalCost: stats.totalCost,
        count: stats.count,
        avgCostPerRequest: stats.avgCostPerRequest,
        featureBreakdown: usages,
        providerBreakdown: stats.providerBreakdown,
        dailyUsage: stats.dailyUsage,
      },
    })
  } catch (error) {
    console.error('[AI Usage API] Error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der KI-Nutzung' },
      { status: 500 }
    )
  }
}

