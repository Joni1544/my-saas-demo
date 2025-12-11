/**
 * Payment Search API Route
 * Suche nach Zahlungen
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
    const query = searchParams.get('query')

    if (!query || query.length < 2) {
      return NextResponse.json({ payments: [] })
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

    // Suche in verschiedenen Feldern
    const payments = await prisma.payment.findMany({
      where: {
        tenantId: shop.id, // Verweist auf Shop.id (Foreign Key)
        OR: [
          { reference: { contains: query, mode: 'insensitive' } },
          { transactionId: { contains: query, mode: 'insensitive' } },
          {
            customer: {
              OR: [
                { firstName: { contains: query, mode: 'insensitive' } },
                { lastName: { contains: query, mode: 'insensitive' } },
              ],
            },
          },
          {
            invoice: {
              invoiceNumber: { contains: query, mode: 'insensitive' },
            },
          },
        ],
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
          },
        },
      },
      take: 50,
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ payments })
  } catch (error) {
    console.error('[Payment Search API] Error:', error)
    return NextResponse.json(
      { error: 'Fehler bei der Suche' },
      { status: 500 }
    )
  }
}

