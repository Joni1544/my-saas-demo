/**
 * Cron Job für automatische Gehalts-Ausgaben
 * Wird monatlich am 1. ausgeführt
 * Erstellt automatisch Ausgaben für alle Mitarbeiter mit FIXED Gehalt
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Security: Prüfe API Key
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = new Date()
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    // Finde alle aktiven Mitarbeiter mit FIXED Gehalt
    const employees = await prisma.employee.findMany({
      where: {
        isActive: true,
        active: true,
        salaryType: 'FIXED',
        baseSalary: {
          not: null,
        },
      },
      include: {
        shop: true,
        user: true,
      },
    })

    const createdExpenses = []

    for (const employee of employees) {
      // Prüfe ob bereits eine Gehalts-Ausgabe für diesen Monat existiert
      const existingExpense = await prisma.expense.findFirst({
        where: {
          tenantId: employee.tenantId,
          employeeId: employee.id,
          category: 'GEHALT',
          date: {
            gte: firstOfMonth,
            lt: new Date(today.getFullYear(), today.getMonth() + 1, 1),
          },
        },
      })

      if (existingExpense) {
        continue // Überspringe wenn bereits vorhanden
      }

      // Erstelle Gehalts-Ausgabe
      const expense = await prisma.expense.create({
        data: {
          name: `Gehalt ${employee.user.name || employee.user.email} - ${firstOfMonth.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}`,
          amount: employee.baseSalary!,
          date: firstOfMonth,
          category: 'GEHALT',
          description: `Automatisch generiertes Gehalt für ${employee.user.name || employee.user.email}`,
          employeeId: employee.id,
          tenantId: employee.tenantId,
        },
      })

      createdExpenses.push(expense.id)
    }

    return NextResponse.json({
      message: 'Gehalts-Ausgaben erstellt',
      count: createdExpenses.length,
      createdExpenses,
    })
  } catch (error) {
    console.error('Fehler beim Erstellen der Gehalts-Ausgaben:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Gehalts-Ausgaben' },
      { status: 500 }
    )
  }
}

