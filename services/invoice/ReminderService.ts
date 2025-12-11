/**
 * Reminder Service für FuerstFlow
 * Verwaltet Mahnungen für überfällige Rechnungen
 */
import { prisma } from '@/lib/prisma'
import { eventBus } from '@/events/EventBus'

interface ReminderConfig {
  level1Days: number // Tage bis Level 1
  level2Days: number // Tage bis Level 2
  level3Days: number // Tage bis Level 3
}

const DEFAULT_REMINDER_CONFIG: ReminderConfig = {
  level1Days: 3,
  level2Days: 10,
  level3Days: 20,
}

class ReminderService {
  /**
   * Überfällige Rechnungen abrufen
   */
  async getOverdueInvoices(tenantId: string) {
    try {
      const now = new Date()
      
      const overdueInvoices = await prisma.invoice.findMany({
        where: {
          tenantId,
          status: {
            in: ['PENDING', 'OVERDUE'],
          },
          dueDate: {
            lt: now,
          },
          paidAt: null, // Noch nicht bezahlt
        },
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          payments: {
            where: {
              status: 'PAID',
            },
          },
        },
        orderBy: {
          dueDate: 'asc',
        },
      })

      return overdueInvoices
    } catch (error) {
      console.error('[ReminderService] Error getting overdue invoices:', error)
      throw error
    }
  }

  /**
   * Mahnstufe berechnen
   */
  calculateReminderLevel(invoice: { dueDate: Date | null; reminderLevel: number }, config?: ReminderConfig): number {
    if (!invoice.dueDate) {
      return 0
    }

    const configToUse = config || DEFAULT_REMINDER_CONFIG
    const now = new Date()
    const daysOverdue = Math.floor((now.getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24))

    if (daysOverdue >= configToUse.level3Days) {
      return 3
    } else if (daysOverdue >= configToUse.level2Days) {
      return 2
    } else if (daysOverdue >= configToUse.level1Days) {
      return 1
    }

    return 0
  }

  /**
   * Mahnung erstellen
   */
  async createReminder(
    tenantId: string,
    invoiceId: string,
    level: number,
    method: string = 'manual',
    aiText?: string
  ) {
    try {
      // Prüfe ob Rechnung bereits bezahlt wurde
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          payments: {
            where: {
              status: 'PAID',
            },
          },
        },
      })

      if (!invoice || invoice.status === 'PAID') {
        throw new Error('Rechnung ist bereits bezahlt')
      }

      // Erstelle Mahnung
      const reminder = await prisma.invoiceReminder.create({
        data: {
          tenantId,
          invoiceId,
          level,
          status: 'PENDING',
          method,
          aiText: aiText || null,
        },
      })

      // Aktualisiere reminderLevel in Invoice
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          reminderLevel: level,
          status: 'OVERDUE',
        },
      })

      // Event emittieren
      eventBus.emit('invoice.reminder_created', {
        tenantId,
        invoiceId,
        reminderId: reminder.id,
        level,
        timestamp: new Date(),
      })

      return reminder
    } catch (error) {
      console.error('[ReminderService] Error creating reminder:', error)
      throw error
    }
  }

  /**
   * Mahnung als gesendet markieren
   */
  async markReminderSent(reminderId: string) {
    try {
      const reminder = await prisma.invoiceReminder.update({
        where: { id: reminderId },
        data: {
          status: 'SENT',
        },
        include: {
          invoice: true,
        },
      })

      // Event emittieren
      eventBus.emit('invoice.reminder_sent', {
        tenantId: reminder.tenantId,
        invoiceId: reminder.invoiceId,
        reminderId: reminder.id,
        level: reminder.level,
        timestamp: new Date(),
      })

      return reminder
    } catch (error) {
      console.error('[ReminderService] Error marking reminder sent:', error)
      throw error
    }
  }

  /**
   * Mahnung als fehlgeschlagen markieren
   */
  async markReminderFailed(reminderId: string) {
    try {
      const reminder = await prisma.invoiceReminder.update({
        where: { id: reminderId },
        data: {
          status: 'FAILED',
        },
      })

      // Event emittieren
      eventBus.emit('invoice.reminder_failed', {
        tenantId: reminder.tenantId,
        invoiceId: reminder.invoiceId,
        reminderId: reminder.id,
        level: reminder.level,
        timestamp: new Date(),
      })

      return reminder
    } catch (error) {
      console.error('[ReminderService] Error marking reminder failed:', error)
      throw error
    }
  }

  /**
   * Alle Mahnungen für eine Rechnung abrufen
   */
  async getInvoiceReminders(invoiceId: string) {
    try {
      const reminders = await prisma.invoiceReminder.findMany({
        where: {
          invoiceId,
        },
        orderBy: {
          reminderDate: 'desc',
        },
      })

      return reminders
    } catch (error) {
      console.error('[ReminderService] Error getting invoice reminders:', error)
      throw error
    }
  }

  /**
   * Mahnungen stoppen (wenn Rechnung bezahlt wurde)
   */
  async stopReminders(invoiceId: string) {
    try {
      // Setze reminderLevel auf 0
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          reminderLevel: 0,
        },
      })

      // Event emittieren
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
      })

      if (invoice) {
        eventBus.emit('invoice.reminder_stopped', {
          tenantId: invoice.tenantId,
          invoiceId,
          timestamp: new Date(),
        })
      }
    } catch (error) {
      console.error('[ReminderService] Error stopping reminders:', error)
      throw error
    }
  }

  /**
   * Tage überfällig berechnen
   */
  calculateDaysOverdue(dueDate: Date | null): number {
    if (!dueDate) {
      return 0
    }

    const now = new Date()
    const days = Math.floor((now.getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(0, days)
  }
}

// Singleton-Instanz
export const reminderService = new ReminderService()

