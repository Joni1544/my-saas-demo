/**
 * AI Service Wrapper
 * Wrapper für AiService mit Usage-Tracking
 */
import { aiUsageService } from './AiUsageService'
import { aiAdapter, DailyReportResult, TaskSuggestion } from './AiAdapter'

interface UsageContext {
  tenantId: string
  feature: string
  aiProvider?: string
}

class AiServiceWrapper {
  /**
   * Wrapper für AI-Aufrufe mit automatischem Usage-Tracking
   */
  async callWithTracking<T>(
    context: UsageContext,
    aiCall: () => Promise<{ result: T; usage?: { inputTokens: number; outputTokens: number } }>
  ): Promise<T> {
    try {
      const { result, usage } = await aiCall()

      // Erfasse Usage falls vorhanden
      if (usage) {
        await aiUsageService.recordUsage({
          tenantId: context.tenantId,
          feature: context.feature,
          tokensInput: usage.inputTokens,
          tokensOutput: usage.outputTokens,
          aiProvider: context.aiProvider || 'openai',
        })
      }

      return result
    } catch (error) {
      console.error('[AiServiceWrapper] Error:', error)
      throw error
    }
  }

  /**
   * Generiere Rechnungstext mit Tracking
   */
  async generateInvoiceDraft(context: UsageContext, prompt: {
    amount: number
    customerId: string
    items: Array<{ description: string; amount: number }>
  }): Promise<string> {
    return this.callWithTracking(context, async () => {
      const result = await aiAdapter.generateInvoiceText(prompt)
      // Dummy Usage - würde später durch echte API-Response ersetzt
      return {
        result: result.text, // Extrahiere text aus InvoiceTextResult
        usage: {
          inputTokens: JSON.stringify(prompt).length / 4, // Grobe Schätzung: ~4 Zeichen pro Token
          outputTokens: result.text.length / 4,
        },
      }
    })
  }

  /**
   * Generiere Tagesbericht mit Tracking
   */
  async generateDailyReport(context: UsageContext, data: unknown): Promise<DailyReportResult> {
    return this.callWithTracking(context, async () => {
      const result = await aiAdapter.generateDailyReport(data as any)
      return {
        result,
        usage: {
          inputTokens: JSON.stringify(data).length / 4,
          outputTokens: JSON.stringify(result).length / 4,
        },
      }
    })
  }

  /**
   * Generiere Task-Vorschläge mit Tracking
   */
  async generateTaskSuggestions(context: UsageContext, data: unknown): Promise<TaskSuggestion[]> {
    return this.callWithTracking(context, async () => {
      const result = await aiAdapter.generateTaskSuggestions(data as any)
      return {
        result,
        usage: {
          inputTokens: JSON.stringify(data).length / 4,
          outputTokens: JSON.stringify(result).length / 4,
        },
      }
    })
  }
}

// Singleton-Instanz
export const aiServiceWrapper = new AiServiceWrapper()

