/**
 * Finance Statistics API Route
 * GET: Finanzstatistiken (Umsatz, Ausgaben, Gewinn)
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const dateStart = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1)
    const dateEnd = endDate ? new Date(endDate) : new Date()

    // Umsatz (aus abgeschlossenen Terminen)
    const completedAppointments = await prisma.appointment.findMany({
      where: {
        tenantId: session.user.tenantId,
        status: 'COMPLETED',
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

    const totalRevenue = completedAppointments.reduce(
      (sum, apt) => sum + (apt.price?.toNumber() || 0),
      0
    )

    // Ausgaben
    const expenses = await prisma.expense.findMany({
      where: {
        tenantId: session.user.tenantId,
        date: {
          gte: dateStart,
          lte: dateEnd,
        },
      },
      include: {
        employee: {
          include: {
            user: true,
          },
        },
      },
    })

    const totalExpenses = expenses.reduce(
      (sum, exp) => sum + parseFloat(exp.amount.toString()),
      0
    )

    const profit = totalRevenue - totalExpenses

    // Revenue by Customer
    const revenueByCustomerMap = new Map<string, { id: string; name: string; revenue: number }>()
    completedAppointments.forEach((apt) => {
      if (apt.customerId && apt.customer) {
        const current = revenueByCustomerMap.get(apt.customerId) || {
          id: apt.customerId,
          name: `${apt.customer.firstName} ${apt.customer.lastName}`,
          revenue: 0,
        }
        current.revenue += apt.price?.toNumber() || 0
        revenueByCustomerMap.set(apt.customerId, current)
      }
    })
    const revenueByCustomer = Array.from(revenueByCustomerMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Revenue by Employee
    const revenueByEmployeeMap = new Map<string, { id: string; name: string; revenue: number }>()
    completedAppointments.forEach((apt) => {
      if (apt.employeeId && apt.employee?.user) {
        const current = revenueByEmployeeMap.get(apt.employeeId) || {
          id: apt.employeeId,
          name: apt.employee.user.name || apt.employee.user.email,
          revenue: 0,
        }
        current.revenue += apt.price?.toNumber() || 0
        revenueByEmployeeMap.set(apt.employeeId, current)
      }
    })
    const revenueByEmployee = Array.from(revenueByEmployeeMap.values())
      .sort((a, b) => b.revenue - a.revenue)

    // Expenses by Category
    const expensesByCategoryMap = new Map<string, number>()
    expenses.forEach((exp) => {
      const current = expensesByCategoryMap.get(exp.category) || 0
      expensesByCategoryMap.set(exp.category, current + parseFloat(exp.amount.toString()))
    })
    const expensesByCategory = Array.from(expensesByCategoryMap.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)

    // Profit per Employee
    const profitByEmployee = revenueByEmployee.map((emp) => {
      const employeeExpenses = expenses
        .filter((exp) => exp.employeeId === emp.id)
        .reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0)
      return {
        ...emp,
        expenses: employeeExpenses,
        profit: emp.revenue - employeeExpenses,
      }
    })

    // Profit per Customer
    const profitByCustomer = revenueByCustomer.map((cust) => {
      // Kunden haben keine direkten Ausgaben, nur Umsatz
      return {
        ...cust,
        profit: cust.revenue,
      }
    })

    // Time series data (monthly)
    const monthlyData: Array<{ month: string; revenue: number; expenses: number; profit: number }> = []
    const current = new Date(dateStart)
    while (current <= dateEnd) {
      const monthStart = new Date(current.getFullYear(), current.getMonth(), 1)
      const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0, 23, 59, 59)

      const monthRevenue = completedAppointments
        .filter((apt) => apt.startTime >= monthStart && apt.startTime <= monthEnd)
        .reduce((sum, apt) => sum + (apt.price?.toNumber() || 0), 0)

      const monthExpenses = expenses
        .filter((exp) => exp.date >= monthStart && exp.date <= monthEnd)
        .reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0)

      monthlyData.push({
        month: monthStart.toLocaleDateString('de-DE', { month: 'short', year: 'numeric' }),
        revenue: monthRevenue,
        expenses: monthExpenses,
        profit: monthRevenue - monthExpenses,
      })

      current.setMonth(current.getMonth() + 1)
    }

    return NextResponse.json({
      totalRevenue,
      totalExpenses,
      profit,
      revenueByCustomer,
      revenueByEmployee,
      expensesByCategory,
      profitByEmployee,
      profitByCustomer,
      monthlyData,
    })
  } catch (error) {
    console.error('Fehler beim Abrufen der Finanzstatistiken:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Finanzstatistiken' },
      { status: 500 }
    )
  }
}

