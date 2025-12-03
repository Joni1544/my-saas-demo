/**
 * Employee Working Times API Route
 * GET: Arbeitszeiten abrufen
 * PUT: Arbeitszeiten bearbeiten (nur Admin)
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Arbeitszeiten abrufen
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')

    let targetEmployeeId: string | null = null

    if (employeeId && session.user.role === 'ADMIN') {
      targetEmployeeId = employeeId
    } else {
      // Eigenes Profil
      const ownEmployee = await prisma.employee.findFirst({
        where: {
          userId: session.user.id,
          tenantId: session.user.tenantId,
        },
      })

      if (!ownEmployee) {
        return NextResponse.json(
          { error: 'Mitarbeiter-Profil nicht gefunden' },
          { status: 404 }
        )
      }

      targetEmployeeId = ownEmployee.id
    }

    const employee = await prisma.employee.findUnique({
      where: { id: targetEmployeeId },
      select: {
        id: true,
        workHours: true,
        workStart: true, // Legacy support
        workEnd: true,
        breakStart: true,
        breakEnd: true,
        daysOff: true,
      },
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Mitarbeiter nicht gefunden' },
        { status: 404 }
      )
    }

    // Wenn workHours existiert, verwende es, sonst migriere von Legacy-Feldern
    let workSchedule = employee.workHours as Record<string, {
      active: boolean
      start: string
      end: string
      breakStart: string
      breakEnd: string
    }> | null
    
    if (!workSchedule && employee.workStart && employee.workEnd) {
      // Migriere von Legacy-Feldern zu workSchedule
      const defaultSchedule: Record<string, {
        active: boolean
        start: string
        end: string
        breakStart: string
        breakEnd: string
      }> = {}
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      days.forEach((day) => {
        const isDayOff = employee.daysOff?.includes(day.charAt(0).toUpperCase() + day.slice(1)) || false
        defaultSchedule[day] = {
          active: !isDayOff,
          start: employee.workStart || '09:00',
          end: employee.workEnd || '18:00',
          breakStart: employee.breakStart || '12:00',
          breakEnd: employee.breakEnd || '12:30',
        }
      })
      workSchedule = defaultSchedule
    }

    return NextResponse.json({ workSchedule })
  } catch (error) {
    console.error('Fehler beim Abrufen der Arbeitszeiten:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Arbeitszeiten' },
      { status: 500 }
    )
  }
}

// PUT: Arbeitszeiten bearbeiten (nur Admin)
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    // Nur Admin kann Arbeitszeiten ändern
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert. Nur Administratoren können Arbeitszeiten ändern.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { employeeId, workSchedule } = body

    if (!employeeId) {
      return NextResponse.json(
        { error: 'employeeId ist erforderlich' },
        { status: 400 }
      )
    }

    if (!workSchedule || typeof workSchedule !== 'object') {
      return NextResponse.json(
        { error: 'workSchedule ist erforderlich und muss ein Objekt sein' },
        { status: 400 }
      )
    }

    // Validierung: Prüfe jede Tages-Struktur
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    for (const day of days) {
      const daySchedule = workSchedule[day]
      if (daySchedule && daySchedule.active) {
        // Prüfe Start < Ende
        if (daySchedule.start >= daySchedule.end) {
          return NextResponse.json(
            { error: `${day}: Arbeitsbeginn muss vor Arbeitsende liegen` },
            { status: 400 }
          )
        }

        // Prüfe Pause innerhalb Arbeitszeit
        if (daySchedule.breakStart && daySchedule.breakEnd) {
          if (daySchedule.breakStart < daySchedule.start || daySchedule.breakEnd > daySchedule.end) {
            return NextResponse.json(
              { error: `${day}: Pausenzeit muss innerhalb der Arbeitszeit liegen` },
              { status: 400 }
            )
          }
          if (daySchedule.breakStart >= daySchedule.breakEnd) {
            return NextResponse.json(
              { error: `${day}: Pausenbeginn muss vor Pausenende liegen` },
              { status: 400 }
            )
          }
        }
      }
    }

    // Prüfe ob Mitarbeiter existiert und zum Tenant gehört
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        tenantId: session.user.tenantId,
      },
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Mitarbeiter nicht gefunden' },
        { status: 404 }
      )
    }

    // Aktualisiere Arbeitszeiten (workHours JSON)
    const updatedEmployee = await prisma.employee.update({
      where: { id: employeeId },
      data: {
        workHours: workSchedule,
      },
      select: {
        id: true,
        workHours: true,
      },
    })

    return NextResponse.json({ workSchedule: updatedEmployee.workHours })
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Arbeitszeiten:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren der Arbeitszeiten' },
      { status: 500 }
    )
  }
}

