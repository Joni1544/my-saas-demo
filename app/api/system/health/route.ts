/**
 * System Health Check API Route
 */
import { NextResponse } from 'next/server'
import { healthService } from '@/services/system/HealthService'

export async function GET() {
  try {
    const health = await healthService.checkHealth()

    // Setze HTTP-Status basierend auf Health-Status
    const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503

    return NextResponse.json(health, { status: statusCode })
  } catch (error) {
    console.error('[Health API] Error checking health:', error)
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date(),
        error: 'Health check failed',
      },
      { status: 503 }
    )
  }
}

