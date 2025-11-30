/**
 * Recurring Expense Detail API Route
 * GET, PATCH, DELETE für einzelnen Dauerauftrag
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Einzelnen Dauerauftrag abrufen
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user?.tenantId || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 403 }
      )
    }

    const recurringExpense = await prisma.recurringExpense.findFirst({
      where: {
        id: id,
        tenantId: session.user.tenantId,
      },
      include: {
        expenses: {
          take: 10,
          orderBy: { date: 'desc' },
        },
      },
    })

    if (!recurringExpense) {
      return NextResponse.json(
        { error: 'Dauerauftrag nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json({ recurringExpense })
  } catch (error) {
    console.error('Fehler beim Abrufen des Dauerauftrags:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen des Dauerauftrags' },
      { status: 500 }
    )
  }
}

// PATCH: Dauerauftrag aktualisieren
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user?.tenantId || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, amount, category, interval, startDate, nextRun, description, isActive } = body

    // Prüfe ob Dauerauftrag existiert
    const existing = await prisma.recurringExpense.findFirst({
      where: {
        id: id,
        tenantId: session.user.tenantId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Dauerauftrag nicht gefunden' },
        { status: 404 }
      )
    }

    const updateData: {
      name?: string
      amount?: number
      category?: string
      interval?: string
      startDate?: Date
      nextRun?: Date
      description?: string | null
      isActive?: boolean
    } = {}

    if (name !== undefined) updateData.name = name
    if (amount !== undefined) updateData.amount = parseFloat(amount)
    if (category !== undefined) updateData.category = category
    if (interval !== undefined) {
      if (!['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(interval)) {
        return NextResponse.json(
          { error: 'Ungültiges Intervall' },
          { status: 400 }
        )
      }
      updateData.interval = interval
    }
    if (startDate !== undefined) updateData.startDate = new Date(startDate)
    if (nextRun !== undefined) updateData.nextRun = new Date(nextRun)
    if (description !== undefined) updateData.description = description
    if (isActive !== undefined) updateData.isActive = isActive

    const updated = await prisma.recurringExpense.update({
      where: { id: id },
      data: updateData,
    })

    return NextResponse.json({ recurringExpense: updated })
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Dauerauftrags:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des Dauerauftrags' },
      { status: 500 }
    )
  }
}

// DELETE: Dauerauftrag löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user?.tenantId || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 403 }
      )
    }

    const recurringExpense = await prisma.recurringExpense.deleteMany({
      where: {
        id: id,
        tenantId: session.user.tenantId,
      },
    })

    if (recurringExpense.count === 0) {
      return NextResponse.json(
        { error: 'Dauerauftrag nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Dauerauftrag erfolgreich gelöscht' })
  } catch (error) {
    console.error('Fehler beim Löschen des Dauerauftrags:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Dauerauftrags' },
      { status: 500 }
    )
  }
}

