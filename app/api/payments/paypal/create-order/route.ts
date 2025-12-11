/**
 * PayPal Create Order API Route
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createPayPalOrder } from '@/payments/paypal'
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

    // Erstelle PayPal Order
    const paypalOrder = await createPayPalOrder({
      amount: parseFloat(amount),
      currency: currency || 'EUR',
      description: description || undefined,
      invoiceId: invoiceId || undefined,
      customerId: customerId || undefined,
    })

    // Erstelle Payment-Eintrag in der Datenbank
    const payment = await paymentService.createPayment({
      tenantId: session.user.tenantId,
      invoiceId: invoiceId || undefined,
      customerId: customerId || undefined,
      amount: parseFloat(amount),
      currency: currency || 'EUR',
      method: 'PAYPAL',
      transactionId: paypalOrder.orderId,
    })

    return NextResponse.json({
      order: {
        id: paypalOrder.orderId,
        approvalUrl: paypalOrder.approvalUrl,
      },
      payment: payment.payment,
    })
  } catch (error) {
    console.error('[PayPal API] Error creating order:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der PayPal Order' },
      { status: 500 }
    )
  }
}

