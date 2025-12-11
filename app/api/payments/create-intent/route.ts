/**
 * Stripe API Route: Payment Intent erstellen
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createPaymentIntent } from '@/payments/stripe'

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
    const { amount, currency, customerId, metadata } = body

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'amount ist erforderlich und muss > 0 sein' },
        { status: 400 }
      )
    }

    const paymentIntent = await createPaymentIntent({
      amount: Math.round(amount * 100), // Konvertiere zu Cent
      currency: currency || 'eur',
      customerId,
      metadata: {
        ...metadata,
        tenantId: session.user.tenantId,
      },
    })

    return NextResponse.json({ paymentIntent })
  } catch (error) {
    console.error('[Payments API] Error creating payment intent:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Payment Intents' },
      { status: 500 }
    )
  }
}

