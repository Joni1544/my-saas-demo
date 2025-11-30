/**
 * Revenue Statistics API Route
 * GET: Umsatz-Statistiken (Tag, Woche, Monat, Jahr)
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

    // Nur Admin kann Statistiken sehen
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month' // day, week, month, year
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Datumsbereich berechnen
    const now = new Date()
    let dateStart: Date
    let dateEnd: Date = now

    if (startDate && endDate) {
      dateStart = new Date(startDate)
      dateEnd = new Date(endDate)
    } else {
      switch (period) {
        case 'day':
          dateStart = new Date(now.setHours(0, 0, 0, 0))
          break
        case 'week':
          dateStart = new Date(now)
          dateStart.setDate(now.getDate() - now.getDay())
          dateStart.setHours(0, 0, 0, 0)
          break
        case 'month':
          dateStart = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case 'year':
          dateStart = new Date(now.getFullYear(), 0, 1)
          break
        default:
          dateStart = new Date(now.getFullYear(), now.getMonth(), 1)
      }
    }

    // Umsatz abrufen (nur abgeschlossene Termine mit Preis)
    // Status: COMPLETED zählt als Umsatz
    const appointments = await prisma.appointment.findMany({
      where: {
        tenantId: session.user.tenantId,
        status: 'COMPLETED',
        price: { gt: 0 },
        startTime: {
          gte: dateStart,
          lte: dateEnd,
        },
      },
      include: {
        customer: true,
        employee: {
          include: {
            user: true,
          },
        },
      },
    })

    // Gesamtumsatz
    const totalRevenue = appointments.reduce((sum, apt) => {
      return sum + (apt.price ? Number(apt.price) : 0)
    }, 0)

    // Umsatz pro Kunde
    const revenueByCustomer = appointments.reduce((acc, apt) => {
      if (!apt.customer) return acc
      const customerId = apt.customer.id
      const customerName = `${apt.customer.firstName} ${apt.customer.lastName}`
      const price = apt.price ? Number(apt.price) : 0
      
      if (!acc[customerId]) {
        acc[customerId] = {
          id: customerId,
          name: customerName,
          revenue: 0,
          count: 0,
        }
      }
      acc[customerId].revenue += price
      acc[customerId].count += 1
      return acc
    }, {} as Record<string, { id: string; name: string; revenue: number; count: number }>)

    // Umsatz pro Mitarbeiter
    const revenueByEmployee = appointments.reduce((acc, apt) => {
      if (!apt.employee) return acc
      const employeeId = apt.employee.id
      const employeeName = apt.employee.user.name || apt.employee.user.email
      const price = apt.price ? Number(apt.price) : 0
      
      if (!acc[employeeId]) {
        acc[employeeId] = {
          id: employeeId,
          name: employeeName,
          revenue: 0,
          count: 0,
        }
      }
      acc[employeeId].revenue += price
      acc[employeeId].count += 1
      return acc
    }, {} as Record<string, { id: string; name: string; revenue: number; count: number }>)

    // Top Kunden (nach Umsatz)
    const topCustomers = Object.values(revenueByCustomer)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // No-Shows (stornierte Termine)
    const noShows = await prisma.appointment.count({
      where: {
        tenantId: session.user.tenantId,
        status: 'CANCELLED',
        startTime: {
          gte: dateStart,
          lte: dateEnd,
        },
      },
    })

    // Wiederkehrende Kunden (mehr als 1 Termin)
    const recurringCustomers = Object.values(revenueByCustomer)
      .filter(c => c.count > 1)
      .length

    return NextResponse.json({
      period,
      dateStart,
      dateEnd,
      totalRevenue,
      appointmentCount: appointments.length,
      revenueByCustomer: Object.values(revenueByCustomer),
      revenueByEmployee: Object.values(revenueByEmployee),
      topCustomers,
      noShows,
      recurringCustomers,
    })
  } catch (error) {
    console.error('Fehler beim Abrufen der Statistiken:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Statistiken' },
      { status: 500 }
    )
  }
}

