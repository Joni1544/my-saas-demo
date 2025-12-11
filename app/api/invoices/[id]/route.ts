/**
 * Invoice Detail API Route
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { invoiceService } from '@/services/invoice/InvoiceService'

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

    const invoice = await invoiceService.getInvoice(id, session.user.tenantId)

    if (!invoice) {
      return NextResponse.json(
        { error: 'Rechnung nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json({ invoice })
  } catch (error) {
    console.error('[Invoice API] Error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Rechnung' },
      { status: 500 }
    )
  }
}

// PUT: Rechnung aktualisieren
export async function PUT(
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

    const body = await request.json()
    const { templateId } = body

    const { prisma } = await import('@/lib/prisma')
    const invoice = await prisma.invoice.updateMany({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
      data: {
        ...(templateId !== undefined && { templateId }),
      },
    })

    if (invoice.count === 0) {
      return NextResponse.json(
        { error: 'Rechnung nicht gefunden' },
        { status: 404 }
      )
    }

    const updatedInvoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        employee: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        payments: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    return NextResponse.json({ invoice: updatedInvoice })
  } catch (error) {
    console.error('[Invoice API] Error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren der Rechnung' },
      { status: 500 }
    )
  }
}

