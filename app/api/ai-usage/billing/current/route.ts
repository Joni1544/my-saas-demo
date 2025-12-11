/**
 * AI Billing Current API Route
 * Aktuelle Monatsrechnung abrufen
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { aiBillingService } from '@/services/ai/AiBillingService'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const billing = await aiBillingService.getCurrentMonthBill(session.user.tenantId)

    return NextResponse.json({ billing })
  } catch (error) {
    console.error('[AI Billing Current API] Error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der aktuellen Rechnung' },
      { status: 500 }
    )
  }
}

