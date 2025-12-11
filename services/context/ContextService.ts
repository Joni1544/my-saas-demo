/**
 * Context Service für FuerstFlow
 * Sammelt Kontext-Daten für KI-Analysen (DSGVO-konform, keine personenbezogenen Daten)
 */
import { prisma } from '@/lib/prisma'

export interface TenantContext {
  tenantId: string
  totalCustomers: number
  totalEmployees: number
  totalAppointments: number
  totalTasks: number
  totalExpenses: number
  revenue: number
  period: {
    start: Date
    end: Date
  }
}

export interface CustomerContext {
  customerId: string
  tenantId: string
  appointmentCount: number
  totalRevenue: number
  lastAppointmentDate?: Date
  tags: string[]
  isArchived: boolean
}

export interface AppointmentContext {
  appointmentId: string
  tenantId: string
  status: string
  price: number
  duration: number // in Minuten
  hasCustomer: boolean
  hasEmployee: boolean
  createdAt: Date
}

export interface EmployeeContext {
  employeeId: string
  tenantId: string
  appointmentCount: number
  totalRevenue: number
  isActive: boolean
  isSick: boolean
  hasVacation: boolean
}

export interface FinanceContext {
  tenantId: string
  totalRevenue: number
  totalExpenses: number
  profit: number
  period: {
    start: Date
    end: Date
  }
  expenseCategories: Record<string, number>
  revenueByMonth: Record<string, number>
}

class ContextService {
  /**
   * Tenant-Kontext abrufen
   */
  async getTenantContext(tenantId: string, periodDays: number = 30): Promise<TenantContext> {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)

    const [customers, employees, appointments, tasks, expenses] = await Promise.all([
      prisma.customer.count({
        where: { tenantId, isArchived: false },
      }),
      prisma.employee.count({
        where: { tenantId, isActive: true },
      }),
      prisma.appointment.count({
        where: {
          tenantId,
          startTime: { gte: startDate, lte: endDate },
        },
      }),
      prisma.task.count({
        where: {
          tenantId,
          createdAt: { gte: startDate },
        },
      }),
      prisma.expense.count({
        where: {
          tenantId,
          date: { gte: startDate, lte: endDate },
        },
      }),
    ])

    const appointmentsWithPrice = await prisma.appointment.findMany({
      where: {
        tenantId,
        startTime: { gte: startDate, lte: endDate },
      },
      select: {
        price: true,
      },
    })

    const revenue = appointmentsWithPrice.reduce((sum, apt) => {
      return sum + Number(apt.price || 0)
    }, 0)

    return {
      tenantId,
      totalCustomers: customers,
      totalEmployees: employees,
      totalAppointments: appointments,
      totalTasks: tasks,
      totalExpenses: expenses,
      revenue,
      period: {
        start: startDate,
        end: endDate,
      },
    }
  }

  /**
   * Kunden-Kontext abrufen (keine personenbezogenen Daten)
   */
  async getCustomerContext(customerId: string): Promise<CustomerContext | null> {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        appointments: {
          select: {
            startTime: true,
            price: true,
          },
          orderBy: {
            startTime: 'desc',
          },
        },
      },
    })

    if (!customer) {
      return null
    }

    const appointmentCount = customer.appointments.length
    const totalRevenue = customer.appointments.reduce((sum, apt) => {
      return sum + Number(apt.price || 0)
    }, 0)
    const lastAppointmentDate = customer.appointments[0]?.startTime

    return {
      customerId,
      tenantId: customer.tenantId,
      appointmentCount,
      totalRevenue,
      lastAppointmentDate,
      tags: customer.tags || [],
      isArchived: customer.isArchived,
    }
  }

  /**
   * Termin-Kontext abrufen
   */
  async getAppointmentContext(appointmentId: string): Promise<AppointmentContext | null> {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    })

    if (!appointment) {
      return null
    }

    const duration = Math.round(
      (new Date(appointment.endTime).getTime() - new Date(appointment.startTime).getTime()) / (1000 * 60)
    )

    return {
      appointmentId,
      tenantId: appointment.tenantId,
      status: appointment.status,
      price: Number(appointment.price || 0),
      duration,
      hasCustomer: !!appointment.customerId,
      hasEmployee: !!appointment.employeeId,
      createdAt: appointment.createdAt,
    }
  }

  /**
   * Mitarbeiter-Kontext abrufen (keine personenbezogenen Daten)
   */
  async getEmployeeContext(employeeId: string): Promise<EmployeeContext | null> {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        appointments: {
          select: {
            price: true,
          },
        },
        vacationRequests: {
          where: {
            status: 'APPROVED',
            startDate: { lte: new Date() },
            endDate: { gte: new Date() },
          },
        },
      },
    })

    if (!employee) {
      return null
    }

    const appointmentCount = employee.appointments.length
    const totalRevenue = employee.appointments.reduce((sum, apt) => {
      return sum + Number(apt.price || 0)
    }, 0)

    return {
      employeeId,
      tenantId: employee.tenantId,
      appointmentCount,
      totalRevenue,
      isActive: employee.isActive,
      isSick: employee.isSick,
      hasVacation: employee.vacationRequests.length > 0,
    }
  }

  /**
   * Finanz-Kontext abrufen
   */
  async getFinanceContext(tenantId: string, periodDays: number = 30): Promise<FinanceContext> {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)

    const [appointments, expenses] = await Promise.all([
      prisma.appointment.findMany({
        where: {
          tenantId,
          startTime: { gte: startDate, lte: endDate },
        },
        select: {
          price: true,
          startTime: true,
        },
      }),
      prisma.expense.findMany({
        where: {
          tenantId,
          date: { gte: startDate, lte: endDate },
        },
        select: {
          amount: true,
          category: true,
        },
      }),
    ])

    const totalRevenue = appointments.reduce((sum, apt) => {
      return sum + Number(apt.price || 0)
    }, 0)

    const totalExpenses = expenses.reduce((sum, exp) => {
      return sum + Number(exp.amount || 0)
    }, 0)

    // Gruppiere Ausgaben nach Kategorie
    const expenseCategories: Record<string, number> = {}
    expenses.forEach((exp) => {
      const category = exp.category || 'SONSTIGES'
      expenseCategories[category] = (expenseCategories[category] || 0) + Number(exp.amount || 0)
    })

    // Gruppiere Umsatz nach Monat
    const revenueByMonth: Record<string, number> = {}
    appointments.forEach((apt) => {
      const month = new Date(apt.startTime).toISOString().substring(0, 7) // YYYY-MM
      revenueByMonth[month] = (revenueByMonth[month] || 0) + Number(apt.price || 0)
    })

    return {
      tenantId,
      totalRevenue,
      totalExpenses,
      profit: totalRevenue - totalExpenses,
      period: {
        start: startDate,
        end: endDate,
      },
      expenseCategories,
      revenueByMonth,
    }
  }
}

// Singleton-Instanz
export const contextService = new ContextService()

