/**
 * Expenses API Route
 * GET: Liste aller Ausgaben (gefiltert nach Tenant und Rolle)
 * POST: Neue Ausgabe erstellen
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Alle Ausgaben abrufen
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    // Nur Admin kann alle Ausgaben sehen
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert. Nur Administratoren können Ausgaben einsehen.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const category = searchParams.get('category')
    const employeeId = searchParams.get('employeeId')
    const where: {
      tenantId: string
      date?: { gte: Date; lte: Date }
      category?: 'GEHALT' | 'MIETE' | 'MARKETING' | 'MATERIAL' | 'VERSICHERUNG' | 'STEUERN' | 'SONSTIGES'
      employeeId?: string
    } = {
      tenantId: session.user.tenantId,
    }

    // Datumsfilter
    if (startDate && endDate) {
      // Sicherstellen, dass Datum korrekt gesetzt wird (inkl. Zeit)
      const start = new Date(startDate + 'T00:00:00.000Z')
      const end = new Date(endDate + 'T23:59:59.999Z')
      where.date = {
        gte: start,
        lte: end,
      }
    }

    // Kategoriefilter
    if (category) {
      // Validiere Kategorie
      const validCategories = ['GEHALT', 'MIETE', 'MARKETING', 'MATERIAL', 'VERSICHERUNG', 'STEUERN', 'SONSTIGES']
      if (validCategories.includes(category)) {
        where.category = category as 'GEHALT' | 'MIETE' | 'MARKETING' | 'MATERIAL' | 'VERSICHERUNG' | 'STEUERN' | 'SONSTIGES'
      }
    }

    // Mitarbeiterfilter
    if (employeeId) {
      where.employeeId = employeeId
    }

    const expenses = await prisma.expense.findMany({
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
        recurringExpense: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json({ expenses })
  } catch (error) {
    console.error('Fehler beim Abrufen der Ausgaben:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Ausgaben' },
      { status: 500 }
    )
  }
}

// POST: Neue Ausgabe erstellen
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert. Nur Administratoren können Ausgaben erstellen.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, title, amount, date, category, description, employeeId, recurringExpenseId, invoiceUrl } = body

    // Unterstütze sowohl 'name' als auch 'title' für Kompatibilität
    const expenseName = name || title

    if (!expenseName || !amount || !date || !category) {
      return NextResponse.json(
        { error: 'Name, Betrag, Datum und Kategorie sind erforderlich' },
        { status: 400 }
      )
    }

    // Validiere Kategorie
    const validCategories = ['GEHALT', 'MIETE', 'MARKETING', 'MATERIAL', 'VERSICHERUNG', 'STEUERN', 'SONSTIGES']
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Ungültige Kategorie' },
        { status: 400 }
      )
    }

    const expense = await prisma.expense.create({
      data: {
        name: expenseName,
        amount: parseFloat(amount),
        date: new Date(date),
        category: category as 'GEHALT' | 'MIETE' | 'MARKETING' | 'MATERIAL' | 'VERSICHERUNG' | 'STEUERN' | 'SONSTIGES',
        description: description || null,
        employeeId: employeeId || null,
        recurringExpenseId: recurringExpenseId || null,
        invoiceUrl: invoiceUrl || null,
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
      },
    })

    return NextResponse.json({ expense }, { status: 201 })
  } catch (error) {
    console.error('Fehler beim Erstellen der Ausgabe:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Ausgabe' },
      { status: 500 }
    )
  }
}

