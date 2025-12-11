/**
 * Automation Engine für FuerstFlow
 * Registriert Regeln und führt Aktionen basierend auf Events aus
 */
import { eventBus } from '@/events/EventBus'
import { EventName, EventPayload } from '@/events/types/EventTypes'
import { AutomationRule, defaultRules } from './rules/defaultRules'

class AutomationEngine {
  private rules: Map<EventName, AutomationRule[]> = new Map()
  private enabled: boolean = true

  constructor() {
    this.registerDefaultRules()
    this.subscribeToEvents()
  }

  /**
   * Standard-Regeln registrieren
   */
  private registerDefaultRules(): void {
    defaultRules.forEach((rule) => {
      this.registerRule(rule)
    })
  }

  /**
   * Regel registrieren
   */
  registerRule(rule: AutomationRule): void {
    const eventName = rule.eventName as EventName

    if (!this.rules.has(eventName)) {
      this.rules.set(eventName, [])
    }

    this.rules.get(eventName)!.push(rule)
    console.log(`[AutomationEngine] Registered rule: ${rule.description}`)
  }

  /**
   * Alle Events abonnieren
   */
  private subscribeToEvents(): void {
    // Abonniere alle Event-Typen
    const eventNames: EventName[] = [
      'appointment.created',
      'employee.sick',
      'invoice.overdue',
      'inventory.low',
      'task.overdue',
      'customer.created',
      'appointment.updated',
      'appointment.cancelled',
      'task.created',
      'payment.created',
      'payment.paid',
      'payment.failed',
      'payment.refunded',
      'ai.usage_recorded',
      'invoice.overdue',
      'invoice.reminder_created',
      'invoice.reminder_sent',
      'invoice.reminder_failed',
      'invoice.reminder_escalated',
      'invoice.reminder_stopped',
    ]

    eventNames.forEach((eventName) => {
      eventBus.subscribe(eventName, async (payload) => {
        await this.handleEvent(eventName, payload)
      })
    })
  }

  /**
   * Event verarbeiten
   */
  private async handleEvent(eventName: EventName, payload: EventPayload): Promise<void> {
    if (!this.enabled) {
      return
    }

    const rules = this.rules.get(eventName) || []

    for (const rule of rules) {
      try {
        // Prüfe Bedingung falls vorhanden
        if (rule.condition) {
          const conditionResult = await rule.condition(payload)
          if (!conditionResult) {
            continue
          }
        }

        // Führe Aktion aus
        await rule.action(payload)
        console.log(`[AutomationEngine] Executed rule: ${rule.description}`)
      } catch (error) {
        console.error(`[AutomationEngine] Failed to execute rule: ${rule.description}`, error)
        // Weiter mit nächster Regel auch bei Fehler
      }
    }
  }

  /**
   * Engine aktivieren/deaktivieren
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    console.log(`[AutomationEngine] ${enabled ? 'Enabled' : 'Disabled'}`)
  }

  /**
   * Status abrufen
   */
  getStatus(): { enabled: boolean; ruleCount: number } {
    let totalRules = 0
    this.rules.forEach((rules) => {
      totalRules += rules.length
    })

    return {
      enabled: this.enabled,
      ruleCount: totalRules,
    }
  }
}

// Singleton-Instanz
export const automationEngine = new AutomationEngine()

