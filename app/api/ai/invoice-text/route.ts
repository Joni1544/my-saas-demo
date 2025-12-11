/**
 * KI API Route: Rechnungstext generieren
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { aiService } from '@/services/ai/AiService'

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
    const { customerId, amount, items } = body

    if (!customerId || !amount || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'customerId, amount und items sind erforderlich' },
        { status: 400 }
      )
    }

    const result = await aiService.generateInvoiceText(
      session.user.tenantId,
      customerId,
      amount,
      items
    )

    return NextResponse.json({ result })
  } catch (error) {
    console.error('[AI API] Error generating invoice text:', error)
    return NextResponse.json(
      { error: 'Fehler beim Generieren des Rechnungstexts' },
      { status: 500 }
    )
  }
}

