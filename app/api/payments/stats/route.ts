/**
 * Payment Stats API Route
 * Statistiken für Zahlungen
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: {
      tenantId: string
      status?: string
      createdAt?: {
        gte?: Date
        lte?: Date
      }
    } = {
      tenantId: session.user.tenantId,
      status: 'PAID',
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    // Hole alle bezahlten Zahlungen
    const payments = await prisma.payment.findMany({
      where,
      select: {
        amount: true,
        method: true,
        createdAt: true,
      },
    })

    // Berechne Statistiken
    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0)

    // Verteilung nach Zahlungsart
    const methodDistribution: Record<string, { count: number; amount: number }> = {}
    payments.forEach((payment) => {
      const method = payment.method
      if (!methodDistribution[method]) {
        methodDistribution[method] = { count: 0, amount: 0 }
      }
      methodDistribution[method].count++
      methodDistribution[method].amount += Number(payment.amount)
    })

    // Zahlungen pro Tag
    const dailyPayments: Record<string, { count: number; amount: number }> = {}
    payments.forEach((payment) => {
      const date = new Date(payment.createdAt).toISOString().split('T')[0]
      if (!dailyPayments[date]) {
        dailyPayments[date] = { count: 0, amount: 0 }
      }
      dailyPayments[date].count++
      dailyPayments[date].amount += Number(payment.amount)
    })

    // Heute
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayPayments = payments.filter(
      (p) => new Date(p.createdAt) >= today && p.status === 'PAID'
    )
    const todayRevenue = todayPayments.reduce((sum, p) => sum + Number(p.amount), 0)

    // Fehlgeschlagene Zahlungen
    const failedPayments = await prisma.payment.count({
      where: {
        tenantId: session.user.tenantId,
        status: 'FAILED',
      },
    })

    // Beliebteste Zahlungsart
    const mostPopularMethod = Object.entries(methodDistribution).sort(
      (a, b) => b[1].count - a[1].count
    )[0]?.[0]

    return NextResponse.json({
      stats: {
        totalRevenue,
        todayRevenue,
        todayCount: todayPayments.length,
        failedCount: failedPayments,
        mostPopularMethod,
        methodDistribution,
        dailyPayments,
      },
    })
  } catch (error) {
    console.error('[Payment Stats API] Error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Statistiken' },
      { status: 500 }
    )
  }
}

