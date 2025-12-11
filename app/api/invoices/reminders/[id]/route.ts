/**
 * Invoice Reminder Detail API Route
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { reminderService } from '@/services/invoice/ReminderService'
import { prisma } from '@/lib/prisma'

// GET: Mahnung abrufen
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

    const reminder = await prisma.invoiceReminder.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
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
    })

    if (!reminder) {
      return NextResponse.json(
        { error: 'Mahnung nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json({ reminder })
  } catch (error) {
    console.error('[Invoice Reminder API] Error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Mahnung' },
      { status: 500 }
    )
  }
}

// PUT: Mahnung aktualisieren
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
    const { status, aiText } = body

    if (status === 'SENT') {
      await reminderService.markReminderSent(id)
    } else if (status === 'FAILED') {
      await reminderService.markReminderFailed(id)
    }

    const reminder = await prisma.invoiceReminder.findUnique({
      where: { id },
    })

    return NextResponse.json({ reminder })
  } catch (error) {
    console.error('[Invoice Reminder API] Error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren der Mahnung' },
      { status: 500 }
    )
  }
}

