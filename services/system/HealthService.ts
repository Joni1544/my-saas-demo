/**
 * Health Service für FuerstFlow
 * Prüft System-Gesundheit und Verfügbarkeit
 */
import { prisma } from '@/lib/prisma'
import { aiUsageService } from '../ai/AiUsageService'
import { eventBus } from '@/events/EventBus'
import { automationEngine } from '@/automation/AutomationEngine'
import { autopilotService } from '@/autopilot/AutopilotService'

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: Date
  checks: {
    database: HealthCheckResult
    eventBus: HealthCheckResult
    automationEngine: HealthCheckResult
    autopilot: HealthCheckResult
  }
  uptime: number
}

export interface HealthCheckResult {
  status: 'ok' | 'warning' | 'error'
  message: string
  responseTime?: number
}

class HealthService {
  private startTime: Date = new Date()

  /**
   * Vollständigen Health-Check durchführen
   */
  async checkHealth(): Promise<HealthStatus> {
    const checks = {
      database: await this.checkDatabase(),
      eventBus: await this.checkEventBus(),
      automationEngine: await this.checkAutomationEngine(),
      autopilot: await this.checkAutopilot(),
    }

    // Bestimme Gesamt-Status
    const hasError = Object.values(checks).some((check) => check.status === 'error')
    const hasWarning = Object.values(checks).some((check) => check.status === 'warning')

    const status: 'healthy' | 'degraded' | 'unhealthy' = hasError
      ? 'unhealthy'
      : hasWarning
      ? 'degraded'
      : 'healthy'

    return {
      status,
      timestamp: new Date(),
      checks,
      uptime: Date.now() - this.startTime.getTime(),
    }
  }

  /**
   * Datenbank-Verbindung prüfen
   */
  private async checkDatabase(): Promise<HealthCheckResult> {
    const startTime = Date.now()

    try {
      await prisma.$queryRaw`SELECT 1`
      const responseTime = Date.now() - startTime

      return {
        status: 'ok',
        message: 'Database connection healthy',
        responseTime,
      }
    } catch (error) {
      return {
        status: 'error',
        message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime: Date.now() - startTime,
      }
    }
  }

  /**
   * Event-Bus prüfen
   */
  private async checkEventBus(): Promise<HealthCheckResult> {
    try {
      const queueStatus = eventBus.getQueueStatus()

      if (queueStatus.queueLength > 1000) {
        return {
          status: 'warning',
          message: `Event queue is large: ${queueStatus.queueLength} events`,
        }
      }

      return {
        status: 'ok',
        message: `Event bus healthy (queue: ${queueStatus.queueLength})`,
      }
    } catch (error) {
      return {
        status: 'error',
        message: `Event bus check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  }

  /**
   * Automation Engine prüfen
   */
  private async checkAutomationEngine(): Promise<HealthCheckResult> {
    try {
      const status = automationEngine.getStatus()

      if (!status.enabled) {
        return {
          status: 'warning',
          message: 'Automation engine is disabled',
        }
      }

      return {
        status: 'ok',
        message: `Automation engine healthy (${status.ruleCount} rules registered)`,
      }
    } catch (error) {
      return {
        status: 'error',
        message: `Automation engine check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  }

  /**
   * Autopilot prüfen
   */
  private async checkAutopilot(): Promise<HealthCheckResult> {
    try {
      const status = autopilotService.getStatus()

      if (!status.enabled) {
        return {
          status: 'warning',
          message: 'Autopilot is disabled',
        }
      }

      return {
        status: 'ok',
        message: `Autopilot healthy (enabled: ${status.enabled}, running: ${status.running})`,
      }
    } catch (error) {
      return {
        status: 'error',
        message: `Autopilot check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  }

  /**
   * KI-Usage prüfen
   */
  private async checkAiUsage(tenantId: string): Promise<HealthCheckResult> {
    try {
      const currentMonth = await aiUsageService.getCurrentMonthUsage(tenantId)
      
      return {
        status: 'ok',
        message: `AI Usage: ${currentMonth.totalTokens} tokens, ${currentMonth.totalCost.toFixed(2)} EUR`,
      }
    } catch (error) {
      return {
        status: 'error',
        message: `AI Usage check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  }
}

// Singleton-Instanz
export const healthService = new HealthService()

