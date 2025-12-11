/**
 * Invoice Reminders Stats API Route
 * Statistiken für Mahnungen
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { reminderService } from '@/services/invoice/ReminderService'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    // Überfällige Rechnungen
    const overdueInvoices = await reminderService.getOverdueInvoices(session.user.tenantId)
    const overdueCount = overdueInvoices.length

    // Erinnerungen heute gesendet
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayReminders = await prisma.invoiceReminder.count({
      where: {
        tenantId: session.user.tenantId,
        status: 'SENT',
        reminderDate: {
          gte: today,
        },
      },
    })

    // Level-Breakdown
    const level1Count = await prisma.invoiceReminder.count({
      where: {
        tenantId: session.user.tenantId,
        level: 1,
        status: 'PENDING',
      },
    })

    const level2Count = await prisma.invoiceReminder.count({
      where: {
        tenantId: session.user.tenantId,
        level: 2,
        status: 'PENDING',
      },
    })

    const level3Count = await prisma.invoiceReminder.count({
      where: {
        tenantId: session.user.tenantId,
        level: 3,
        status: 'PENDING',
      },
    })

    // Durchschnittliche Days Overdue
    let avgDaysOverdue = 0
    if (overdueInvoices.length > 0) {
      const totalDays = overdueInvoices.reduce((sum, inv) => {
        return sum + reminderService.calculateDaysOverdue(inv.dueDate)
      }, 0)
      avgDaysOverdue = Math.round(totalDays / overdueInvoices.length)
    }

    return NextResponse.json({
      stats: {
        overdueCount,
        todaySent: todayReminders,
        level1Count,
        level2Count,
        level3Count,
        avgDaysOverdue,
      },
    })
  } catch (error) {
    console.error('[Invoice Reminders Stats API] Error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Statistiken' },
      { status: 500 }
    )
  }
}

