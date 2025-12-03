/**
 * Daily Report API Route
 * GET: Generiert einen täglichen Bericht für einen Tenant
 * POST: Manuell einen Bericht generieren (für Tests)
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { generateDailyReport, type DailyReportData } from '@/lib/daily-report-generator'
import { startOfDay } from 'date-fns'

// GET: Hole Bericht für ein bestimmtes Datum
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')
    const reportDate = dateParam ? new Date(dateParam) : new Date()

    // Prüfe ob Bericht bereits existiert
    const existingReport = await prisma.dailyReport.findUnique({
      where: {
        tenantId_reportDate: {
          tenantId: session.user.tenantId,
          reportDate: startOfDay(reportDate),
        },
      },
    })

    if (existingReport) {
      return NextResponse.json({
        report: existingReport.reportData as unknown as DailyReportData,
        cached: true,
      })
    }

    // Generiere neuen Bericht
    const reportData = await generateDailyReport(session.user.tenantId, reportDate)

    // Speichere Bericht
    await prisma.dailyReport.upsert({
      where: {
        tenantId_reportDate: {
          tenantId: session.user.tenantId,
          reportDate: startOfDay(reportDate),
        },
      },
      create: {
        tenantId: session.user.tenantId,
        reportDate: startOfDay(reportDate),
        reportData: reportData as unknown as Prisma.InputJsonValue,
      },
      update: {
        reportData: reportData as unknown as Prisma.InputJsonValue,
      },
    })

    return NextResponse.json({
      report: reportData,
      cached: false,
    })
  } catch (error) {
    console.error('Fehler beim Generieren des Berichts:', error)
    return NextResponse.json(
      { error: 'Fehler beim Generieren des Berichts' },
      { status: 500 }
    )
  }
}

// POST: Manuell einen Bericht generieren
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { date } = body
    const reportDate = date ? new Date(date) : new Date()

    // Generiere Bericht
    const reportData = await generateDailyReport(session.user.tenantId, reportDate)

    // Speichere Bericht
    await prisma.dailyReport.upsert({
      where: {
        tenantId_reportDate: {
          tenantId: session.user.tenantId,
          reportDate: startOfDay(reportDate),
        },
      },
      create: {
        tenantId: session.user.tenantId,
        reportDate: startOfDay(reportDate),
        reportData: reportData as unknown as Prisma.InputJsonValue,
      },
      update: {
        reportData: reportData as unknown as Prisma.InputJsonValue,
      },
    })

    return NextResponse.json({
      success: true,
      report: reportData,
      message: 'Bericht erfolgreich generiert',
    })
  } catch (error) {
    console.error('Fehler beim Generieren des Berichts:', error)
    return NextResponse.json(
      { error: 'Fehler beim Generieren des Berichts' },
      { status: 500 }
    )
  }
}

