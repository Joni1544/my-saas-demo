/**
 * Autopilot Service für FuerstFlow
 * Führt automatische Aktionen basierend auf Events aus
 */
import { eventBus } from '@/events/EventBus'
import { automationEngine } from '@/automation/AutomationEngine'
import { prisma } from '@/lib/prisma'
import { EventPayload, EmployeeSickPayload } from '@/events/types/EventTypes'
import { reminderService } from '@/services/invoice/ReminderService'

class AutopilotService {
  private enabled: boolean = true
  private intervalId: NodeJS.Timeout | null = null

  constructor() {
    this.subscribeToEvents()
  }

  /**
   * Events abonnieren
   */
  private subscribeToEvents(): void {
    // Abonniere wichtige Events
    eventBus.subscribe('appointment.created', async (payload) => {
      await this.handleAppointmentCreated(payload)
    })

    eventBus.subscribe('employee.sick', async (payload) => {
      await this.handleEmployeeSick(payload)
    })

    eventBus.subscribe('task.overdue', async (payload) => {
      await this.handleTaskOverdue(payload)
    })
  }

  /**
   * Starte periodische Ausführung
   */
  start(intervalMinutes: number = 60): void {
    if (this.intervalId) {
      this.stop()
    }

    this.intervalId = setInterval(() => {
      this.runPeriodicTasks()
    }, intervalMinutes * 60 * 1000)

    console.log(`[Autopilot] Started with ${intervalMinutes} minute interval`)
  }

  /**
   * Stoppe periodische Ausführung
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
      console.log('[Autopilot] Stopped')
    }
  }

  /**
   * Periodische Aufgaben ausführen
   */
  private async runPeriodicTasks(): Promise<void> {
    if (!this.enabled) {
      return
    }

    try {
      console.log('[Autopilot] Running periodic tasks...')

      // Prüfe überfällige Aufgaben
      await this.checkOverdueTasks()

      // Verarbeite Mahnungen
      await this.processReminders()

      // Prüfe niedrige Inventar-Bestände
      await this.checkLowInventory()

      // Prüfe Termine die neu zugewiesen werden müssen
      await this.checkReassignments()

      console.log('[Autopilot] Periodic tasks completed')
    } catch (error) {
      console.error('[Autopilot] Error in periodic tasks:', error)
    }
  }

  /**
   * Termin erstellt - Handler
   */
  private async handleAppointmentCreated(payload: EventPayload): Promise<void> {
    if (!this.enabled) return

    try {
      // Automation Engine führt bereits Regeln aus
      // Hier können zusätzliche Autopilot-Aktionen erfolgen
      console.log('[Autopilot] Appointment created, checking for follow-up actions')
    } catch (error) {
      console.error('[Autopilot] Error handling appointment created:', error)
    }
  }

  /**
   * Mitarbeiter krank - Handler
   */
  private async handleEmployeeSick(payload: EventPayload): Promise<void> {
    if (!this.enabled) return

    try {
      if (!('employeeId' in payload)) return
      const employeePayload = payload as EmployeeSickPayload
      
      // Automation Engine markiert bereits Termine als NEEDS_REASSIGNMENT
      // Hier können zusätzliche Aktionen erfolgen, z.B. Admin benachrichtigen
      await this.notifyAdmin({
        type: 'employee_sick',
        message: `Mitarbeiter ${employeePayload.employeeId} ist krank. Termine müssen neu zugewiesen werden.`,
        tenantId: payload.tenantId,
      })
    } catch (error) {
      console.error('[Autopilot] Error handling employee sick:', error)
    }
  }

  /**
   * Aufgabe überfällig - Handler
   */
  private async handleTaskOverdue(payload: EventPayload): Promise<void> {
    if (!this.enabled) return

    try {
      // Automation Engine erhöht bereits Priorität
      // Hier können zusätzliche Aktionen erfolgen
      console.log('[Autopilot] Task overdue, checking for escalation')
    } catch (error) {
      console.error('[Autopilot] Error handling task overdue:', error)
    }
  }

  /**
   * Überfällige Aufgaben prüfen
   */
  private async checkOverdueTasks(): Promise<void> {
    try {
      const overdueTasks = await prisma.task.findMany({
        where: {
          deadline: {
            lt: new Date(),
          },
          status: {
            not: 'DONE',
          },
        },
        include: {
          assignedToUser: {
            select: {
              tenantId: true,
            },
          },
        },
      })

      for (const task of overdueTasks) {
        if (task.assignedToUser?.tenantId && task.deadline) {
          eventBus.emit('task.overdue', {
            tenantId: task.assignedToUser.tenantId,
            taskId: task.id,
            assignedTo: task.assignedTo || undefined,
            deadline: task.deadline,
            timestamp: new Date(),
          })
        }
      }
    } catch (error) {
      console.error('[Autopilot] Error checking overdue tasks:', error)
    }
  }

