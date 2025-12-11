/**
 * Invoice PDF API Route
 * Generiert PDF aus Rechnung
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { invoicePdfService } from '@/services/pdf/InvoicePdf'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    // Generiere HTML (später PDF)
    const html = await invoicePdfService.generateInvoiceHtml(id, session.user.tenantId)

    // Für jetzt: HTML zurückgeben (später PDF)
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="rechnung-${id}.html"`,
      },
    })
  } catch (error) {
    console.error('[Invoice PDF API] Error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Generieren des PDFs' },
      { status: 500 }
    )
  }
}

