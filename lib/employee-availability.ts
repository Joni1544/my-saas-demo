/**
 * Employee Availability Helper
 * Prüft ob ein Mitarbeiter an einem bestimmten Datum verfügbar ist
 */
import { prisma } from './prisma'
import { isWithinInterval, isSameDay, parse, format } from 'date-fns'

export interface AvailabilityCheck {
  isAvailable: boolean
  reason?: string
  details?: {
    isSick?: boolean
    hasVacation?: boolean
    isDayOff?: boolean
    outsideWorkHours?: boolean
    inBreakTime?: boolean
  }
}

/**
 * Prüft ob ein Mitarbeiter an einem bestimmten Datum/Zeitraum verfügbar ist
 */
export async function checkEmployeeAvailability(
  employeeId: string,
  dateStart: Date,
  dateEnd: Date
): Promise<AvailabilityCheck> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      vacationRequests: {
        where: {
          status: 'APPROVED',
        },
      },
    },
  })

  if (!employee) {
    return { isAvailable: false, reason: 'Mitarbeiter nicht gefunden' }
  }

  const details: AvailabilityCheck['details'] = {}

  // Prüfe ob Mitarbeiter krank ist
  if (employee.isSick) {
    details.isSick = true
    return {
      isAvailable: false,
      reason: 'Mitarbeiter ist krank gemeldet',
      details,
    }
  }

  // Prüfe ob Mitarbeiter Urlaub hat
  const hasVacation = employee.vacationRequests.some((request) => {
    const vacationStart = new Date(request.startDate)
    const vacationEnd = new Date(request.endDate)
    
    return (
      isSameDay(vacationStart, dateStart) ||
      isSameDay(vacationEnd, dateEnd) ||
      isWithinInterval(dateStart, {
        start: vacationStart,
        end: vacationEnd,
      }) ||
      isWithinInterval(dateEnd, {
        start: vacationStart,
        end: vacationEnd,
      }) ||
      (vacationStart <= dateStart && vacationEnd >= dateEnd)
    )
  })

  if (hasVacation) {
    details.hasVacation = true
    return {
      isAvailable: false,
      reason: 'Mitarbeiter hat Urlaub',
      details,
    }
  }

  // Prüfe freie Tage (nur für Startdatum)
  const dayOfWeek = dateStart.toLocaleDateString('en-US', { weekday: 'long' })
  if (employee.daysOff.includes(dayOfWeek)) {
    details.isDayOff = true
    return {
      isAvailable: false,
      reason: `Mitarbeiter hat an diesem Tag frei (${dayOfWeek})`,
      details,
    }
  }

  // Prüfe Arbeitszeiten (nur wenn gesetzt)
  if (employee.workStart && employee.workEnd) {
    try {
      const workStartTime = parse(employee.workStart, 'HH:mm', new Date())
      const workEndTime = parse(employee.workEnd, 'HH:mm', new Date())
      const appointmentStartTime = parse(format(dateStart, 'HH:mm'), 'HH:mm', new Date())
      const appointmentEndTime = parse(format(dateEnd, 'HH:mm'), 'HH:mm', new Date())

      if (
        appointmentStartTime < workStartTime ||
        appointmentEndTime > workEndTime
      ) {
        details.outsideWorkHours = true
        return {
          isAvailable: false,
          reason: `Termin liegt außerhalb der Arbeitszeiten (${employee.workStart} - ${employee.workEnd})`,
          details,
        }
      }

      // Prüfe Pausenzeit
      if (employee.breakStart && employee.breakEnd) {
        const breakStartTime = parse(employee.breakStart, 'HH:mm', new Date())
        const breakEndTime = parse(employee.breakEnd, 'HH:mm', new Date())

        if (
          (appointmentStartTime >= breakStartTime && appointmentStartTime < breakEndTime) ||
          (appointmentEndTime > breakStartTime && appointmentEndTime <= breakEndTime) ||
          (appointmentStartTime <= breakStartTime && appointmentEndTime >= breakEndTime)
        ) {
          details.inBreakTime = true
          return {
            isAvailable: false,
            reason: `Termin fällt in die Pausenzeit (${employee.breakStart} - ${employee.breakEnd})`,
            details,
          }
        }
      }
    } catch (error) {
      // Wenn Zeit-Parsing fehlschlägt, ignoriere es
      console.warn('Fehler beim Parsen der Arbeitszeiten:', error)
    }
  }

  return { isAvailable: true, details }
}

/**
 * Filtert verfügbare Mitarbeiter für einen Zeitraum
 */
export async function getAvailableEmployees(
  tenantId: string,
  startDate: Date,
  endDate: Date
): Promise<string[]> {
  const employees = await prisma.employee.findMany({
    where: {
      tenantId,
      isActive: true,
      isSick: false, // Nur gesunde Mitarbeiter
    },
    include: {
      vacationRequests: {
        where: {
          status: 'APPROVED',
        },
      },
    },
  })

  const availableEmployeeIds: string[] = []

  for (const employee of employees) {
    const availability = await checkEmployeeAvailability(
      employee.id,
      startDate,
      endDate
    )

    if (availability.isAvailable) {
      availableEmployeeIds.push(employee.id)
    }
  }

  return availableEmployeeIds
}

/**
 * Prüft alle Termine eines Mitarbeiters und setzt Status auf NEEDS_REASSIGNMENT wenn krank
 */
export async function checkAndReassignAppointmentsForSickEmployee(
  employeeId: string
): Promise<number> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  })

  if (!employee || !employee.isSick) {
    return 0
  }

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // Hole alle Termine ab heute
  const appointments = await prisma.appointment.findMany({
    where: {
      employeeId,
      startTime: {
        gte: todayStart,
      },
      status: {
        not: 'NEEDS_REASSIGNMENT', // Bereits zugewiesen
      },
    },
  })

  let reassignedCount = 0

  for (const appointment of appointments) {
    await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        status: 'NEEDS_REASSIGNMENT',
      },
    })
    reassignedCount++
  }

  return reassignedCount
}
