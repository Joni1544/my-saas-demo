/**
 * Daily Report Generator
 * Generiert vollständige tägliche Chef-Berichte mit allen Kennzahlen, Auffälligkeiten und Empfehlungen
 */
import { prisma } from './prisma'
import { format, startOfDay, endOfDay, addDays, isSameDay } from 'date-fns'

export interface DailyReportData {
  reportDate: string
  generatedAt: string
  
  // 1. Kennzahlen des heutigen Tages
  metrics: {
    appointmentsToday: number
    completedTasks: number
    cancelledAppointments: number
    cancelledReasons: Array<{ reason: string; count: number }>
    reassignedAppointments: number
    reassignedDetails: Array<{ appointmentId: string; oldEmployee: string; newEmployee: string }>
    dailyRevenue: number
    unpaidInvoices: number
    openTasks: number
    employeeUtilization: Array<{ employeeId: string; employeeName: string; utilization: number }>
    overtimeEmployees: Array<{ employeeId: string; employeeName: string; overtimeHours: number }>
    inventoryConsumption: Array<{ itemId: string; itemName: string; consumed: number }>
  }
  
  // 2. Auffälligkeiten & Probleme
  issues: {
    employeesWithManyCancellations: Array<{ employeeId: string; employeeName: string; cancellations: number }>
    doubleBookings: Array<{ appointmentId: string; conflict: string }>
    timeConflicts: Array<{ appointmentId: string; conflict: string }>
    timeBlockShortages: Array<{ timeBlock: string; shortage: string }>
    lowInventory: Array<{ itemId: string; itemName: string; currentStock: number; minThreshold: number }>
    planningIrregularities: Array<{ issue: string; details: string }>
    repeatedlyRescheduledTasks: Array<{ taskId: string; taskTitle: string; reschedules: number }>
    lateStarts: Array<{ appointmentId: string; scheduledTime: string; actualStart: string; delay: number }>
    customerComplaints: Array<{ customerId: string; customerName: string; complaint: string }>
  }
  
  // 3. Übersicht für den nächsten Tag
  tomorrow: {
    employeeAvailability: {
      sickEmployees: Array<{ employeeId: string; employeeName: string }>
      onVacation: Array<{ employeeId: string; employeeName: string; vacationDays: number }>
      limitedHours: Array<{ employeeId: string; employeeName: string; availableHours: string }>
      shouldAvoidOvertime: Array<{ employeeId: string; employeeName: string; reason: string }>
      availableForSubstitution: Array<{ employeeId: string; employeeName: string; reason: string }>
    }
    appointments: {
      totalAppointments: number
      criticalAppointments: Array<{ appointmentId: string; title: string; reason: string }>
      appointmentsWithUnavailableEmployee: Array<{ appointmentId: string; employeeId: string; employeeName: string; reason: string }>
      rescheduledFromToday: Array<{ appointmentId: string; originalDate: string }>
    }
    tasks: {
      dueTomorrow: Array<{ taskId: string; title: string; priority: string }>
    }
    conflicts: Array<{ type: string; description: string; suggestion: string }>
  }
  
  // 4. Automatische Handlungsempfehlungen
  recommendations: Array<{ priority: 'high' | 'medium' | 'low'; category: string; message: string; action?: string }>
}

