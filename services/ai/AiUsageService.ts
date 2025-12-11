/**
 * AI Usage Service für FuerstFlow
 * Erfasst und verwaltet KI-Nutzung pro Tenant
 */
import { prisma } from '@/lib/prisma'
import { EventBus } from '@/events/EventBus'

export interface RecordUsageData {
  tenantId: string
  feature: string
  tokensInput: number
  tokensOutput: number
  aiProvider: string
}

// Token-Preise pro Provider (EUR pro Token)
const TOKEN_PRICES: Record<string, number> = {
  openai: 0.000003, // GPT-4: ~$0.03/1K tokens input, ~$0.06/1K tokens output
  gemini: 0.000002, // Gemini Pro: ~$0.002/1K tokens
  anthropic: 0.000004, // Claude: ~$0.008/1K tokens
  default: 0.000003, // Standard-Preis
}

class AiUsageService {
  /**
   * KI-Nutzung erfassen
   */
  async recordUsage(data: RecordUsageData) {
    try {
      const totalTokens = data.tokensInput + data.tokensOutput
      const tokenPrice = TOKEN_PRICES[data.aiProvider] || TOKEN_PRICES.default
      const cost = totalTokens * tokenPrice

      const usage = await prisma.aiUsage.create({
        data: {
          tenantId: data.tenantId,
          feature: data.feature,
          tokensInput: data.tokensInput,
          tokensOutput: data.tokensOutput,
          totalTokens,
          cost,
          aiProvider: data.aiProvider,
        },
      })

      // Event an EventBus senden
      EventBus.emit('ai.usage_recorded', {
        tenantId: data.tenantId,
        usageId: usage.id,
        feature: data.feature,
        totalTokens,
        cost,
        aiProvider: data.aiProvider,
        timestamp: usage.timestamp,
      })

      return usage
    } catch (error) {
      console.error('[AiUsageService] Error recording usage:', error)
      throw error
    }
  }

  /**
   * Monatliche Nutzung abrufen
   */
  async getMonthlyUsage(tenantId: string, month: number, year: number) {
    try {
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0, 23, 59, 59)

      const usages = await prisma.aiUsage.findMany({
        where: {
          tenantId,
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
      })

      const totalTokens = usages.reduce((sum, u) => sum + u.totalTokens, 0)
      const totalCost = usages.reduce((sum, u) => sum + Number(u.cost), 0)

      return {
        usages,
        totalTokens,
        totalCost,
        count: usages.length,
      }
    } catch (error) {
      console.error('[AiUsageService] Error getting monthly usage:', error)
      throw error
    }
  }

  /**
   * Aktuelle Monatsnutzung abrufen
   */
  async getCurrentMonthUsage(tenantId: string) {
    const now = new Date()
    return this.getMonthlyUsage(tenantId, now.getMonth() + 1, now.getFullYear())
  }

