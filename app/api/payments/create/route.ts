/**
 * Payment API Route: Zahlung erstellen
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { paymentService } from '@/services/payment/PaymentService'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      invoiceId,
      customerId,
      employeeId,
      amount,
      currency,
      method,
      transactionId,
      reference,
    } = body

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'amount ist erforderlich und muss > 0 sein' },
        { status: 400 }
      )
    }

    if (!method) {
      return NextResponse.json(
        { error: 'method ist erforderlich' },
        { status: 400 }
      )
    }

    const result = await paymentService.createPayment({
      tenantId: session.user.tenantId,
      invoiceId,
      customerId,
      employeeId,
      amount: parseFloat(amount),
      currency: currency || 'EUR',
      method,
      transactionId,
      reference,
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('[Payments API] Error creating payment:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Zahlung' },
      { status: 500 }
    )
  }
}