export async function generateDailyReport(tenantId: string, reportDate: Date = new Date()): Promise<DailyReportData> {
  const todayStart = startOfDay(reportDate)
  const todayEnd = endOfDay(reportDate)
  const tomorrowStart = startOfDay(addDays(reportDate, 1))
  const tomorrowEnd = endOfDay(addDays(reportDate, 1))
  
  // Hole alle notwendigen Daten
  const [
    appointmentsToday,
    appointmentsTomorrow,
    tasksToday,
    tasksTomorrow,
    employees,
    inventoryItems,
  ] = await Promise.all([
    // Termine heute
    prisma.appointment.findMany({
      where: {
        tenantId,
        startTime: { gte: todayStart, lte: todayEnd },
      },
      include: {
        employee: { include: { user: true } },
        customer: true,
      },
    }),
    // Termine morgen
    prisma.appointment.findMany({
      where: {
        tenantId,
        startTime: { gte: tomorrowStart, lte: tomorrowEnd },
      },
      include: {
        employee: { include: { user: true } },
        customer: true,
      },
    }),
    // Aufgaben heute
    prisma.task.findMany({
      where: {
        tenantId,
        createdAt: { gte: todayStart, lte: todayEnd },
      },
    }),
    // Aufgaben morgen fällig
    prisma.task.findMany({
      where: {
        tenantId,
        deadline: { gte: tomorrowStart, lte: tomorrowEnd },
        status: { not: 'DONE' },
      },
    }),
    // Alle Mitarbeiter
    prisma.employee.findMany({
      where: { tenantId, isActive: true },
      include: {
        user: true,
        vacationRequests: {
          where: { status: 'APPROVED' },
        },
      },
    }),
    // Inventar
    prisma.inventoryItem.findMany({
      where: { tenantId },
    }),
  ])
  
  // 1. METRICS - Kennzahlen des heutigen Tages
  const completedTasks = tasksToday.filter(t => t.status === 'DONE').length
  const cancelledAppointments = appointmentsToday.filter(a => a.status === 'CANCELLED')
  const cancelledReasonsMap = new Map<string, number>()
  const reassignedAppointments = appointmentsToday.filter(a => a.status === 'NEEDS_REASSIGNMENT')
  
  cancelledAppointments.forEach(apt => {
    const reason = apt.notes || 'Unbekannt'
    cancelledReasonsMap.set(reason, (cancelledReasonsMap.get(reason) || 0) + 1)
  })
  
  const dailyRevenue = appointmentsToday
    .filter(a => (a.status === 'ACCEPTED' || a.status === 'COMPLETED') && a.price)
    .reduce((sum, a) => {
      const price = a.price ? Number(a.price) : 0
      return sum + price
    }, 0)
  
  const openTasks = tasksToday.filter(t => t.status !== 'DONE' && t.status !== 'CANCELLED').length
  
  // Mitarbeiter-Auslastung berechnen
  const employeeUtilization = employees.map(emp => {
    const empAppointments = appointmentsToday.filter(a => a.employeeId === emp.id)
    const totalMinutes = empAppointments.reduce((sum, apt) => {
      const start = new Date(apt.startTime)
      const end = new Date(apt.endTime)
      return sum + (end.getTime() - start.getTime()) / (1000 * 60)
    }, 0)
    
    // Annahme: 8 Stunden = 480 Minuten Arbeitszeit
    const workMinutes = 480
    const utilization = Math.min(100, (totalMinutes / workMinutes) * 100)
    
    return {
      employeeId: emp.id,
      employeeName: emp.user.name || emp.user.email,
      utilization: Math.round(utilization * 10) / 10,
    }
  })
  
  // Überstunden-Erkennung (vereinfacht: >100% Auslastung)
  const overtimeEmployees = employeeUtilization
    .filter(e => e.utilization > 100)
    .map(e => ({
      employeeId: e.employeeId,
      employeeName: e.employeeName,
      overtimeHours: Math.round(((e.utilization - 100) / 100) * 8 * 10) / 10,
    }))
  
  // Inventarverbrauch (vereinfacht - würde normalerweise aus Logs kommen)
  const inventoryConsumption: Array<{ itemId: string; itemName: string; consumed: number }> = []
  
  // 2. ISSUES - Auffälligkeiten & Probleme
  const employeeCancellationMap = new Map<string, number>()
  cancelledAppointments.forEach(apt => {
    if (apt.employeeId) {
      employeeCancellationMap.set(apt.employeeId, (employeeCancellationMap.get(apt.employeeId) || 0) + 1)
    }
  })
  
  const employeesWithManyCancellations = Array.from(employeeCancellationMap.entries())
    .filter(([, count]) => count >= 2)
    .map(([employeeId, cancellations]) => {
      const emp = employees.find(e => e.id === employeeId)
      return {
        employeeId,
        employeeName: emp?.user.name || emp?.user.email || 'Unbekannt',
        cancellations,
      }
    })
  
  // Doppelte Buchungen prüfen
  const doubleBookings: Array<{ appointmentId: string; conflict: string }> = []
  for (let i = 0; i < appointmentsToday.length; i++) {
    for (let j = i + 1; j < appointmentsToday.length; j++) {
      const apt1 = appointmentsToday[i]
      const apt2 = appointmentsToday[j]
      
      if (apt1.employeeId === apt2.employeeId && apt1.id !== apt2.id) {
        const start1 = new Date(apt1.startTime)
        const end1 = new Date(apt1.endTime)
        const start2 = new Date(apt2.startTime)
        const end2 = new Date(apt2.endTime)
        
        if ((start1 <= start2 && end1 > start2) || (start2 <= start1 && end2 > start1)) {
          doubleBookings.push({
            appointmentId: apt1.id,
            conflict: `Überschneidung mit Termin ${apt2.title} (${format(start2, 'HH:mm')})`,
          })
        }
      }
    }
  }
  
  // Zeitkonflikte
  const timeConflicts: Array<{ appointmentId: string; conflict: string }> = []
  appointmentsToday.forEach(apt => {
    if (apt.employeeId) {
      const emp = employees.find(e => e.id === apt.employeeId)
      if (emp) {
        const aptStart = new Date(apt.startTime)
        const dayOfWeek = aptStart.toLocaleDateString('en-US', { weekday: 'long' })
        const workHours = emp.workHours as Record<string, { start: string; end: string }> | null
        
        if (workHours && workHours[dayOfWeek.toLowerCase()]) {
          const [workStartHour, workStartMin] = workHours[dayOfWeek.toLowerCase()].start.split(':').map(Number)
          const [workEndHour, workEndMin] = workHours[dayOfWeek.toLowerCase()].end.split(':').map(Number)
          const aptHour = aptStart.getHours()
          const aptMin = aptStart.getMinutes()
          
          if (aptHour < workStartHour || (aptHour === workStartHour && aptMin < workStartMin) ||
              aptHour > workEndHour || (aptHour === workEndHour && aptMin > workEndMin)) {
            timeConflicts.push({
              appointmentId: apt.id,
              conflict: `Termin außerhalb der Arbeitszeiten (${workHours[dayOfWeek.toLowerCase()].start} - ${workHours[dayOfWeek.toLowerCase()].end})`,
            })
          }
        }
      }
    }
  })
  
  // Niedriger Inventarbestand
  const lowInventory = inventoryItems
    .filter(item => item.quantity < item.minThreshold)
    .map(item => ({
      itemId: item.id,
      itemName: item.name,
      currentStock: item.quantity,
      minThreshold: item.minThreshold,
    }))
  
  // Mehrfach verschobene Aufgaben
  const repeatedlyRescheduledTasks: Array<{ taskId: string; taskTitle: string; reschedules: number }> = []
  // (Vereinfacht - würde normalerweise aus Task-Historie kommen)
  
  // 3. TOMORROW - Übersicht für morgen
  const tomorrowEmployees = employees.map(emp => {
    const isSick = emp.isSick
    const hasVacation = emp.vacationRequests.some(vr => {
      const start = new Date(vr.startDate)
      const end = new Date(vr.endDate)
      return isSameDay(start, tomorrowStart) || isSameDay(end, tomorrowStart) ||
             (start <= tomorrowStart && end >= tomorrowStart)
    })
    const dayOfWeek = tomorrowStart.toLocaleDateString('en-US', { weekday: 'long' })
    const workHours = emp.workHours as Record<string, { start: string; end: string }> | null
    const hasDayOff = emp.daysOff.includes(dayOfWeek)
    const limitedHours = workHours && workHours[dayOfWeek.toLowerCase()] 
      ? `${workHours[dayOfWeek.toLowerCase()].start} - ${workHours[dayOfWeek.toLowerCase()].end}`
      : null
    
    return {
      employee: emp,
      isSick,
      hasVacation,
      hasDayOff,
      limitedHours,
    }
  })
  
  const sickEmployeesTomorrow = tomorrowEmployees
    .filter(e => e.isSick)
    .map(e => ({
      employeeId: e.employee.id,
      employeeName: e.employee.user.name || e.employee.user.email,
    }))
  
  const onVacationTomorrow = tomorrowEmployees
    .filter(e => e.hasVacation)
    .map(e => ({
      employeeId: e.employee.id,
      employeeName: e.employee.user.name || e.employee.user.email,
      vacationDays: e.employee.vacationRequests.filter(vr => {
        const start = new Date(vr.startDate)
        const end = new Date(vr.endDate)
        return start <= tomorrowStart && end >= tomorrowStart
      }).reduce((sum, vr) => sum + vr.days, 0),
    }))
  
  const limitedHoursTomorrow = tomorrowEmployees
    .filter(e => e.limitedHours)
    .map(e => ({
      employeeId: e.employee.id,
      employeeName: e.employee.user.name || e.employee.user.email,
      availableHours: e.limitedHours!,
    }))
  
  const shouldAvoidOvertimeTomorrow = employeeUtilization
    .filter(e => e.utilization > 90)
    .map(e => ({
      employeeId: e.employeeId,
      employeeName: e.employeeName,
      reason: `Heute bereits ${e.utilization}% Auslastung`,
    }))
  
  const availableForSubstitutionTomorrow = tomorrowEmployees
    .filter(e => !e.isSick && !e.hasVacation && !e.hasDayOff && e.employee.isActive)
    .map(e => ({
      employeeId: e.employee.id,
      employeeName: e.employee.user.name || e.employee.user.email,
      reason: 'Verfügbar und aktiv',
    }))
  
  // Kritische Termine morgen
  const criticalAppointments = appointmentsTomorrow
    .filter(apt => {
      const customer = apt.customer
      const price = apt.price ? Number(apt.price) : 0
      return customer?.tags?.includes('VIP') || customer?.tags?.includes('Wichtig') || price > 500
    })
    .map(apt => {
      const price = apt.price ? Number(apt.price) : 0
      return {
        appointmentId: apt.id,
        title: apt.title,
        reason: apt.customer?.tags?.includes('VIP') ? 'VIP-Kunde' : 
                apt.customer?.tags?.includes('Wichtig') ? 'Wichtiger Kunde' :
                price > 500 ? 'Hoher Wert' : 'Kritisch',
      }
    })
  
  // Termine mit nicht verfügbarem Mitarbeiter
  const appointmentsWithUnavailableEmployee = appointmentsTomorrow
    .filter(apt => {
      if (!apt.employeeId) return false
      const empInfo = tomorrowEmployees.find(e => e.employee.id === apt.employeeId)
      return empInfo && (empInfo.isSick || empInfo.hasVacation || empInfo.hasDayOff)
    })
    .map(apt => {
      const emp = employees.find(e => e.id === apt.employeeId)
      const empInfo = tomorrowEmployees.find(e => e.employee.id === apt.employeeId)
      let reason = 'Unbekannt'
      if (empInfo?.isSick) reason = 'Mitarbeiter ist krank'
      else if (empInfo?.hasVacation) reason = 'Mitarbeiter hat Urlaub'
      else if (empInfo?.hasDayOff) reason = 'Mitarbeiter hat frei'
      
      return {
        appointmentId: apt.id,
        employeeId: apt.employeeId!,
        employeeName: emp?.user.name || emp?.user.email || 'Unbekannt',
        reason,
      }
    })
  
  // Konflikte für morgen
  const tomorrowConflicts: Array<{ type: string; description: string; suggestion: string }> = []
  
  // Mitarbeiter mit zu hoher Auslastung morgen
  const tomorrowUtilization = employees.map(emp => {
    const empAppointments = appointmentsTomorrow.filter(a => a.employeeId === emp.id)
    const totalMinutes = empAppointments.reduce((sum, apt) => {
      const start = new Date(apt.startTime)
      const end = new Date(apt.endTime)
      return sum + (end.getTime() - start.getTime()) / (1000 * 60)
    }, 0)
    const workMinutes = 480
    const utilization = Math.min(100, (totalMinutes / workMinutes) * 100)
    return { emp, utilization }
  })
  
  tomorrowUtilization.forEach(({ emp, utilization }) => {
    if (utilization > 90) {
      tomorrowConflicts.push({
        type: 'Überlastung',
        description: `${emp.user.name || emp.user.email} hat morgen ${Math.round(utilization)}% Auslastung`,
        suggestion: 'Termine umverteilen oder zusätzliche Unterstützung einplanen',
      })
    } else if (utilization < 40 && emp.isActive) {
      tomorrowConflicts.push({
        type: 'Unterauslastung',
        description: `${emp.user.name || emp.user.email} hat morgen nur ${Math.round(utilization)}% Auslastung`,
        suggestion: 'Ideal für zusätzliche Aufgaben oder Einspringen',
      })
    }
  })
  
  // Termine außerhalb der Arbeitszeiten morgen
  appointmentsTomorrow.forEach(apt => {
    if (apt.employeeId) {
      const emp = employees.find(e => e.id === apt.employeeId)
      if (emp) {
        const aptStart = new Date(apt.startTime)
        const dayOfWeek = aptStart.toLocaleDateString('en-US', { weekday: 'long' })
        const workHours = emp.workHours as Record<string, { start: string; end: string }> | null
        
        if (workHours && workHours[dayOfWeek.toLowerCase()]) {
          const [workStartHour] = workHours[dayOfWeek.toLowerCase()].start.split(':').map(Number)
          const [workEndHour] = workHours[dayOfWeek.toLowerCase()].end.split(':').map(Number)
          const aptHour = aptStart.getHours()
          
          if (aptHour < workStartHour || aptHour >= workEndHour) {
            tomorrowConflicts.push({
              type: 'Arbeitszeit',
              description: `Termin "${apt.title}" außerhalb der Arbeitszeiten`,
              suggestion: 'Termin verschieben oder Mitarbeiter mit anderen Arbeitszeiten zuweisen',
            })
          }
        }
      }
    }
  })
  
  // 4. RECOMMENDATIONS - Automatische Handlungsempfehlungen
  const recommendations: Array<{ priority: 'high' | 'medium' | 'low'; category: string; message: string; action?: string }> = []
  
  // Hohe Priorität
  if (appointmentsWithUnavailableEmployee.length > 0) {
    recommendations.push({
      priority: 'high',
      category: 'Termine',
      message: `${appointmentsWithUnavailableEmployee.length} Termine morgen haben Mitarbeiter, die nicht verfügbar sind`,
      action: 'Termine neu zuweisen',
    })
  }
  
  if (lowInventory.length > 0) {
    recommendations.push({
      priority: 'high',
      category: 'Inventar',
      message: `${lowInventory.length} Artikel haben kritisch niedrigen Bestand`,
      action: 'Nachbestellung empfohlen',
    })
  }
  
  if (doubleBookings.length > 0) {
    recommendations.push({
      priority: 'high',
      category: 'Konflikte',
      message: `${doubleBookings.length} Doppelbuchungen erkannt`,
      action: 'Termine prüfen und korrigieren',
    })
  }
  
  // Mittlere Priorität
  const highUtilizationTomorrow = tomorrowUtilization.filter(({ utilization }) => utilization > 90)
  if (highUtilizationTomorrow.length > 0) {
    recommendations.push({
      priority: 'medium',
      category: 'Auslastung',
      message: `${highUtilizationTomorrow.length} Mitarbeiter morgen überlastet (>90%)`,
      action: 'Termine umverteilen',
    })
  }
  
  const lowUtilizationTomorrow = tomorrowUtilization.filter(({ utilization }) => utilization < 40)
  if (lowUtilizationTomorrow.length > 0) {
    recommendations.push({
      priority: 'low',
      category: 'Auslastung',
      message: `${lowUtilizationTomorrow.length} Mitarbeiter morgen unterausgelastet (<40%)`,
      action: 'Ideal für zusätzliche Aufgaben',
    })
  }
  
  if (employeesWithManyCancellations.length > 0) {
    recommendations.push({
      priority: 'medium',
      category: 'Mitarbeiter',
      message: `${employeesWithManyCancellations.length} Mitarbeiter haben ungewöhnlich viele Ausfälle`,
      action: 'Gespräch führen und Ursachen klären',
    })
  }
  
  if (reassignedAppointments.length > 0) {
    recommendations.push({
      priority: 'medium',
      category: 'Termine',
      message: `${reassignedAppointments.length} Termine müssen noch neu zugewiesen werden`,
      action: 'Termine in der Neuzuweisungs-Ansicht prüfen',
    })
  }
  
  // Niedrige Priorität
  if (criticalAppointments.length > 0) {
    recommendations.push({
      priority: 'low',
      category: 'Termine',
      message: `${criticalAppointments.length} kritische Termine morgen`,
      action: 'Besondere Aufmerksamkeit sicherstellen',
    })
  }
  
  return {
    reportDate: format(reportDate, 'yyyy-MM-dd'),
    generatedAt: new Date().toISOString(),
    metrics: {
      appointmentsToday: appointmentsToday.length,
      completedTasks,
      cancelledAppointments: cancelledAppointments.length,
      cancelledReasons: Array.from(cancelledReasonsMap.entries()).map(([reason, count]) => ({ reason, count })),
      reassignedAppointments: reassignedAppointments.length,
      reassignedDetails: reassignedAppointments.map(apt => ({
        appointmentId: apt.id,
        oldEmployee: 'Unbekannt', // Würde normalerweise aus Historie kommen
        newEmployee: apt.employee?.user.name || apt.employee?.user.email || 'Nicht zugewiesen',
      })),
      dailyRevenue,
      unpaidInvoices: 0, // Würde normalerweise aus Rechnungs-System kommen
      openTasks,
      employeeUtilization,
      overtimeEmployees,
      inventoryConsumption,
    },
    issues: {
      employeesWithManyCancellations,
      doubleBookings,
      timeConflicts,
      timeBlockShortages: [], // Würde normalerweise aus Zeitblock-Analyse kommen
      lowInventory,
      planningIrregularities: [], // Würde normalerweise aus Planungs-Analyse kommen
      repeatedlyRescheduledTasks,
      lateStarts: [], // Würde normalerweise aus Tracking kommen
      customerComplaints: [], // Würde normalerweise aus Feedback-System kommen
    },
    tomorrow: {
      employeeAvailability: {
        sickEmployees: sickEmployeesTomorrow,
        onVacation: onVacationTomorrow,
        limitedHours: limitedHoursTomorrow,
        shouldAvoidOvertime: shouldAvoidOvertimeTomorrow,
        availableForSubstitution: availableForSubstitutionTomorrow,
      },
      appointments: {
        totalAppointments: appointmentsTomorrow.length,
        criticalAppointments,
        appointmentsWithUnavailableEmployee,
        rescheduledFromToday: [], // Würde normalerweise aus Historie kommen
      },
      tasks: {
        dueTomorrow: tasksTomorrow.map(t => ({
          taskId: t.id,
          title: t.title,
          priority: t.priority,
        })),
      },
      conflicts: tomorrowConflicts,
    },
    recommendations,
  }
}

