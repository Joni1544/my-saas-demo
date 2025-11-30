/**
 * Expense Detail API Route
 * GET, PUT, DELETE für einzelne Ausgabe
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Einzelne Ausgabe abrufen
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const session = await auth()

    if (!session?.user?.tenantId || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 403 }
      )
    }

    const expense = await prisma.expense.findFirst({
      where: {
        id: id,
        tenantId: session.user.tenantId,
      },
      include: {
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
        recurringExpense: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!expense) {
      return NextResponse.json(
        { error: 'Ausgabe nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json({ expense })
  } catch (error) {
    console.error('Fehler beim Abrufen der Ausgabe:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Ausgabe' },
      { status: 500 }
    )
  }
}

// PUT: Ausgabe aktualisieren
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const session = await auth()

    if (!session?.user?.tenantId || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, title, amount, date, category, description, employeeId, recurringExpenseId, invoiceUrl } = body

    // Unterstütze sowohl 'name' als auch 'title' für Kompatibilität
    const expenseName = name || title

    const expense = await prisma.expense.updateMany({
      where: {
        id: id,
        tenantId: session.user.tenantId,
      },
      data: {
        ...(expenseName && { name: expenseName }),
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(date && { date: new Date(date) }),
        ...(category && { category }),
        ...(description !== undefined && { description }),
        ...(employeeId !== undefined && { employeeId }),
        ...(recurringExpenseId !== undefined && { recurringExpenseId }),
        ...(invoiceUrl !== undefined && { invoiceUrl }),
      },
    })

    if (expense.count === 0) {
      return NextResponse.json(
        { error: 'Ausgabe nicht gefunden' },
        { status: 404 }
      )
    }

    const updatedExpense = await prisma.expense.findUnique({
      where: { id: id },
      include: {
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
        recurringExpense: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({ expense: updatedExpense })
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Ausgabe:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren der Ausgabe' },
      { status: 500 }
    )
  }
}

// DELETE: Ausgabe löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const session = await auth()

    if (!session?.user?.tenantId || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 403 }
      )
    }

    const expense = await prisma.expense.deleteMany({
      where: {
        id: id,
        tenantId: session.user.tenantId,
      },
    })

    if (expense.count === 0) {
      return NextResponse.json(
        { error: 'Ausgabe nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Ausgabe erfolgreich gelöscht' })
  } catch (error) {
    console.error('Fehler beim Löschen der Ausgabe:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen der Ausgabe' },
      { status: 500 }
    )
  }
}

