/**
 * AI Billing Service für FuerstFlow
 * Verwaltet monatliche KI-Abrechnungen
 */
import { prisma } from '@/lib/prisma'
import { aiUsageService } from './AiUsageService'

class AiBillingService {
  /**
   * Monatliche Rechnung berechnen
   */
  async calculateMonthlyBill(tenantId: string, month: number, year: number, multiplier: number = 1.2) {
    try {
      const monthlyUsage = await aiUsageService.getMonthlyUsage(tenantId, month, year)

      const baseCost = monthlyUsage.totalCost
      const finalCost = baseCost * multiplier

      return {
        tenantId,
        month,
        year,
        totalTokens: monthlyUsage.totalTokens,
        baseCost,
        multiplier,
        finalCost,
        usageCount: monthlyUsage.count,
      }
    } catch (error) {
      console.error('[AiBillingService] Error calculating monthly bill:', error)
      throw error
    }
  }

  /**
   * KI-Abrechnungseintrag generieren
   */
  async generateAiBillingEntry(tenantId: string, month?: number, year?: number, multiplier: number = 1.2) {
    try {
      const now = new Date()
      const targetMonth = month || now.getMonth() + 1
      const targetYear = year || now.getFullYear()

      // Prüfe ob bereits ein Eintrag existiert
      const existing = await prisma.aiBilling.findUnique({
        where: {
          tenantId_month_year: {
            tenantId,
            month: targetMonth,
            year: targetYear,
          },
        },
      })

      if (existing) {
        // Aktualisiere bestehenden Eintrag
        const bill = await this.calculateMonthlyBill(tenantId, targetMonth, targetYear, multiplier)

        const updated = await prisma.aiBilling.update({
          where: {
            id: existing.id,
          },
          data: {
            totalTokens: bill.totalTokens,
            baseCost: bill.baseCost,
            multiplier: bill.multiplier,
            finalCost: bill.finalCost,
          },
        })

        return updated
      }

      // Erstelle neuen Eintrag
      const bill = await this.calculateMonthlyBill(tenantId, targetMonth, targetYear, multiplier)

      const billing = await prisma.aiBilling.create({
        data: {
          tenantId,
          month: targetMonth,
          year: targetYear,
          totalTokens: bill.totalTokens,
          baseCost: bill.baseCost,
          multiplier: bill.multiplier,
          finalCost: bill.finalCost,
        },
      })

      return billing
    } catch (error) {
      console.error('[AiBillingService] Error generating billing entry:', error)
      throw error
    }
  }

  /**
   * Aktuelle Monatsrechnung abrufen
   */
  async getCurrentMonthBill(tenantId: string) {
    try {
      const now = new Date()
      const month = now.getMonth() + 1
      const year = now.getFullYear()

      const billing = await prisma.aiBilling.findUnique({
        where: {
          tenantId_month_year: {
            tenantId,
            month,
            year,
          },
        },
      })

      if (billing) {
        return billing
      }

      // Erstelle Eintrag falls nicht vorhanden
      return await this.generateAiBillingEntry(tenantId)
    } catch (error) {
      console.error('[AiBillingService] Error getting current month bill:', error)
      throw error
    }
  }

  /**
   * Alle Abrechnungen eines Tenants abrufen
   */
  async getTenantBillings(tenantId: string) {
    try {
      const billings = await prisma.aiBilling.findMany({
        where: {
          tenantId,
        },
        orderBy: [
          { year: 'desc' },
          { month: 'desc' },
        ],
      })

      return billings
    } catch (error) {
      console.error('[AiBillingService] Error getting tenant billings:', error)
      throw error
    }
  }

  /**
   * Rechnung neu berechnen
   */
  async recalculateBill(tenantId: string, month: number, year: number, multiplier?: number) {
    try {
      const existing = await prisma.aiBilling.findUnique({
        where: {
          tenantId_month_year: {
            tenantId,
            month,
            year,
          },
        },
      })

      const finalMultiplier = multiplier || existing?.multiplier || 1.2
      const bill = await this.calculateMonthlyBill(tenantId, month, year, finalMultiplier)

      if (existing) {
        return await prisma.aiBilling.update({
          where: {
            id: existing.id,
          },
          data: {
            totalTokens: bill.totalTokens,
            baseCost: bill.baseCost,
            multiplier: finalMultiplier,
            finalCost: bill.finalCost,
          },
        })
      } else {
        return await prisma.aiBilling.create({
          data: {
            tenantId,
            month,
            year,
            totalTokens: bill.totalTokens,
            baseCost: bill.baseCost,
            multiplier: finalMultiplier,
            finalCost: bill.finalCost,
          },
        })
      }
    } catch (error) {
      console.error('[AiBillingService] Error recalculating bill:', error)
      throw error
    }
  }
}

// Singleton-Instanz
export const aiBillingService = new AiBillingService()