  /**
   * Mahnungen verarbeiten
   */
  private async processReminders(): Promise<void> {
    try {
      // Hole alle Tenants
      const shops = await prisma.shop.findMany({
        select: { tenantId: true },
      })

      for (const shop of shops) {
        // Hole überfällige Rechnungen für diesen Tenant
        const overdueInvoices = await reminderService.getOverdueInvoices(shop.tenantId)

        for (const invoice of overdueInvoices) {
          // Berechne Mahnstufe
          const level = reminderService.calculateReminderLevel(invoice)

          if (level > 0 && invoice.reminderLevel < level) {
            // Erstelle Mahnung
            await reminderService.createReminder(shop.tenantId, invoice.id, level)
            console.log(`[Autopilot] Created reminder level ${level} for invoice ${invoice.id}`)
          }
        }
      }
    } catch (error) {
      console.error('[Autopilot] Error processing reminders:', error)
    }
  }

  /**
   * Niedrige Inventar-Bestände prüfen
   */
  private async checkLowInventory(): Promise<void> {
    try {
      const lowInventoryItems = await prisma.inventoryItem.findMany({
        where: {
          quantity: {
            lte: prisma.inventoryItem.fields.minThreshold,
          },
        },
      })

      for (const item of lowInventoryItems) {
        eventBus.emit('inventory.low', {
          tenantId: item.tenantId,
          itemId: item.id,
          itemName: item.name,
          currentQuantity: item.quantity,
          minThreshold: item.minThreshold,
          timestamp: new Date(),
        })
      }
    } catch (error) {
      console.error('[Autopilot] Error checking low inventory:', error)
    }
  }

  /**
   * Termine prüfen die neu zugewiesen werden müssen
   */
  private async checkReassignments(): Promise<void> {
    try {
      const needsReassignment = await prisma.appointment.findMany({
        where: {
          status: 'NEEDS_REASSIGNMENT',
          startTime: {
            gte: new Date(),
          },
        },
        include: {
          employee: {
            select: {
              tenantId: true,
            },
          },
        },
      })

      if (needsReassignment.length > 0) {
        console.log(`[Autopilot] Found ${needsReassignment.length} appointments needing reassignment`)
        // Hier könnte automatische Neuverteilung erfolgen
      }
    } catch (error) {
      console.error('[Autopilot] Error checking reassignments:', error)
    }
  }

  /**
   * Aufgabe zuweisen
   */
  async assignTask(tenantId: string, taskId: string, userId: string): Promise<void> {
    try {
      await prisma.task.update({
        where: { id: taskId },
        data: { assignedTo: userId },
      })

      console.log(`[Autopilot] Task ${taskId} assigned to user ${userId}`)
    } catch (error) {
      console.error('[Autopilot] Error assigning task:', error)
      throw error
    }
  }

  /**
   * Termine neu planen
   */
  async rescheduleAppointments(employeeId: string, newEmployeeId: string): Promise<void> {
    try {
      const result = await prisma.appointment.updateMany({
        where: {
          employeeId,
          status: 'NEEDS_REASSIGNMENT',
        },
        data: {
          employeeId: newEmployeeId,
          status: 'OPEN',
        },
      })

      console.log(`[Autopilot] Rescheduled ${result.count} appointments`)
    } catch (error) {
      console.error('[Autopilot] Error rescheduling appointments:', error)
      throw error
    }
  }

  /**
   * Rechnungsentwurf erstellen (Dummy)
   */
  async createInvoiceDraft(tenantId: string, customerId: string, amount: number): Promise<string> {
    try {
      // Dummy-Implementierung
      const invoiceId = `INV-${Date.now()}`
      console.log(`[Autopilot] Created invoice draft ${invoiceId} for customer ${customerId}`)
      return invoiceId
    } catch (error) {
      console.error('[Autopilot] Error creating invoice draft:', error)
      throw error
    }
  }

  /**
   * Admin benachrichtigen (Dummy)
   */
  private async notifyAdmin(notification: {
    type: string
    message: string
    tenantId: string
  }): Promise<void> {
    try {
      // Dummy-Implementierung - könnte z.B. E-Mail oder Push-Notification senden
      console.log(`[Autopilot] Notification to admin: ${notification.message}`)
    } catch (error) {
      console.error('[Autopilot] Error notifying admin:', error)
    }
  }

  /**
   * Status abrufen
   */
  getStatus(): { enabled: boolean; running: boolean } {
    return {
      enabled: this.enabled,
      running: this.intervalId !== null,
    }
  }

  /**
   * Aktivieren/Deaktivieren
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    console.log(`[Autopilot] ${enabled ? 'Enabled' : 'Disabled'}`)
  }
}

// Singleton-Instanz
export const autopilotService = new AutopilotService()

// Starte Autopilot automatisch (kann auch manuell gesteuert werden)
if (process.env.AUTOPILOT_ENABLED !== 'false') {
  autopilotService.start(60) // Alle 60 Minuten
}

