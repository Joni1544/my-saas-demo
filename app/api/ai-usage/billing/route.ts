/**
 * AI Billing API Route
 * Alle Abrechnungen abrufen
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

    const billings = await aiBillingService.getTenantBillings(session.user.tenantId)

    return NextResponse.json({ billings })
  } catch (error) {
    console.error('[AI Billing API] Error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Abrechnungen' },
      { status: 500 }
    )
  }
}

