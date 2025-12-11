/**
 * KI-Analyst für FuerstFlow
 * Analysiert Tageskontext und generiert Berichte
 */
import { contextService } from '../context/ContextService'
import { aiService } from './AiService'

export interface AnalystReport {
  date: Date
  summary: string
  insights: string[]
  recommendations: string[]
  bottlenecks: string[]
  metrics: {
    revenue: number
    appointments: number
    tasks: number
    expenses: number
    profit: number
  }
  trends: {
    revenueTrend: 'up' | 'down' | 'stable'
    appointmentTrend: 'up' | 'down' | 'stable'
  }
}

class AiAnalyst {
  /**
   * Tagesbericht analysieren
   */
  async analyzeDailyContext(tenantId: string, periodDays: number = 1): Promise<AnalystReport> {
    const [tenantContext, financeContext] = await Promise.all([
      contextService.getTenantContext(tenantId, periodDays),
      contextService.getFinanceContext(tenantId, periodDays),
    ])

    // Generiere KI-Bericht
    const aiReport = await aiService.generateDailyReport(tenantId, periodDays)

    // Erkenne Engpässe
    const bottlenecks = this.identifyBottlenecks(tenantContext, financeContext)

    // Erkenne Trends (vereinfacht, da wir nur einen Zeitraum haben)
    const trends = this.identifyTrends(tenantContext, financeContext)

    return {
      date: new Date(),
      summary: aiReport.summary,
      insights: aiReport.insights,
      recommendations: aiReport.recommendations,
      bottlenecks,
      metrics: {
        revenue: financeContext.totalRevenue,
        appointments: tenantContext.totalAppointments,
        tasks: tenantContext.totalTasks,
        expenses: financeContext.totalExpenses,
        profit: financeContext.profit,
      },
      trends,
    }
  }

  /**
   * Engpässe identifizieren
   */
  private identifyBottlenecks(
    tenantContext: Awaited<ReturnType<typeof contextService.getTenantContext>>,
    financeContext: Awaited<ReturnType<typeof contextService.getFinanceContext>>
  ): string[] {
    const bottlenecks: string[] = []

    // Prüfe Verhältnis Termine zu Mitarbeitern
    if (tenantContext.totalEmployees > 0) {
      const appointmentsPerEmployee = tenantContext.totalAppointments / tenantContext.totalEmployees
      if (appointmentsPerEmployee > 20) {
        bottlenecks.push(`Hohe Auslastung: ${appointmentsPerEmployee.toFixed(1)} Termine pro Mitarbeiter`)
      }
    }

    // Prüfe Profitabilität
    if (financeContext.profit < 0) {
      bottlenecks.push(`Negative Gewinnmarge: Ausgaben übersteigen Umsatz`)
    }

    // Prüfe Aufgaben-Backlog
    if (tenantContext.totalTasks > 50) {
      bottlenecks.push(`Viele offene Aufgaben: ${tenantContext.totalTasks} Tasks`)
    }

    return bottlenecks
  }

  /**
   * Trends identifizieren (vereinfacht)
   */
  private identifyTrends(
    tenantContext: Awaited<ReturnType<typeof contextService.getTenantContext>>,
    financeContext: Awaited<ReturnType<typeof contextService.getFinanceContext>>
  ): {
    revenueTrend: 'up' | 'down' | 'stable'
    appointmentTrend: 'up' | 'down' | 'stable'
  } {
    // Vereinfachte Trend-Erkennung basierend auf Monatsdaten
    const months = Object.keys(financeContext.revenueByMonth).sort()
    
    let revenueTrend: 'up' | 'down' | 'stable' = 'stable'
    if (months.length >= 2) {
      const lastMonth = financeContext.revenueByMonth[months[months.length - 1]]
      const prevMonth = financeContext.revenueByMonth[months[months.length - 2]]
      
      if (lastMonth > prevMonth * 1.1) {
        revenueTrend = 'up'
      } else if (lastMonth < prevMonth * 0.9) {
        revenueTrend = 'down'
      }
    }

    // Appointment-Trend basierend auf aktueller Anzahl
    let appointmentTrend: 'up' | 'down' | 'stable' = 'stable'
    if (tenantContext.totalAppointments > 10) {
      appointmentTrend = 'up'
    } else if (tenantContext.totalAppointments < 5) {
      appointmentTrend = 'down'
    }

    return {
      revenueTrend,
      appointmentTrend,
    }
  }
}

// Singleton-Instanz
export const aiAnalyst = new AiAnalyst()