  /**
   * Tenant-Nutzungsstatistiken
   */
  async getTenantUsageStats(tenantId: string, startDate?: Date, endDate?: Date) {
    try {
      const where: {
        tenantId: string
        timestamp?: {
          gte?: Date
          lte?: Date
        }
      } = {
        tenantId,
      }

      if (startDate || endDate) {
        where.timestamp = {}
        if (startDate) where.timestamp.gte = startDate
        if (endDate) where.timestamp.lte = endDate
      }

      const usages = await prisma.aiUsage.findMany({
        where,
        orderBy: {
          timestamp: 'desc',
        },
      })

      const totalTokens = usages.reduce((sum, u) => sum + u.totalTokens, 0)
      const totalCost = usages.reduce((sum, u) => sum + Number(u.cost), 0)
      const avgCostPerRequest = usages.length > 0 ? totalCost / usages.length : 0

      // Feature Breakdown
      const featureBreakdown: Record<string, { count: number; tokens: number; cost: number }> = {}
      usages.forEach((usage) => {
        if (!featureBreakdown[usage.feature]) {
          featureBreakdown[usage.feature] = { count: 0, tokens: 0, cost: 0 }
        }
        featureBreakdown[usage.feature].count++
        featureBreakdown[usage.feature].tokens += usage.totalTokens
        featureBreakdown[usage.feature].cost += Number(usage.cost)
      })

      // Provider Breakdown
      const providerBreakdown: Record<string, { count: number; tokens: number; cost: number }> = {}
      usages.forEach((usage) => {
        if (!providerBreakdown[usage.aiProvider]) {
          providerBreakdown[usage.aiProvider] = { count: 0, tokens: 0, cost: 0 }
        }
        providerBreakdown[usage.aiProvider].count++
        providerBreakdown[usage.aiProvider].tokens += usage.totalTokens
        providerBreakdown[usage.aiProvider].cost += Number(usage.cost)
      })

      // Tägliche Nutzung
      const dailyUsage: Record<string, { tokens: number; cost: number; count: number }> = {}
      usages.forEach((usage) => {
        const date = usage.timestamp.toISOString().split('T')[0]
        if (!dailyUsage[date]) {
          dailyUsage[date] = { tokens: 0, cost: 0, count: 0 }
        }
        dailyUsage[date].tokens += usage.totalTokens
        dailyUsage[date].cost += Number(usage.cost)
        dailyUsage[date].count++
      })

      return {
        totalTokens,
        totalCost,
        count: usages.length,
        avgCostPerRequest,
        featureBreakdown,
        providerBreakdown,
        dailyUsage,
      }
    } catch (error) {
      console.error('[AiUsageService] Error getting tenant stats:', error)
      throw error
    }
  }

  /**
   * Globale Nutzungsstatistiken (nur für Admins)
   */
  async getGlobalUsageStats(startDate?: Date, endDate?: Date) {
    try {
      const where: {
        timestamp?: {
          gte?: Date
          lte?: Date
        }
      } = {}

      if (startDate || endDate) {
        where.timestamp = {}
        if (startDate) where.timestamp.gte = startDate
        if (endDate) where.timestamp.lte = endDate
      }

      const usages = await prisma.aiUsage.findMany({
        where,
        orderBy: {
          timestamp: 'desc',
        },
      })

      const totalTokens = usages.reduce((sum, u) => sum + u.totalTokens, 0)
      const totalCost = usages.reduce((sum, u) => sum + Number(u.cost), 0)

      // Tenant Breakdown
      const tenantBreakdown: Record<string, { tokens: number; cost: number; count: number }> = {}
      usages.forEach((usage) => {
        if (!tenantBreakdown[usage.tenantId]) {
          tenantBreakdown[usage.tenantId] = { tokens: 0, cost: 0, count: 0 }
        }
        tenantBreakdown[usage.tenantId].tokens += usage.totalTokens
        tenantBreakdown[usage.tenantId].cost += Number(usage.cost)
        tenantBreakdown[usage.tenantId].count++
      })

      return {
        totalTokens,
        totalCost,
        count: usages.length,
        tenantBreakdown,
      }
    } catch (error) {
      console.error('[AiUsageService] Error getting global stats:', error)
      throw error
    }
  }

  /**
   * Prüfe ob Limits erreicht sind
   */
  async checkLimits(tenantId: string, monthlyLimitTokens?: number, monthlyLimitCost?: number): Promise<{
    withinLimits: boolean
    currentTokens: number
    currentCost: number
    limitTokens?: number
    limitCost?: number
  }> {
    const currentMonth = await this.getCurrentMonthUsage(tenantId)

    const withinLimits = {
      tokens: !monthlyLimitTokens || currentMonth.totalTokens < monthlyLimitTokens,
      cost: !monthlyLimitCost || currentMonth.totalCost < monthlyLimitCost,
    }

    return {
      withinLimits: withinLimits.tokens && withinLimits.cost,
      currentTokens: currentMonth.totalTokens,
      currentCost: currentMonth.totalCost,
      limitTokens: monthlyLimitTokens,
      limitCost: monthlyLimitCost,
    }
  }
}

// Singleton-Instanz
export const aiUsageService = new AiUsageService()

