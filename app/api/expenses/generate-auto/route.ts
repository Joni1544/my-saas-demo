/**
 * Auto-Generate Expenses API Route
 * POST: Prüft fällige Daueraufträge und erstellt automatisch Ausgaben
 * Wird vom Frontend bei jedem Dashboard/Ausgaben-Page-Load aufgerufen
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 403 }
      )
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Finde alle aktiven Daueraufträge die fällig sind
    const dueRecurringExpenses = await prisma.recurringExpense.findMany({
      where: {
        tenantId: session.user.tenantId,
        isActive: true,
        nextRun: {
          lte: today,
        },
      },
    })

    const generatedExpenses = []

    for (const recurring of dueRecurringExpenses) {
      // Prüfe ob bereits eine Ausgabe für dieses Datum existiert
      const existingExpense = await prisma.expense.findFirst({
        where: {
          tenantId: session.user.tenantId,
          recurringExpenseId: recurring.id,
          date: {
            gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
            lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
          },
        },
      })

      if (existingExpense) {
        // Überspringe wenn bereits vorhanden
        continue
      }

      // Erstelle neue Ausgabe
      const expense = await prisma.expense.create({
        data: {
          name: recurring.name,
          amount: recurring.amount,
          date: today,
          category: recurring.category,
          description: recurring.description || null,
          recurringExpenseId: recurring.id,
          tenantId: session.user.tenantId,
        },
      })

      // Berechne nächstes Ausführungsdatum
      let nextRun = new Date(today)
      switch (recurring.interval) {
        case 'DAILY':
          nextRun.setDate(nextRun.getDate() + 1)
          break
        case 'WEEKLY':
          nextRun.setDate(nextRun.getDate() + 7)
          break
        case 'MONTHLY':
          nextRun.setMonth(nextRun.getMonth() + 1)
          break
        case 'YEARLY':
          nextRun.setFullYear(nextRun.getFullYear() + 1)
          break
      }

      // Aktualisiere nextRun
      await prisma.recurringExpense.update({
        where: { id: recurring.id },
        data: { nextRun },
      })

      generatedExpenses.push(expense.id)
    }

    return NextResponse.json({
      message: 'Automatische Ausgaben generiert',
      count: generatedExpenses.length,
      generatedExpenses,
    })
  } catch (error) {
    console.error('Fehler beim Generieren der Ausgaben:', error)
    return NextResponse.json(
      { error: 'Fehler beim Generieren der Ausgaben' },
      { status: 500 }
    )
  }
}

