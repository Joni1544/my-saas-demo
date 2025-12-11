/**
 * Payment API Route: Einzelne Zahlung abrufen
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { paymentService } from '@/services/payment/PaymentService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const payment = await paymentService.getPayment(id, session.user.tenantId)

    if (!payment) {
      return NextResponse.json(
        { error: 'Zahlung nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json({ payment })
  } catch (error) {
    console.error('[Payments API] Error getting payment:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Zahlung' },
      { status: 500 }
    )
  }
}

