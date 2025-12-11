/**
 * KI-Service für FuerstFlow
 * Nutzt ContextService und abstrahiert personenbezogene Daten
 */
import { contextService } from '../context/ContextService'
import { aiAdapter, InvoiceTextResult, TaskSuggestion, DailyReportResult, CustomerAnalysis } from './AiAdapter'

class AiService {
  /**
   * Rechnungstext generieren
   */
  async generateInvoiceText(tenantId: string, customerId: string, amount: number, items: Array<{ description: string; amount: number }>): Promise<InvoiceTextResult> {
    // Hole nur Metadaten, keine personenbezogenen Daten
    const customerContext = await contextService.getCustomerContext(customerId)

    // Erstelle KI-kompatiblen Kontext (ohne personenbezogene Daten)
    const aiContext = {
      amount,
      customerId, // Nur ID, keine Namen/Adressen
      items,
      customerTags: customerContext?.tags || [],
      appointmentCount: customerContext?.appointmentCount || 0,
    }

    return await aiAdapter.generateInvoiceText(aiContext)
  }

  /**
   * Aufgaben-Vorschläge generieren
   */
  async generateTaskSuggestions(tenantId: string): Promise<TaskSuggestion[]> {
    const tenantContext = await contextService.getTenantContext(tenantId)
    return await aiAdapter.generateTaskSuggestions(tenantContext)
  }

  /**
   * Tagesbericht generieren
   */
  async generateDailyReport(tenantId: string, periodDays: number = 1): Promise<DailyReportResult> {
    const tenantContext = await contextService.getTenantContext(tenantId, periodDays)
    return await aiAdapter.generateDailyReport(tenantContext)
  }

  /**
   * Kundenanalyse generieren
   */
  async analyzeCustomer(customerId: string): Promise<CustomerAnalysis> {
    const customerContext = await contextService.getCustomerContext(customerId)

    if (!customerContext) {
      throw new Error('Customer not found')
    }

    // Erstelle KI-kompatiblen Kontext (ohne personenbezogene Daten)
    const aiContext = {
      appointmentCount: customerContext.appointmentCount,
      totalRevenue: customerContext.totalRevenue,
      lastAppointmentDate: customerContext.lastAppointmentDate,
      tags: customerContext.tags,
    }

    return await aiAdapter.analyzeCustomer(aiContext)
  }

  /**
   * KI-kompatiblen Prompt erstellen (für zukünftige echte KI-Integration)
   */
  createPrompt(context: Record<string, unknown>, task: string): string {
    // Entferne alle personenbezogenen Daten
    const sanitizedContext = this.sanitizeContext(context)

    return `Task: ${task}

Context (DSGVO-compliant, no personal data):
${JSON.stringify(sanitizedContext, null, 2)}

Please provide a response based on this context.`
  }

  /**
   * Kontext bereinigen (entfernt personenbezogene Daten)
   */
  private sanitizeContext(context: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {}

    // Erlaube nur Metadaten
    const allowedKeys = [
      'tenantId',
      'customerId',
      'appointmentId',
      'employeeId',
      'appointmentCount',
      'totalRevenue',
      'tags',
      'status',
      'price',
      'duration',
      'isActive',
      'isSick',
      'hasVacation',
      'period',
      'metrics',
    ]

    Object.keys(context).forEach((key) => {
      if (allowedKeys.includes(key)) {
        sanitized[key] = context[key]
      }
    })

    return sanitized
  }
}

// Singleton-Instanz
export const aiService = new AiService()

