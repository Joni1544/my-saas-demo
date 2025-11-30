/**
 * Recurring Expenses API Route
 * GET: Liste aller Daueraufträge (nur für interne Verwendung - Gehälter)
 * POST: Neuen Dauerauftrag erstellen (nur für interne Verwendung - Gehälter)
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Alle Daueraufträge abrufen (nur für interne Verwendung)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const where: {
      tenantId: string
      isActive?: boolean
    } = {
      tenantId: session.user.tenantId,
    }

    if (!includeInactive) {
      where.isActive = true
    }

    const recurringExpenses = await prisma.recurringExpense.findMany({
      where,
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
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ recurringExpenses })
  } catch (error) {
    console.error('Fehler beim Abrufen der Daueraufträge:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Daueraufträge' },
      { status: 500 }
    )
  }
}

// POST: Neuen Dauerauftrag erstellen (nur für interne Verwendung - Gehälter)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, amount, category, interval, startDate, nextRun, description, isActive, employeeId, dayOfMonth } = body

    if (!name || !amount || !category || !interval || !startDate || !nextRun) {
      return NextResponse.json(
        { error: 'Name, Betrag, Kategorie, Intervall, Startdatum und nächstes Ausführungsdatum sind erforderlich' },
        { status: 400 }
      )
    }

    const recurringExpense = await prisma.recurringExpense.create({
      data: {
        name,
        amount: parseFloat(amount),
        category: category as 'GEHALT' | 'MIETE' | 'MARKETING' | 'MATERIAL' | 'VERSICHERUNG' | 'STEUERN' | 'SONSTIGES',
        interval: interval as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY',
        startDate: new Date(startDate),
        nextRun: new Date(nextRun),
        description: description || null,
        isActive: isActive !== undefined ? isActive : true,
        employeeId: employeeId || null,
        dayOfMonth: dayOfMonth || null,
        tenantId: session.user.tenantId,
      },
    })

    return NextResponse.json({ recurringExpense }, { status: 201 })
  } catch (error) {
    console.error('Fehler beim Erstellen des Dauerauftrags:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Dauerauftrags' },
      { status: 500 }
    )
  }
}

