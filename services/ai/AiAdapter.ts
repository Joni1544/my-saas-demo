/**
 * KI-Adapter für FuerstFlow (Dummy-Implementierung)
 * DSGVO-konform: Keine echten API-Aufrufe, nur Dummy-Outputs
 */
import { TenantContext, FinanceContext } from '../context/ContextService'

export interface InvoiceTextResult {
  text: string
  suggestions: string[]
}

export interface TaskSuggestion {
  title: string
  description: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  estimatedHours?: number
}

export interface DailyReportResult {
  summary: string
  insights: string[]
  recommendations: string[]
  metrics: {
    revenue: number
    appointments: number
    tasks: number
  }
}

export interface CustomerAnalysis {
  insights: string[]
  recommendations: string[]
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
}

class AiAdapter {
  /**
   * Rechnungstext generieren (Dummy)
   */
  async generateInvoiceText(context: {
    amount: number
    customerId: string
    items: Array<{ description: string; amount: number }>
  }): Promise<InvoiceTextResult> {
    // Dummy-Implementierung
    await this.simulateDelay()

    const text = `Sehr geehrte Damen und Herren,

vielen Dank für Ihr Vertrauen. Wir stellen Ihnen folgende Leistungen in Rechnung:

${context.items.map((item, i) => `${i + 1}. ${item.description}: ${item.amount.toFixed(2)}€`).join('\n')}

Gesamtbetrag: ${context.amount.toFixed(2)}€

Bitte überweisen Sie den Betrag innerhalb von 14 Tagen auf unser Konto.

Mit freundlichen Grüßen
Ihr FuerstFlow Team`

    return {
      text,
      suggestions: [
        'Persönliche Anrede hinzufügen',
        'Zahlungsziel anpassen',
        'Kontaktdaten ergänzen',
      ],
    }
  }

  /**
   * Aufgaben-Vorschläge generieren (Dummy)
   */
  async generateTaskSuggestions(context: TenantContext): Promise<TaskSuggestion[]> {
    await this.simulateDelay()

    const suggestions: TaskSuggestion[] = []

    // Basierend auf Kontext Vorschläge generieren
    if (context.totalAppointments > 0 && context.totalTasks < context.totalAppointments) {
      suggestions.push({
        title: 'Follow-up für Termine durchführen',
        description: `Es gibt ${context.totalAppointments} Termine, aber nur ${context.totalTasks} Aufgaben. Erwägen Sie Follow-up-Aufgaben für abgeschlossene Termine.`,
        priority: 'MEDIUM',
        estimatedHours: 2,
      })
    }

    if (context.revenue > 0) {
      suggestions.push({
        title: 'Umsatzanalyse durchführen',
        description: `Der Umsatz beträgt ${context.revenue.toFixed(2)}€. Analysieren Sie die Top-Kunden und -Dienstleistungen.`,
        priority: 'LOW',
        estimatedHours: 1,
      })
    }

    if (context.totalCustomers > 0) {
      suggestions.push({
        title: 'Kundenbindung verbessern',
        description: `Sie haben ${context.totalCustomers} Kunden. Erwägen Sie Marketing-Maßnahmen zur Kundenbindung.`,
        priority: 'MEDIUM',
        estimatedHours: 3,
      })
    }

    return suggestions
  }

  /**
   * Tagesbericht generieren (Dummy)
   */
  async generateDailyReport(context: TenantContext): Promise<DailyReportResult> {
    await this.simulateDelay()

    const insights: string[] = []
    const recommendations: string[] = []

    if (context.totalAppointments > 10) {
      insights.push(`Hohe Termindichte: ${context.totalAppointments} Termine im Zeitraum`)
      recommendations.push('Erwägen Sie zusätzliche Mitarbeiter-Kapazitäten')
    }

    if (context.revenue > 1000) {
      insights.push(`Guter Umsatz: ${context.revenue.toFixed(2)}€ erzielt`)
      recommendations.push('Analysieren Sie die Top-Dienstleistungen für weitere Optimierung')
    }

    if (context.totalTasks > 20) {
      insights.push(`Viele offene Aufgaben: ${context.totalTasks} Tasks`)
      recommendations.push('Priorisieren Sie Aufgaben und delegieren Sie bei Bedarf')
    }

    return {
      summary: `Zusammenfassung für den Zeitraum: ${context.totalAppointments} Termine, ${context.revenue.toFixed(2)}€ Umsatz, ${context.totalTasks} Aufgaben.`,
      insights,
      recommendations,
      metrics: {
        revenue: context.revenue,
        appointments: context.totalAppointments,
        tasks: context.totalTasks,
      },
    }
  }

  /**
   * Kundenanalyse generieren (Dummy)
   */
  async analyzeCustomer(context: {
    appointmentCount: number
    totalRevenue: number
    lastAppointmentDate?: Date
    tags: string[]
  }): Promise<CustomerAnalysis> {
    await this.simulateDelay()

    const insights: string[] = []
    const recommendations: string[] = []
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW'

    if (context.appointmentCount === 0) {
      insights.push('Neuer Kunde ohne bisherige Termine')
      recommendations.push('Willkommens-E-Mail senden')
      riskLevel = 'MEDIUM'
    } else if (context.appointmentCount > 5) {
      insights.push(`Stammkunde mit ${context.appointmentCount} Terminen`)
      recommendations.push('VIP-Status erwägen')
      riskLevel = 'LOW'
    }

    if (context.totalRevenue > 500) {
      insights.push(`Wertvoller Kunde: ${context.totalRevenue.toFixed(2)}€ Umsatz`)
      recommendations.push('Persönliche Betreuung verstärken')
    }

    if (context.tags.includes('Problemkunde')) {
      riskLevel = 'HIGH'
      insights.push('Kunde wurde als Problemkunde markiert')
      recommendations.push('Probleme dokumentieren und Lösungen erarbeiten')
    }

    const daysSinceLastAppointment = context.lastAppointmentDate
      ? Math.floor((new Date().getTime() - new Date(context.lastAppointmentDate).getTime()) / (1000 * 60 * 60 * 24))
      : null

    if (daysSinceLastAppointment && daysSinceLastAppointment > 90) {
      insights.push(`Lange Zeit seit letztem Termin: ${daysSinceLastAppointment} Tage`)
      recommendations.push('Reaktivierungs-Kampagne erwägen')
      riskLevel = 'MEDIUM'
    }

    return {
      insights,
      recommendations,
      riskLevel,
    }
  }

  /**
   * Verzögerung simulieren (für realistische Dummy-Antworten)
   */
  private async simulateDelay(min: number = 100, max: number = 500): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min
    return new Promise((resolve) => setTimeout(resolve, delay))
  }
}

// Singleton-Instanz
export const aiAdapter = new AiAdapter()

