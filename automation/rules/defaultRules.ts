/**
 * Standard-Automation-Regeln für FuerstFlow
 * Diese Regeln werden bei der Initialisierung der AutomationEngine registriert
 */
import { EventPayload, AppointmentCreatedPayload, EmployeeSickPayload, InvoiceOverduePayload, InventoryLowPayload, TaskOverduePayload, PaymentPaidPayload, PaymentFailedPayload } from '@/events/types/EventTypes'
import { prisma } from '@/lib/prisma'

export interface AutomationRule {
  eventName: string
  condition?: (payload: EventPayload) => Promise<boolean> | boolean
  action: (payload: EventPayload) => Promise<void>
  description: string
}

/**
 * Standard-Regeln
 */
export const defaultRules: AutomationRule[] = [
  {
    eventName: 'appointment.created',
    description: 'Erstelle Aufgabe für Kunde ohne nächste Aufgabe',
    condition: async (payload) => {
      if (!('customerId' in payload)) return false
      const appointmentPayload = payload as AppointmentCreatedPayload
      if (!appointmentPayload.customerId) return false

      // Prüfe ob Kunde bereits eine offene Aufgabe hat
      const existingTask = await prisma.task.findFirst({
        where: {
          tenantId: payload.tenantId,
          status: {
            in: ['TODO', 'IN_PROGRESS'],
          },
          // Hier müsste eine Verbindung zwischen Task und Customer existieren
          // Für jetzt prüfen wir nur ob es überhaupt offene Tasks gibt
        },
      })

      return !existingTask
    },
    action: async (payload) => {
      if (!('customerId' in payload)) return
      const appointmentPayload = payload as AppointmentCreatedPayload
      if (!appointmentPayload.customerId) return

      try {
        // Erstelle Follow-up Aufgabe
        await prisma.task.create({
          data: {
            title: 'Kunden-Follow-up',
            description: `Follow-up für Termin am ${new Date(appointmentPayload.startTime).toLocaleDateString('de-DE')}`,
            status: 'TODO',
            priority: 'MEDIUM',
            tenantId: payload.tenantId,
            // assignedTo würde hier gesetzt werden, falls gewünscht
          },
        })

        console.log(`[Automation] Task created for appointment ${appointmentPayload.appointmentId}`)
      } catch (error) {
        console.error('[Automation] Failed to create task for appointment', error)
      }
    },
  },

  {
    eventName: 'employee.sick',
    description: 'Markiere alle Termine als NEEDS_REASSIGNMENT wenn Mitarbeiter krank wird',
    action: async (payload) => {
      if (!('employeeId' in payload)) return
      const employeePayload = payload as EmployeeSickPayload
      if (!employeePayload.employeeId) return

      try {
        // Finde alle zukünftigen Termine des Mitarbeiters
        const futureAppointments = await prisma.appointment.findMany({
          where: {
            tenantId: payload.tenantId,
            employeeId: employeePayload.employeeId,
            startTime: {
              gte: new Date(),
            },
            status: {
              not: 'CANCELLED',
            },
          },
        })

        // Aktualisiere alle Termine
        await prisma.appointment.updateMany({
          where: {
            id: {
              in: futureAppointments.map((apt) => apt.id),
            },
          },
          data: {
            status: 'NEEDS_REASSIGNMENT',
          },
        })

        console.log(`[Automation] Marked ${futureAppointments.length} appointments as NEEDS_REASSIGNMENT for sick employee`)
      } catch (error) {
        console.error('[Automation] Failed to reassign appointments for sick employee', error)
      }
    },
  },

  {
    eventName: 'invoice.overdue',
    description: 'Erstelle Eintrag im CRM für überfällige Rechnung',
    action: async (payload) => {
      if (!('customerId' in payload) || !('amount' in payload)) return
      const invoicePayload = payload as InvoiceOverduePayload
      if (!invoicePayload.customerId) return

      try {
        // Füge Tag "Zahlung erinnern" zum Kunden hinzu
        const customer = await prisma.customer.findUnique({
          where: {
            id: invoicePayload.customerId,
          },
        })

        if (customer) {
          const tags = customer.tags || []
          if (!tags.includes('Zahlung erinnern')) {
            await prisma.customer.update({
              where: {
                id: invoicePayload.customerId,
              },
              data: {
                tags: [...tags, 'Zahlung erinnern'],
                notes: customer.notes
                  ? `${customer.notes}\n\n[${new Date().toLocaleDateString('de-DE')}] Rechnung überfällig: ${invoicePayload.amount}€`
                  : `[${new Date().toLocaleDateString('de-DE')}] Rechnung überfällig: ${invoicePayload.amount}€`,
              },
            })

            console.log(`[Automation] Added payment reminder tag to customer ${invoicePayload.customerId}`)
          }
        }
      } catch (error) {
        console.error('[Automation] Failed to add payment reminder to customer', error)
      }
    },
  },

  {
    eventName: 'inventory.low',
    description: 'Erstelle Aufgabe für niedrigen Bestand',
    action: async (payload) => {
      if (!('itemId' in payload)) return
      const inventoryPayload = payload as InventoryLowPayload
      if (!inventoryPayload.itemId) return

      try {
        await prisma.task.create({
          data: {
            title: `Inventar niedrig: ${inventoryPayload.itemName}`,
            description: `Bestand ist niedrig: ${inventoryPayload.currentQuantity} (Minimum: ${inventoryPayload.minThreshold})`,
            status: 'TODO',
            priority: 'HIGH',
            tenantId: payload.tenantId,
          },
        })

        console.log(`[Automation] Task created for low inventory: ${inventoryPayload.itemName}`)
      } catch (error) {
        console.error('[Automation] Failed to create task for low inventory', error)
      }
    },
  },

  {
    eventName: 'task.overdue',
    description: 'Erhöhe Priorität bei überfälligen Aufgaben',
    action: async (payload) => {
      if (!('taskId' in payload)) return
      const taskPayload = payload as TaskOverduePayload
      if (!taskPayload.taskId) return

      try {
        await prisma.task.update({
          where: {
            id: taskPayload.taskId,
          },
          data: {
            priority: 'URGENT',
          },
        })

        console.log(`[Automation] Increased priority for overdue task ${taskPayload.taskId}`)
      } catch (error) {
        console.error('[Automation] Failed to update overdue task', error)
      }
    },
  },

  {
    eventName: 'payment.paid',
    description: 'Erstelle Aufgabe "Rechnung verbucht" wenn Zahlung eingegangen',
    action: async (payload) => {
      if (!('paymentId' in payload) || !('invoiceId' in payload)) return
      const paymentPayload = payload as PaymentPaidPayload
      if (!paymentPayload.invoiceId) return

      try {
        await prisma.task.create({
          data: {
            title: 'Rechnung verbucht',
            description: `Zahlung für Rechnung ${paymentPayload.invoiceId} wurde verbucht (${paymentPayload.amount.toFixed(2)}€)`,
            status: 'DONE',
            priority: 'LOW',
            tenantId: payload.tenantId,
          },
        })

        console.log(`[Automation] Task created for payment ${paymentPayload.paymentId}`)
      } catch (error) {
        console.error('[Automation] Failed to create task for payment', error)
      }
    },
  },

  {
    eventName: 'payment.failed',
    description: 'Hinweis im CRM wenn Zahlung fehlgeschlagen',
    action: async (payload) => {
      if (!('customerId' in payload)) return
      const paymentPayload = payload as PaymentFailedPayload
      if (!paymentPayload.customerId) return

      try {
        const customer = await prisma.customer.findUnique({
          where: {
            id: paymentPayload.customerId,
          },
        })

        if (customer) {
          const tags = customer.tags || []
          if (!tags.includes('Zahlungsproblem')) {
            await prisma.customer.update({
              where: {
                id: paymentPayload.customerId,
              },
              data: {
                tags: [...tags, 'Zahlungsproblem'],
                notes: customer.notes
                  ? `${customer.notes}\n\n[${new Date().toLocaleDateString('de-DE')}] Zahlung fehlgeschlagen: ${paymentPayload.amount.toFixed(2)}€`
                  : `[${new Date().toLocaleDateString('de-DE')}] Zahlung fehlgeschlagen: ${paymentPayload.amount.toFixed(2)}€`,
              },
            })

            console.log(`[Automation] Added payment problem tag to customer ${paymentPayload.customerId}`)
          }
        }
      } catch (error) {
        console.error('[Automation] Failed to update customer for failed payment', error)
      }
    },
  },

  {
    eventName: 'payment.paid',
    description: 'Kunde markieren wenn Banküberweisung erkannt',
    condition: async (payload) => {
      if (!('method' in payload)) return false
      const paymentPayload = payload as PaymentPaidPayload
      return paymentPayload.method === 'BANK_TRANSFER'
    },
    action: async (payload) => {
      if (!('customerId' in payload)) return
      const paymentPayload = payload as PaymentPaidPayload
      if (!paymentPayload.customerId) return

      try {
        const customer = await prisma.customer.findUnique({
          where: {
            id: paymentPayload.customerId,
          },
        })

        if (customer) {
          const tags = customer.tags || []
          if (!tags.includes('Zahlt per Überweisung')) {
            await prisma.customer.update({
              where: {
                id: paymentPayload.customerId,
              },
              data: {
                tags: [...tags, 'Zahlt per Überweisung'],
              },
            })

            console.log(`[Automation] Marked customer as bank transfer payer: ${paymentPayload.customerId}`)
          }
        }
      } catch (error) {
        console.error('[Automation] Failed to mark customer for bank transfer', error)
      }
    },
  },

  {
    eventName: 'appointment.completed',
    description: 'Erstelle Rechnungsentwurf wenn Termin abgeschlossen wird',
    action: async (payload) => {
      if (!('appointmentId' in payload)) return
      const appointmentPayload = payload as any
      if (!appointmentPayload.appointmentId) return

      try {
        const { prisma } = await import('@/lib/prisma')
        const { invoiceService } = await import('@/services/invoice/InvoiceService')
        const { invoiceTemplateService } = await import('@/services/invoice/InvoiceTemplateService')

        // Hole Termin-Details
        const appointment = await prisma.appointment.findUnique({
          where: { id: appointmentPayload.appointmentId },
          include: {
            customer: true,
            employee: true,
          },
        })

        if (!appointment || !appointment.customerId) {
          return
        }

        // Hole Standard-Template
        const template = await invoiceTemplateService.getDefaultTemplate(payload.tenantId)

        // Erstelle Rechnungsentwurf
        const invoice = await invoiceService.createInvoice({
          tenantId: payload.tenantId,
          customerId: appointment.customerId,
          employeeId: appointment.employeeId || undefined,
          appointmentId: appointmentPayload.appointmentId,
          amount: Number(appointment.price || 0),
          currency: 'EUR',
          description: `Rechnung für Termin: ${appointment.title}`,
          templateId: template?.id,
        })

        console.log(`[Automation] Invoice draft created for appointment ${appointmentPayload.appointmentId}: ${invoice.invoiceNumber}`)
      } catch (error) {
        console.error('[Automation] Failed to create invoice draft for appointment', error)
      }
    },
  },

  {
    eventName: 'ai.usage_recorded',
    description: 'Warnung bei ungewöhnlich hohem KI-Verbrauch',
    condition: async (payload) => {
      if (!('totalTokens' in payload)) return false
      const aiPayload = payload as any
      
      // Prüfe ob Verbrauch ungewöhnlich hoch ist (> 100K Tokens pro Request)
      return aiPayload.totalTokens > 100000
    },
    action: async (payload) => {
      if (!('totalTokens' in payload)) return
      const aiPayload = payload as any

      try {
        const { prisma } = await import('@/lib/prisma')
        
        // Erstelle Aufgabe für Admin
        await prisma.task.create({
          data: {
            tenantId: payload.tenantId,
            title: 'KI-Verbrauch prüfen',
            description: `Ungewöhnlich hoher KI-Verbrauch erkannt: ${aiPayload.totalTokens} Tokens für Feature "${aiPayload.feature}". Kosten: ${aiPayload.cost.toFixed(2)} EUR`,
            status: 'TODO',
            priority: 'HIGH',
            assignedTo: null, // Admin-Aufgabe
          },
        })

        console.log(`[Automation] Created task for high AI usage: ${aiPayload.totalTokens} tokens`)
      } catch (error) {
        console.error('[Automation] Failed to create task for high AI usage', error)
      }
    },
  },

  {
    eventName: 'invoice.overdue',
    description: 'Erstelle Erinnerung Level 1 wenn Rechnung überfällig wird',
    action: async (payload) => {
      if (!('invoiceId' in payload)) return
      const invoicePayload = payload as any

      try {
        const { reminderService } = await import('@/services/invoice/ReminderService')
        
        // Prüfe ob bereits Level 1 erstellt wurde
        const invoice = await prisma.invoice.findUnique({
          where: { id: invoicePayload.invoiceId },
        })

        if (!invoice || invoice.reminderLevel > 0) {
          return
        }

        // Erstelle Level 1 Mahnung
        await reminderService.createReminder(
          payload.tenantId,
          invoicePayload.invoiceId,
          1,
          'automation'
        )

        console.log(`[Automation] Created Level 1 reminder for invoice ${invoicePayload.invoiceId}`)
      } catch (error) {
        console.error('[Automation] Failed to create Level 1 reminder', error)
      }
    },
  },

  {
    eventName: 'invoice.reminder_created',
    description: 'Erstelle Aufgabe "Mahnung verschicken" bei Level 1',
    condition: async (payload) => {
      if (!('level' in payload)) return false
      const reminderPayload = payload as any
      return reminderPayload.level === 1
    },
    action: async (payload) => {
      if (!('invoiceId' in payload) || !('level' in payload)) return
      const reminderPayload = payload as any

      try {
        await prisma.task.create({
          data: {
            tenantId: payload.tenantId,
            title: 'Mahnung verschicken',
            description: `Mahnung Level ${reminderPayload.level} für Rechnung ${reminderPayload.invoiceId} erstellen und versenden`,
            status: 'TODO',
            priority: 'MEDIUM',
            assignedTo: null, // Admin-Aufgabe
          },
        })

        console.log(`[Automation] Created task for reminder Level ${reminderPayload.level}`)
      } catch (error) {
        console.error('[Automation] Failed to create task for reminder', error)
      }
    },
  },

  {
    eventName: 'invoice.reminder_created',
    description: 'KI generiert strengeren Mahntext bei Level 2',
    condition: async (payload) => {
      if (!('level' in payload)) return false
      const reminderPayload = payload as any
      return reminderPayload.level === 2
    },
    action: async (payload) => {
      if (!('invoiceId' in payload) || !('level' in payload)) return
      const reminderPayload = payload as any

      try {
        const invoice = await prisma.invoice.findUnique({
          where: { id: reminderPayload.invoiceId },
        })

        if (!invoice) return

        // Generiere KI-Mahntext (DSGVO-sicher)
        const { aiServiceWrapper } = await import('@/services/ai/AiServiceWrapper')
        const reminderText = await aiServiceWrapper.generateInvoiceDraft(
          {
            tenantId: payload.tenantId,
            feature: 'reminder_text',
            aiProvider: 'openai',
          },
          JSON.stringify({
            level: reminderPayload.level,
            invoiceAmount: Number(invoice.amount),
            companyMood: 'neutral',
          })
        )

        // Aktualisiere Mahnung mit KI-Text
        await prisma.invoiceReminder.updateMany({
          where: {
            invoiceId: reminderPayload.invoiceId,
            level: reminderPayload.level,
            status: 'PENDING',
          },
          data: {
            aiText: reminderText,
          },
        })

        console.log(`[Automation] Generated AI reminder text for Level ${reminderPayload.level}`)
      } catch (error) {
        console.error('[Automation] Failed to generate AI reminder text', error)
      }
    },
  },

  {
    eventName: 'invoice.reminder_created',
    description: 'Eskalation bei Level 3 - Aufgabe an Admin',
    condition: async (payload) => {
      if (!('level' in payload)) return false
      const reminderPayload = payload as any
      return reminderPayload.level === 3
    },
    action: async (payload) => {
      if (!('invoiceId' in payload) || !('level' in payload)) return
      const reminderPayload = payload as any

      try {
        const invoice = await prisma.invoice.findUnique({
          where: { id: reminderPayload.invoiceId },
        })

        if (!invoice) return

        // Erstelle Admin-Aufgabe
        await prisma.task.create({
          data: {
            tenantId: payload.tenantId,
            title: 'Letzte Mahnung prüfen / ggf. Inkasso',
            description: `Rechnung ${invoice.invoiceNumber} ist auf Level 3 (letzte Mahnung). Bitte prüfen und ggf. Inkasso beauftragen.`,
            status: 'TODO',
            priority: 'HIGH',
            assignedTo: null, // Admin-Aufgabe
          },
        })

        // Event für Eskalation
        const { eventBus } = await import('@/events/EventBus')
        eventBus.emit('invoice.reminder_escalated', {
          tenantId: payload.tenantId,
          invoiceId: reminderPayload.invoiceId,
          level: reminderPayload.level,
          timestamp: new Date(),
        })

        console.log(`[Automation] Escalated reminder Level ${reminderPayload.level} to admin`)
      } catch (error) {
        console.error('[Automation] Failed to escalate reminder', error)
      }
    },
  },

  {
    eventName: 'payment.paid',
    description: 'Stoppe Mahnungen wenn Rechnung bezahlt wird',
    action: async (payload) => {
      if (!('invoiceId' in payload)) return
      const paymentPayload = payload as PaymentPaidPayload

      if (!paymentPayload.invoiceId) return

      try {
        const { reminderService } = await import('@/services/invoice/ReminderService')
        
        // Stoppe alle weiteren Mahnungen
        await reminderService.stopReminders(paymentPayload.invoiceId)

        console.log(`[Automation] Stopped reminders for invoice ${paymentPayload.invoiceId}`)
      } catch (error) {
        console.error('[Automation] Failed to stop reminders', error)
      }
    },
  },
]

