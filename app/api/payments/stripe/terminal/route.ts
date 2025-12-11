/**
 * Stripe Terminal Payment API Route
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createTerminalPayment } from '@/payments/stripe'
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
    const { amount, currency, invoiceId, customerId, description } = body

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'amount ist erforderlich und muss > 0 sein' },
        { status: 400 }
      )
    }

    // Erstelle Terminal Payment Intent bei Stripe
    const terminalPayment = await createTerminalPayment({
      amount: Math.round(amount * 100), // Konvertiere zu Cent
      currency: currency || 'eur',
      description: description || undefined,
    })

    // Erstelle Payment-Eintrag in der Datenbank
    const payment = await paymentService.createPayment({
      tenantId: session.user.tenantId,
      invoiceId: invoiceId || undefined,
      customerId: customerId || undefined,
      amount: parseFloat(amount),
      currency: currency || 'EUR',
      method: 'STRIPE_TERMINAL',
      transactionId: terminalPayment.paymentIntentId,
    })

    return NextResponse.json({
      paymentIntent: {
        id: terminalPayment.paymentIntentId,
        clientSecret: terminalPayment.clientSecret,
      },
      payment: payment.payment,
    })
  } catch (error) {
    console.error('[Stripe Terminal API] Error creating terminal payment:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Terminal Payments' },
      { status: 500 }
    )
  }
}

