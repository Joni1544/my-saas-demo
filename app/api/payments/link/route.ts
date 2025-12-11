/**
 * Payment Link API Route
 * Erstellt Stripe Checkout Session für Payment Link
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { stripe, isDummyMode } from '@/payments/stripe'
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

    if (isDummyMode || !stripe) {
      // Dummy-Implementierung
      const paymentLinkId = `pl_dummy_${Date.now()}`
      const paymentLinkUrl = `https://checkout.stripe.com/pay/${paymentLinkId}`

      // Erstelle Payment-Eintrag
      const payment = await paymentService.createPayment({
        tenantId: session.user.tenantId,
        invoiceId: invoiceId || undefined,
        customerId: customerId || undefined,
        amount: parseFloat(amount),
        currency: currency || 'EUR',
        method: 'STRIPE_CARD',
        transactionId: paymentLinkId,
      })

      return NextResponse.json({
        paymentLink: {
          id: paymentLinkId,
          url: paymentLinkUrl,
        },
        payment: payment.payment,
      })
    }

    try {
      // Erstelle Stripe Checkout Session
      const checkoutSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: currency?.toLowerCase() || 'eur',
              product_data: {
                name: description || 'Zahlung',
              },
              unit_amount: Math.round(amount * 100), // In Cent
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/payments?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/payments?canceled=true`,
        metadata: {
          tenantId: session.user.tenantId,
          invoiceId: invoiceId || '',
          customerId: customerId || '',
        },
      })

      // Erstelle Payment-Eintrag
      const payment = await paymentService.createPayment({
        tenantId: session.user.tenantId,
        invoiceId: invoiceId || undefined,
        customerId: customerId || undefined,
        amount: parseFloat(amount),
        currency: currency || 'EUR',
        method: 'STRIPE_CARD',
        transactionId: checkoutSession.id,
      })

      return NextResponse.json({
        paymentLink: {
          id: checkoutSession.id,
          url: checkoutSession.url,
        },
        payment: payment.payment,
      })
    } catch (error) {
      console.error('[Payment Link API] Error creating checkout session:', error)
      throw error
    }
  } catch (error) {
    console.error('[Payment Link API] Error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Payment Links' },
      { status: 500 }
    )
  }
}

