/**
 * Auto-Generate Salary Expenses
 * Wird aufgerufen wenn Ausgaben- oder Finanzen-Seite geöffnet wird
 * Generiert automatisch Gehalts-Ausgaben für den aktuellen Monat
 */
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ExpenseCategory } from '@prisma/client'
import { startOfMonth, endOfMonth } from 'date-fns'

export async function POST() {
  try {
    const session = await auth()

    if (!session?.user?.tenantId || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 403 }
      )
    }

    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    // Alle aktiven Mitarbeiter mit Gehalt abrufen
    const employees = await prisma.employee.findMany({
      where: {
        tenantId: session.user.tenantId,
        active: true,
        isActive: true,
        salary: {
          gt: 0,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    const createdExpenses = []

    for (const employee of employees) {
      // Prüfe ob für diesen Monat bereits eine Gehalts-Ausgabe existiert
      const existingExpense = await prisma.expense.findFirst({
        where: {
          tenantId: session.user.tenantId,
          employeeId: employee.id,
          category: ExpenseCategory.GEHALT,
          date: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      })

      if (existingExpense) {
        continue // Bereits generiert
      }

      // Erstelle Gehalts-Ausgabe am payoutDay des Monats
      const payoutDate = new Date(now.getFullYear(), now.getMonth(), employee.payoutDay || 1)
      
      // Falls payoutDay bereits vorbei, setze auf heute
      if (payoutDate < now) {
        payoutDate.setDate(now.getDate())
      }

      const expense = await prisma.expense.create({
        data: {
          name: `Gehalt • ${employee.user.name || employee.user.email}`,
          amount: employee.salary,
          date: payoutDate,
          category: ExpenseCategory.GEHALT,
          description: `Automatisch generiertes Gehalt für ${employee.user.name || employee.user.email} - ${now.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}`,
          employeeId: employee.id,
          tenantId: session.user.tenantId,
        },
      })

      createdExpenses.push(expense.id)
    }

    return NextResponse.json({
      message: 'Gehalts-Ausgaben generiert',
      count: createdExpenses.length,
      createdExpenses,
    })
  } catch (error) {
    console.error('Fehler beim Generieren der Gehalts-Ausgaben:', error)
    return NextResponse.json(
      { error: 'Fehler beim Generieren der Gehalts-Ausgaben' },
      { status: 500 }
    )
  }
}

