/**
 * Payment API Route: Zahlung als bezahlt markieren
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
    const { paymentId, method, reference, paidAt } = body

    if (!paymentId) {
      return NextResponse.json(
        { error: 'paymentId ist erforderlich' },
        { status: 400 }
      )
    }

    // Wenn method und reference angegeben sind, aktualisiere Payment zuerst
    if (method && (method === 'CASH' || method === 'BANK_TRANSFER')) {
      const { prisma } = await import('@/lib/prisma')
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          method: method as any,
          reference: reference || null,
        },
      })
    }

    const result = await paymentService.markPaymentPaid(
      paymentId,
      paidAt ? new Date(paidAt) : undefined
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('[Payments API] Error marking payment as paid:', error)
    return NextResponse.json(
      { error: 'Fehler beim Markieren der Zahlung als bezahlt' },
      { status: 500 }
    )
  }
}

