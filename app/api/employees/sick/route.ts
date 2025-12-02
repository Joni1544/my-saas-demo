/**
 * Employee Sick Status API Route
 * POST: Krankmeldung erstellen/bestätigen
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkAndReassignAppointmentsForSickEmployee } from '@/lib/employee-availability'

// POST: Krankmeldung erstellen oder bestätigen
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action, employeeId, confirm } = body
    // action: 'report' (Mitarbeiter meldet sich krank) | 'confirm' (Admin bestätigt) | 'recover' (Admin markiert als gesund)

    if (action === 'report') {
      // Mitarbeiter meldet sich krank
      const employee = await prisma.employee.findFirst({
        where: {
          userId: session.user.id,
          tenantId: session.user.tenantId,
        },
      })

      if (!employee) {
        return NextResponse.json(
          { error: 'Mitarbeiter-Profil nicht gefunden' },
          { status: 404 }
        )
      }

      // Setze isSick auf true und erhöhe sickDays
      const updatedEmployee = await prisma.employee.update({
        where: { id: employee.id },
        data: {
          isSick: true,
          sickDays: {
            increment: 1,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      // Prüfe und setze Termine auf NEEDS_REASSIGNMENT
      const reassignedCount = await checkAndReassignAppointmentsForSickEmployee(employee.id)

      return NextResponse.json({
        employee: updatedEmployee,
        reassignedAppointments: reassignedCount,
      })
    } else if (action === 'confirm' || action === 'recover') {
      // Admin bestätigt Krankmeldung oder markiert als gesund
      if (session.user.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Nicht autorisiert. Nur Administratoren können Krankmeldungen verwalten.' },
          { status: 403 }
        )
      }

      if (!employeeId) {
        return NextResponse.json(
          { error: 'employeeId ist erforderlich' },
          { status: 400 }
        )
      }

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

      if (action === 'confirm') {
        // Bestätige Krankmeldung und erhöhe sickDays
        const updatedEmployee = await prisma.employee.update({
          where: { id: employeeId },
          data: {
            isSick: true,
            sickDays: {
              increment: 1,
            },
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        })

        return NextResponse.json({ employee: updatedEmployee })
      } else {
        // Markiere als gesund
        const updatedEmployee = await prisma.employee.update({
          where: { id: employeeId },
          data: {
            isSick: false,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        })

        return NextResponse.json({ employee: updatedEmployee })
      }
    } else {
      return NextResponse.json(
        { error: 'Ungültige Aktion' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Fehler bei Krankmeldung:', error)
    return NextResponse.json(
      { error: 'Fehler bei Krankmeldung' },
      { status: 500 }
    )
  }
}

// GET: Liste aller Krankmeldungen (Admin) oder eigener Status (Mitarbeiter)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    if (session.user.role === 'ADMIN') {
      // Admin sieht alle kranken Mitarbeiter
      const sickEmployees = await prisma.employee.findMany({
        where: {
          tenantId: session.user.tenantId,
          isSick: true,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      return NextResponse.json({ sickEmployees })
    } else {
      // Mitarbeiter sieht eigenen Status
      const employee = await prisma.employee.findFirst({
        where: {
          userId: session.user.id,
          tenantId: session.user.tenantId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      if (!employee) {
        return NextResponse.json(
          { error: 'Mitarbeiter-Profil nicht gefunden' },
          { status: 404 }
        )
      }

      return NextResponse.json({ employee })
    }
  } catch (error) {
    console.error('Fehler beim Abrufen der Krankmeldungen:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Krankmeldungen' },
      { status: 500 }
    )
  }
}

