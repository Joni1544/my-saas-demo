/**
 * Customer Payments API Route
 * Zahlungen eines Kunden abrufen
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    // Konvertiere tenantId (Shop.tenantId) zu shopId (Shop.id)
    const shop = await prisma.shop.findUnique({
      where: { tenantId: session.user.tenantId },
      select: { id: true },
    })

    if (!shop) {
      return NextResponse.json(
        { error: 'Tenant nicht gefunden' },
        { status: 404 }
      )
    }

    // Prüfe ob Kunde existiert und zum Tenant gehört
    const customer = await prisma.customer.findFirst({
      where: {
        id,
        tenantId: shop.id, // Verweist auf Shop.id (Foreign Key)
      },
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Kunde nicht gefunden' },
        { status: 404 }
      )
    }

    // Hole alle Zahlungen des Kunden
    const payments = await prisma.payment.findMany({
      where: {
        tenantId: shop.id, // Verweist auf Shop.id (Foreign Key)
        customerId: id,
      },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            amount: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Berechne Statistiken
    const paidPayments = payments.filter((p) => p.status === 'PAID')
    const totalPaid = paidPayments.reduce((sum, p) => sum + Number(p.amount), 0)
    const averageAmount =
      paidPayments.length > 0 ? totalPaid / paidPayments.length : 0

    // Beliebteste Zahlungsart
    const methodCounts: Record<string, number> = {}
    paidPayments.forEach((p) => {
      methodCounts[p.method] = (methodCounts[p.method] || 0) + 1
    })
    const preferredMethod = Object.entries(methodCounts).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0]

    // Offene Rechnungen
    const openInvoices = await prisma.invoice.findMany({
      where: {
        tenantId: shop.id, // Verweist auf Shop.id (Foreign Key)
        customerId: id,
        status: {
          in: ['PENDING', 'OVERDUE'],
        },
      },
      include: {
        payments: {
          where: {
            status: 'PAID',
          },
        },
      },
    })

    return NextResponse.json({
      payments,
      stats: {
        totalPaid,
        averageAmount,
        preferredMethod,
        paymentCount: paidPayments.length,
        openInvoices: openInvoices.length,
        openInvoiceAmount: openInvoices.reduce(
          (sum, inv) => sum + Number(inv.amount),
          0
        ),
      },
    })
  } catch (error) {
    console.error('[Customer Payments API] Error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Zahlungen' },
      { status: 500 }
    )
  }
}

