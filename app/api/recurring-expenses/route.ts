/**
 * Recurring Expenses API Route
 * GET: Liste aller Daueraufträge
 * POST: Neuen Dauerauftrag erstellen
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Alle Daueraufträge abrufen
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert. Nur Administratoren können Daueraufträge einsehen.' },
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
      orderBy: [
        { isActive: 'desc' },
        { nextRun: 'asc' },
      ],
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

// POST: Neuen Dauerauftrag erstellen
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert. Nur Administratoren können Daueraufträge erstellen.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, amount, category, interval, startDate, description, isActive } = body

    if (!name || !amount || !category || !interval || !startDate) {
      return NextResponse.json(
        { error: 'Name, Betrag, Kategorie, Intervall und Startdatum sind erforderlich' },
        { status: 400 }
      )
    }

    // Validiere Intervall
    if (!['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(interval)) {
      return NextResponse.json(
        { error: 'Ungültiges Intervall. Erlaubt: DAILY, WEEKLY, MONTHLY, YEARLY' },
        { status: 400 }
      )
    }

    // Berechne nextRun basierend auf startDate und interval
    const start = new Date(startDate)
    let nextRun = new Date(start)

    // Wenn startDate in der Vergangenheit liegt, setze nextRun auf heute oder später
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (start < today) {
      // Berechne das nächste Ausführungsdatum
      switch (interval) {
        case 'DAILY':
          nextRun = new Date(today)
          if (nextRun <= start) {
            nextRun.setDate(nextRun.getDate() + 1)
          }
          break
        case 'WEEKLY':
          nextRun = new Date(today)
          const daysUntilNext = (7 - (nextRun.getDay() - start.getDay() + 7) % 7) % 7
          if (daysUntilNext === 0 && nextRun <= start) {
            nextRun.setDate(nextRun.getDate() + 7)
          } else {
            nextRun.setDate(nextRun.getDate() + daysUntilNext)
          }
          break
        case 'MONTHLY':
          nextRun = new Date(today.getFullYear(), today.getMonth(), start.getDate())
          if (nextRun <= start || nextRun < today) {
            nextRun.setMonth(nextRun.getMonth() + 1)
          }
          break
        case 'YEARLY':
          nextRun = new Date(today.getFullYear(), start.getMonth(), start.getDate())
          if (nextRun <= start || nextRun < today) {
            nextRun.setFullYear(nextRun.getFullYear() + 1)
          }
          break
      }
    }

    // Validiere Kategorie
    const validCategories = ['GEHALT', 'MIETE', 'MARKETING', 'MATERIAL', 'VERSICHERUNG', 'STEUERN', 'SONSTIGES']
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Ungültige Kategorie' },
        { status: 400 }
      )
    }

    const recurringExpense = await prisma.recurringExpense.create({
      data: {
        name,
        amount: parseFloat(amount),
        category: category as 'GEHALT' | 'MIETE' | 'MARKETING' | 'MATERIAL' | 'VERSICHERUNG' | 'STEUERN' | 'SONSTIGES',
        interval,
        startDate: new Date(startDate),
        nextRun,
        description: description || null,
        isActive: isActive !== undefined ? isActive : true,
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

