/**
 * Invoices API Route
 * CRUD für Rechnungen
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { invoiceService } from '@/services/invoice/InvoiceService'

// GET: Rechnungen auflisten
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
    const customerId = searchParams.get('customerId')

    const invoices = await invoiceService.listInvoices(session.user.tenantId, {
      status: status || undefined,
      customerId: customerId || undefined,
    })

    return NextResponse.json({ invoices })
  } catch (error) {
    console.error('[Invoices API] Error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Rechnungen' },
      { status: 500 }
    )
  }
}

// POST: Rechnung erstellen
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
      customerId,
      employeeId,
      appointmentId,
      amount,
      currency,
      description,
      aiDraftText,
      items,
      dueDate,
      templateId,
    } = body

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'amount ist erforderlich und muss > 0 sein' },
        { status: 400 }
      )
    }

    const invoice = await invoiceService.createInvoice({
      tenantId: session.user.tenantId,
      customerId,
      employeeId: employeeId || session.user.id,
      amount: parseFloat(amount),
      currency: currency || 'EUR',
      description,
      aiDraftText,
      items,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      templateId,
    })

    return NextResponse.json({ invoice }, { status: 201 })
  } catch (error) {
    console.error('[Invoices API] Error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Rechnung' },
      { status: 500 }
    )
  }
}
