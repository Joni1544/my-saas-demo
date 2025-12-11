/**
 * Invoice Reminders API Route
 * CRUD für Mahnungen
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { reminderService } from '@/services/invoice/ReminderService'
import { prisma } from '@/lib/prisma'

// GET: Alle Mahnungen abrufen
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
    const level = searchParams.get('level')
    const status = searchParams.get('status')
    const invoiceId = searchParams.get('invoiceId')

    const where: {
      tenantId: string
      level?: number
      status?: string
      invoiceId?: string
    } = {
      tenantId: session.user.tenantId,
    }

    if (level) where.level = parseInt(level)
    if (status && (status === 'SENT' || status === 'FAILED')) {
      where.status = status
    }
    if (invoiceId) where.invoiceId = invoiceId

    const reminders = await prisma.invoiceReminder.findMany({
      where,
      include: {
        invoice: {
          include: {
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        reminderDate: 'desc',
      },
    })

    return NextResponse.json({ reminders })
  } catch (error) {
    console.error('[Invoice Reminders API] Error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Mahnungen' },
      { status: 500 }
    )
  }
}

// POST: Mahnung erstellen
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
    const { invoiceId, level, method, aiText } = body

    if (!invoiceId || !level) {
      return NextResponse.json(
        { error: 'invoiceId und level sind erforderlich' },
        { status: 400 }
      )
    }

    if (level < 1 || level > 3) {
      return NextResponse.json(
        { error: 'level muss zwischen 1 und 3 liegen' },
        { status: 400 }
      )
    }

    const reminder = await reminderService.createReminder(
      session.user.tenantId,
      invoiceId,
      level,
      method || 'manual',
      aiText
    )

    return NextResponse.json({ reminder }, { status: 201 })
  } catch (error) {
    console.error('[Invoice Reminders API] Error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Mahnung' },
      { status: 500 }
    )
  }
}

