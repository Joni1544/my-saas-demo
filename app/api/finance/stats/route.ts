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

    // Sicherstellen, dass Datum korrekt gesetzt wird (inkl. Zeit)
    const dateStart = startDate ? new Date(startDate + 'T00:00:00.000Z') : new Date(new Date().getFullYear(), 0, 1)
    const dateEnd = endDate ? new Date(endDate + 'T23:59:59.999Z') : new Date()
    
    // Sicherstellen, dass Datum korrekt gesetzt wird (inkl. Zeit)
    const dateStartFixed = new Date(dateStart)
    dateStartFixed.setHours(0, 0, 0, 0)
    const dateEndFixed = new Date(dateEnd)
    dateEndFixed.setHours(23, 59, 59, 999)
    
    // Debug-Logging (kann später entfernt werden)
    console.log('Finance Stats Filter:', { startDate, endDate, dateStartFixed, dateEndFixed })

    // Umsatz (aus abgeschlossenen Terminen)
    // Status: COMPLETED zählt als Umsatz
    const completedAppointments = await prisma.appointment.findMany({
      where: {
        tenantId: session.user.tenantId,
        status: 'COMPLETED',
        startTime: {
          gte: dateStartFixed,
          lte: dateEndFixed,
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
          gte: dateStartFixed,
          lte: dateEndFixed,
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

    // Daueraufträge (Summe aller aktiven Daueraufträge)
    const recurringExpenses = await prisma.recurringExpense.findMany({
      where: {
        tenantId: session.user.tenantId,
        isActive: true,
      },
    })

    const totalRecurringExpenses = recurringExpenses.reduce(
      (sum, rec) => sum + parseFloat(rec.amount.toString()),
      0
    )

    // Gewinn = Umsatz - Ausgaben - Daueraufträge
    const profit = totalRevenue - totalExpenses - totalRecurringExpenses

    // Revenue by Customer
    const revenueByCustomerMap = new Map<string, { id: string; name: string; revenue: number }>()
    completedAppointments.forEach((apt) => {
      if (apt.customerId) {
        const customer = apt.customer
        if (customer) {
          const current = revenueByCustomerMap.get(apt.customerId) || {
            id: apt.customerId,
            name: `${customer.firstName} ${customer.lastName}`,
            revenue: 0,
          }
          current.revenue += apt.price?.toNumber() || 0
          revenueByCustomerMap.set(apt.customerId, current)
        }
      }
    })
    const revenueByCustomer = Array.from(revenueByCustomerMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Revenue by Employee
    const revenueByEmployeeMap = new Map<string, { id: string; name: string; revenue: number }>()
    completedAppointments.forEach((apt) => {
      if (apt.employeeId) {
        const employee = apt.employee
        if (employee && employee.user) {
          const current = revenueByEmployeeMap.get(apt.employeeId) || {
            id: apt.employeeId,
            name: employee.user.name || employee.user.email,
            revenue: 0,
          }
          current.revenue += apt.price?.toNumber() || 0
          revenueByEmployeeMap.set(apt.employeeId, current)
        }
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

      const monthStartFixed = new Date(monthStart)
      monthStartFixed.setHours(0, 0, 0, 0)
      const monthEndFixed = new Date(monthEnd)
      monthEndFixed.setHours(23, 59, 59, 999)
      
      const monthRevenue = completedAppointments
        .filter((apt) => {
          const aptDate = new Date(apt.startTime)
          return aptDate >= monthStartFixed && aptDate <= monthEndFixed
        })
        .reduce((sum, apt) => sum + (apt.price?.toNumber() || 0), 0)

      const monthExpenses = expenses
        .filter((exp) => {
          const expDate = new Date(exp.date)
          return expDate >= monthStartFixed && expDate <= monthEndFixed
        })
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
      totalRecurringExpenses,
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

