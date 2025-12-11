/**
 * Payment API Route: Zahlungen auflisten
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { paymentService } from '@/services/payment/PaymentService'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const method = searchParams.get('method')
    const customerId = searchParams.get('customerId')
    const invoiceId = searchParams.get('invoiceId')

    const payments = await paymentService.listPayments(session.user.tenantId, {
      status: status || undefined,
      method: method || undefined,
      customerId: customerId || undefined,
      invoiceId: invoiceId || undefined,
    })

    return NextResponse.json({ payments })
  } catch (error) {
    console.error('[Payments API] Error listing payments:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Zahlungen' },
      { status: 500 }
    )
  }
}

