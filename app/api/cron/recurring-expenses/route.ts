/**
 * Cron Job für wiederkehrende Ausgaben
 * Wird täglich ausgeführt (z.B. via Vercel Cron oder externer Service)
 * Prüft alle wiederkehrenden Ausgaben und erstellt neue Einträge
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Security: Prüfe API Key (optional, für Production)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Finde alle wiederkehrenden Ausgaben die heute oder früher ausgeführt werden müssen
    const recurringExpenses = await prisma.expense.findMany({
      where: {
        recurring: true,
        nextExecution: {
          lte: today,
        },
      },
      include: {
        shop: true,
      },
    })

    const createdExpenses = []

    for (const expense of recurringExpenses) {
      // Erstelle neue Ausgabe für heute
      const newExpense = await prisma.expense.create({
        data: {
          title: expense.title,
          amount: expense.amount,
          date: today,
          category: expense.category,
          description: expense.description,
          employeeId: expense.employeeId,
          recurring: true,
          frequency: expense.frequency,
          tenantId: expense.tenantId,
          invoiceUrl: expense.invoiceUrl,
        },
      })

      // Berechne nächstes Ausführungsdatum
      let nextExecution = new Date(today)
      switch (expense.frequency) {
        case 'DAILY':
          nextExecution.setDate(nextExecution.getDate() + 1)
          break
        case 'WEEKLY':
          nextExecution.setDate(nextExecution.getDate() + 7)
          break
        case 'MONTHLY':
          nextExecution.setMonth(nextExecution.getMonth() + 1)
          break
        case 'YEARLY':
          nextExecution.setFullYear(nextExecution.getFullYear() + 1)
          break
        default:
          nextExecution.setDate(nextExecution.getDate() + 1)
      }

      // Aktualisiere nextExecution der ursprünglichen Ausgabe
      await prisma.expense.update({
        where: { id: expense.id },
        data: { nextExecution },
      })

      createdExpenses.push(newExpense.id)
    }

    return NextResponse.json({
      message: 'Wiederkehrende Ausgaben verarbeitet',
      count: createdExpenses.length,
      createdExpenses,
    })
  } catch (error) {
    console.error('Fehler beim Verarbeiten wiederkehrender Ausgaben:', error)
    return NextResponse.json(
      { error: 'Fehler beim Verarbeiten wiederkehrender Ausgaben' },
      { status: 500 }
    )
  }
}

