/**
 * PayPal Webhook Route
 * Verarbeitet PayPal Webhook-Events
 */
import { NextRequest, NextResponse } from 'next/server'
import { paymentService } from '@/services/payment/PaymentService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // PayPal Webhook Event verarbeiten
    if (body.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      const resource = body.resource || {}
      const transactionId = resource.id || resource.transaction_id

      if (!transactionId) {
        return NextResponse.json(
          { error: 'Missing transaction ID' },
          { status: 400 }
        )
      }

      // Finde Payment anhand transactionId
      const { prisma } = await import('@/lib/prisma')
      const payment = await prisma.payment.findFirst({
        where: {
          transactionId: transactionId as string,
          method: 'PAYPAL',
        },
      })

      if (payment) {
        // Markiere Payment als bezahlt
        await paymentService.markPaymentPaid(payment.id)
        console.log(`[PayPal Webhook] Payment marked as paid: ${payment.id}`)
      } else {
        console.warn(`[PayPal Webhook] Payment not found for transactionId: ${transactionId}`)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[PayPal Webhook] Error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

