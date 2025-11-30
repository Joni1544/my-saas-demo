/**
 * Finance Timeseries API Route
 * GET: Zeitreihen-Daten für Umsatz, Ausgaben und Gewinn
 * GET /api/finances/timeseries?mode=month|week|year&from=...&to=...
 */
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, eachDayOfInterval, eachMonthOfInterval } from 'date-fns'
import { de } from 'date-fns/locale'

export const revalidate = 60 // Cache für 60 Sekunden

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
    const mode = searchParams.get('mode') || 'month' // week, month, year
    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')

    // Datumsbereich berechnen
    const now = new Date()
    let dateStart: Date
    let dateEnd: Date = now

    if (fromParam && toParam) {
      dateStart = new Date(fromParam)
      dateEnd = new Date(toParam)
    } else {
      // Standard: basierend auf mode
      switch (mode) {
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

    // Umsatz (abgeschlossene Termine)
    const completedAppointments = await prisma.appointment.findMany({
      where: {
        tenantId: session.user.tenantId,
        status: {
          in: ['COMPLETED', 'DONE'],
        },
        startTime: {
          gte: dateStart,
          lte: dateEnd,
        },
      },
      select: {
        startTime: true,
        price: true,
      },
    })

    // Ausgaben
    const expenses = await prisma.expense.findMany({
      where: {
        tenantId: session.user.tenantId,
        date: {
          gte: dateStart,
          lte: dateEnd,
        },
      },
      select: {
        date: true,
        amount: true,
      },
    })

    // Zeitreihen-Daten generieren
    const labels: string[] = []
    const revenue: number[] = []
    const expensesData: number[] = []
    const profit: number[] = []

    if (mode === 'week') {
      // Woche: Täglich
      const days = eachDayOfInterval({ start: dateStart, end: dateEnd })
      labels = days.map(day => format(day, 'EEE', { locale: de }))
      
      days.forEach(day => {
        const dayStart = new Date(day)
        dayStart.setHours(0, 0, 0, 0)
        const dayEnd = new Date(day)
        dayEnd.setHours(23, 59, 59, 999)
        
        const dayRevenue = completedAppointments
          .filter(apt => {
            const aptDate = new Date(apt.startTime)
            return aptDate >= dayStart && aptDate <= dayEnd
          })
          .reduce((sum, apt) => sum + (apt.price?.toNumber() || 0), 0)
        
        const dayExpenses = expenses
          .filter(exp => {
            const expDate = new Date(exp.date)
            return expDate >= dayStart && expDate <= dayEnd
          })
          .reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0)
        
        revenue.push(dayRevenue)
        expensesData.push(dayExpenses)
        profit.push(dayRevenue - dayExpenses)
      })
    } else if (mode === 'month') {
      // Monat: Täglich
      const days = eachDayOfInterval({ start: dateStart, end: dateEnd })
      labels = days.map(day => format(day, 'dd.MM'))
      
      days.forEach(day => {
        const dayStart = new Date(day)
        dayStart.setHours(0, 0, 0, 0)
        const dayEnd = new Date(day)
        dayEnd.setHours(23, 59, 59, 999)
        
        const dayRevenue = completedAppointments
          .filter(apt => {
            const aptDate = new Date(apt.startTime)
            return aptDate >= dayStart && aptDate <= dayEnd
          })
          .reduce((sum, apt) => sum + (apt.price?.toNumber() || 0), 0)
        
        const dayExpenses = expenses
          .filter(exp => {
            const expDate = new Date(exp.date)
            return expDate >= dayStart && expDate <= dayEnd
          })
          .reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0)
        
        revenue.push(dayRevenue)
        expensesData.push(dayExpenses)
        profit.push(dayRevenue - dayExpenses)
      })
    } else if (mode === 'year') {
      // Jahr: Monatlich
      const months = eachMonthOfInterval({ start: dateStart, end: dateEnd })
      labels = months.map(month => format(month, 'MMM yyyy', { locale: de }))
      
      months.forEach(month => {
        const monthStart = startOfMonth(month)
        const monthEnd = endOfMonth(month)
        
        const monthRevenue = completedAppointments
          .filter(apt => {
            const aptDate = new Date(apt.startTime)
            return aptDate >= monthStart && aptDate <= monthEnd
          })
          .reduce((sum, apt) => sum + (apt.price?.toNumber() || 0), 0)
        
        const monthExpenses = expenses
          .filter(exp => {
            const expDate = new Date(exp.date)
            return expDate >= monthStart && expDate <= monthEnd
          })
          .reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0)
        
        revenue.push(monthRevenue)
        expensesData.push(monthExpenses)
        profit.push(monthRevenue - monthExpenses)
      })
    }

    return NextResponse.json({
      labels,
      revenue,
      expenses: expensesData,
      profit,
    })
  } catch (error) {
    console.error('Fehler beim Abrufen der Zeitreihen-Daten:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Zeitreihen-Daten' },
      { status: 500 }
    )
  }
}

