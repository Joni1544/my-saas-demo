/**
 * Stripe Payment Intent API Route
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createPaymentIntent } from '@/payments/stripe'
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
    const { amount, currency, invoiceId, customerId, description } = body

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'amount ist erforderlich und muss > 0 sein' },
        { status: 400 }
      )
    }

    // Erstelle Payment Intent bei Stripe
    const paymentIntent = await createPaymentIntent({
      amount: Math.round(amount * 100), // Konvertiere zu Cent
      currency: currency || 'eur',
      customerId,
      metadata: {
        tenantId: session.user.tenantId,
        invoiceId: invoiceId || '',
        customerId: customerId || '',
      },
    })

    // Erstelle Payment-Eintrag in der Datenbank
    const payment = await paymentService.createPayment({
      tenantId: session.user.tenantId,
      invoiceId: invoiceId || undefined,
      customerId: customerId || undefined,
      amount: parseFloat(amount),
      currency: currency || 'EUR',
      method: 'STRIPE_CARD',
      transactionId: paymentIntent.id,
    })

    return NextResponse.json({
      paymentIntent: {
        id: paymentIntent.id,
        clientSecret: paymentIntent.clientSecret,
        status: paymentIntent.status,
      },
      payment: payment.payment,
    })
  } catch (error) {
    console.error('[Stripe API] Error creating payment intent:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Payment Intents' },
      { status: 500 }
    )
  }
}

