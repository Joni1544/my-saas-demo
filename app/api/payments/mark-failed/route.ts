/**
 * Payment API Route: Zahlung als fehlgeschlagen markieren
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { paymentService } from '@/services/payment/PaymentService'

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
    const { paymentId } = body

    if (!paymentId) {
      return NextResponse.json(
        { error: 'paymentId ist erforderlich' },
        { status: 400 }
      )
    }

    const result = await paymentService.markPaymentFailed(paymentId)

    return NextResponse.json(result)
  } catch (error) {
    console.error('[Payments API] Error marking payment as failed:', error)
    return NextResponse.json(
      { error: 'Fehler beim Markieren der Zahlung als fehlgeschlagen' },
      { status: 500 }
    )
  }
}

