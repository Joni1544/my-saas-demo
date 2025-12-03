/**
 * Cron Job für tägliche Chef-Berichte
 * Wird täglich um 20:00 Uhr ausgeführt
 * Generiert automatisch Berichte für alle Tenants
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { generateDailyReport } from '@/lib/daily-report-generator'
import { startOfDay } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    // Security: Prüfe API Key
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = new Date()
    const reportDate = startOfDay(today)

    // Hole alle aktiven Tenants (Shops)
    const shops = await prisma.shop.findMany({
      include: {
        users: {
          where: {
            role: 'ADMIN',
          },
        },
      },
    })

    const results = []

    for (const shop of shops) {
      try {
        // Prüfe ob Bericht bereits existiert
        const existingReport = await prisma.dailyReport.findUnique({
          where: {
            tenantId_reportDate: {
              tenantId: shop.tenantId,
              reportDate,
            },
          },
        })

        if (existingReport) {
          results.push({
            tenantId: shop.tenantId,
            shopName: shop.name,
            status: 'skipped',
            message: 'Bericht bereits vorhanden',
          })
          continue
        }

        // Generiere Bericht
        const reportData = await generateDailyReport(shop.tenantId, today)

        // Speichere Bericht
        await prisma.dailyReport.create({
          data: {
            tenantId: shop.tenantId,
            reportDate,
            reportData: reportData as unknown as Prisma.InputJsonValue,
          },
        })

        results.push({
          tenantId: shop.tenantId,
          shopName: shop.name,
          status: 'success',
          message: 'Bericht erfolgreich generiert',
          reportDate: reportData.reportDate,
        })

        // TODO: Hier könnte Email-Versand implementiert werden
        // await sendReportEmail(shop.users[0]?.email, reportData)
      } catch (error) {
        console.error(`Fehler beim Generieren des Berichts für ${shop.name}:`, error)
        results.push({
          tenantId: shop.tenantId,
          shopName: shop.name,
          status: 'error',
          message: error instanceof Error ? error.message : 'Unbekannter Fehler',
        })
      }
    }

    return NextResponse.json({
      message: 'Tägliche Berichte generiert',
      date: reportDate.toISOString(),
      results,
      totalShops: shops.length,
      successful: results.filter(r => r.status === 'success').length,
      skipped: results.filter(r => r.status === 'skipped').length,
      errors: results.filter(r => r.status === 'error').length,
    })
  } catch (error) {
    console.error('Fehler beim Generieren der täglichen Berichte:', error)
    return NextResponse.json(
      { error: 'Fehler beim Generieren der täglichen Berichte' },
      { status: 500 }
    )
  }
}

