/**
 * Stripe Webhook Route
 * Verarbeitet Stripe Webhook-Events
 */
import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/payments/stripe'
import { eventBus } from '@/events/EventBus'
import { paymentService } from '@/services/payment/PaymentService'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_dummy_secret'
    const event = verifyWebhookSignature(body, signature, webhookSecret)

    if (!event) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Verarbeite verschiedene Event-Typen
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
        break

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Stripe Webhook] Error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

/**
 * Payment erfolgreich - Handler
 */
async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  try {
    const metadata = paymentIntent.metadata || {}
    const tenantId = metadata.tenantId

    if (!tenantId) {
      console.warn('[Stripe Webhook] No tenantId in payment intent metadata')
      return
    }

    // Finde Payment anhand transactionId
    const { prisma } = await import('@/lib/prisma')
    const payment = await prisma.payment.findFirst({
      where: {
        transactionId: paymentIntent.id,
        tenantId: tenantId as string,
      },
    })

    if (payment) {
      // Markiere Payment als bezahlt
      await paymentService.markPaymentPaid(payment.id)
      console.log(`[Stripe Webhook] Payment marked as paid: ${payment.id}`)
    } else {
      console.warn(`[Stripe Webhook] Payment not found for transactionId: ${paymentIntent.id}`)
    }
  } catch (error) {
    console.error('[Stripe Webhook] Error handling payment succeeded:', error)
  }
}

/**
 * Payment fehlgeschlagen - Handler
 */
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  try {
    const metadata = paymentIntent.metadata || {}
    const tenantId = metadata.tenantId

    if (!tenantId) {
      console.warn('[Stripe Webhook] No tenantId in payment intent metadata')
      return
    }

    // Finde Payment anhand transactionId
    const { prisma } = await import('@/lib/prisma')
    const payment = await prisma.payment.findFirst({
      where: {
        transactionId: paymentIntent.id,
        tenantId: tenantId as string,
      },
    })

    if (payment) {
      // Markiere Payment als fehlgeschlagen
      await paymentService.markPaymentFailed(payment.id)
      console.log(`[Stripe Webhook] Payment marked as failed: ${payment.id}`)
    } else {
      console.warn(`[Stripe Webhook] Payment not found for transactionId: ${paymentIntent.id}`)
    }
  } catch (error) {
    console.error('[Stripe Webhook] Error handling payment failed:', error)
  }
}

