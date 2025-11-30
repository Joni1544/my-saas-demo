/**
 * Revenue API Route
 * GET: Umsatz-Daten für Zeitreihen-Graph
 * GET /api/revenue?mode=day|week|month|year&date=...
 */
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, eachDayOfInterval, eachMonthOfInterval } from 'date-fns'
import { de } from 'date-fns/locale'

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const mode = searchParams.get('mode') || 'month' // day, week, month, year
    const dateParam = searchParams.get('date')

    // Datum berechnen
    const now = new Date()
    let dateStart: Date
    let dateEnd: Date

    if (dateParam) {
      const date = new Date(dateParam)
      switch (mode) {
        case 'day':
          dateStart = startOfDay(date)
          dateEnd = endOfDay(date)
          break
        case 'week':
          dateStart = startOfWeek(date, { weekStartsOn: 1 })
          dateEnd = endOfWeek(date, { weekStartsOn: 1 })
          break
        case 'month':
          dateStart = startOfMonth(date)
          dateEnd = endOfMonth(date)
          break
        case 'year':
          dateStart = startOfYear(date)
          dateEnd = endOfYear(date)
          break
        default:
          dateStart = startOfMonth(date)
          dateEnd = endOfMonth(date)
      }
    } else {
      // Standard: Aktueller Zeitraum
      switch (mode) {
        case 'day':
          dateStart = startOfDay(now)
          dateEnd = endOfDay(now)
          break
        case 'week':
          dateStart = startOfWeek(now, { weekStartsOn: 1 })
          dateEnd = endOfWeek(now, { weekStartsOn: 1 })
          break
        case 'month':
          dateStart = startOfMonth(now)
          dateEnd = endOfMonth(now)
          break
        case 'year':
          dateStart = startOfYear(now)
          dateEnd = endOfYear(now)
          break
        default:
          dateStart = startOfMonth(now)
          dateEnd = endOfMonth(now)
      }
    }

    // Abgeschlossene Termine abrufen
    const completedAppointments = await prisma.appointment.findMany({
      where: {
        tenantId: session.user.tenantId,
        status: 'COMPLETED',
        startTime: {
          gte: dateStart,
          lte: dateEnd,
        },
        price: {
          gt: 0,
        },
      },
      select: {
        startTime: true,
        price: true,
      },
    })

    // Zeitreihen-Daten generieren
    const labels: string[] = []
    const revenue: number[] = []
    let total = 0

    if (mode === 'day') {
      // Tag: Stunden (0-23)
      const hours = Array.from({ length: 24 }, (_, i) => i)
      labels.push(...hours.map(h => `${h.toString().padStart(2, '0')}:00`))
      
      hours.forEach(hour => {
        const hourStart = new Date(dateStart)
        hourStart.setHours(hour, 0, 0, 0)
        const hourEnd = new Date(dateStart)
        hourEnd.setHours(hour, 59, 59, 999)
        
        const hourRevenue = completedAppointments
          .filter(apt => {
            const aptDate = new Date(apt.startTime)
            return aptDate >= hourStart && aptDate <= hourEnd
          })
          .reduce((sum, apt) => sum + (apt.price?.toNumber() || 0), 0)
        
        revenue.push(hourRevenue)
        total += hourRevenue
      })
    } else if (mode === 'week') {
      // Woche: Tage (Mo-So)
      const days = eachDayOfInterval({ start: dateStart, end: dateEnd })
      labels.push(...days.map(day => format(day, 'EEE', { locale: de })))
      
      days.forEach(day => {
        const dayStart = startOfDay(day)
        const dayEnd = endOfDay(day)
        
        const dayRevenue = completedAppointments
          .filter(apt => {
            const aptDate = new Date(apt.startTime)
            return aptDate >= dayStart && aptDate <= dayEnd
          })
          .reduce((sum, apt) => sum + (apt.price?.toNumber() || 0), 0)
        
        revenue.push(dayRevenue)
        total += dayRevenue
      })
    } else if (mode === 'month') {
      // Monat: Tage (01-31)
      const days = eachDayOfInterval({ start: dateStart, end: dateEnd })
      labels.push(...days.map(day => format(day, 'dd.MM')))
      
      days.forEach(day => {
        const dayStart = startOfDay(day)
        const dayEnd = endOfDay(day)
        
        const dayRevenue = completedAppointments
          .filter(apt => {
            const aptDate = new Date(apt.startTime)
            return aptDate >= dayStart && aptDate <= dayEnd
          })
          .reduce((sum, apt) => sum + (apt.price?.toNumber() || 0), 0)
        
        revenue.push(dayRevenue)
        total += dayRevenue
      })
    } else if (mode === 'year') {
      // Jahr: Monate (Jan-Dez)
      const months = eachMonthOfInterval({ start: dateStart, end: dateEnd })
      labels.push(...months.map(month => format(month, 'MMM', { locale: de })))
      
      months.forEach(month => {
        const monthStart = startOfMonth(month)
        const monthEnd = endOfMonth(month)
        
        const monthRevenue = completedAppointments
          .filter(apt => {
            const aptDate = new Date(apt.startTime)
            return aptDate >= monthStart && aptDate <= monthEnd
          })
          .reduce((sum, apt) => sum + (apt.price?.toNumber() || 0), 0)
        
        revenue.push(monthRevenue)
        total += monthRevenue
      })
    }

    return NextResponse.json({
      labels,
      revenue,
      total,
    })
  } catch (error) {
    console.error('Fehler beim Abrufen der Umsatz-Daten:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Umsatz-Daten' },
      { status: 500 }
    )
  }
}

