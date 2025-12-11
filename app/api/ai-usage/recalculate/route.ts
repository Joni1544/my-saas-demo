/**
 * AI Usage Recalculate API Route
 * Re-Processing der monatlichen Rechnung
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { aiBillingService } from '@/services/ai/AiBillingService'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { month, year, multiplier } = body

    if (!month || !year) {
      return NextResponse.json(
        { error: 'month und year sind erforderlich' },
        { status: 400 }
      )
    }

    const billing = await aiBillingService.recalculateBill(
      session.user.tenantId,
      parseInt(month),
      parseInt(year),
      multiplier
    )

    return NextResponse.json({ billing })
  } catch (error) {
    console.error('[AI Usage Recalculate API] Error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Neuberechnen der Rechnung' },
      { status: 500 }
    )
  }
}

