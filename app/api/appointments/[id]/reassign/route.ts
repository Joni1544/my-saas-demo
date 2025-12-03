/**
 * Appointment Reassignment API Route
 * PUT: Termin neu zuweisen (nur Admin)
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkEmployeeAvailability } from '@/lib/employee-availability'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    // Nur Admin kann Termine neu zuweisen
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert. Nur Administratoren können Termine neu zuweisen.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { employeeId, adminOverride } = body

    if (!employeeId) {
      return NextResponse.json(
        { error: 'employeeId ist erforderlich' },
        { status: 400 }
      )
    }

    // Hole Termin - prüfe auch Tenant und Status
    const appointment = await prisma.appointment.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
        status: 'NEEDS_REASSIGNMENT', // Nur Termine die neu zugewiesen werden müssen
      },
      include: {
        employee: true,
      },
    })

    if (!appointment) {
      return NextResponse.json(
        { error: 'Termin nicht gefunden oder nicht im Status NEEDS_REASSIGNMENT' },
        { status: 404 }
      )
    }

    // Prüfe Verfügbarkeit (außer wenn Admin Override)
    if (!adminOverride) {
      const availability = await checkEmployeeAvailability(
        employeeId,
        new Date(appointment.startTime),
        new Date(appointment.endTime)
      )

      if (!availability.isAvailable) {
        return NextResponse.json(
          {
            error: `Mitarbeiter ist nicht verfügbar: ${availability.reason}`,
            availability,
          },
          { status: 400 }
        )
      }
    }

    // Prüfe ob neuer Mitarbeiter existiert und zum Tenant gehört
    const newEmployee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        tenantId: session.user.tenantId,
        isActive: true, // Nur aktive Mitarbeiter
      },
    })

    if (!newEmployee) {
      return NextResponse.json(
        { error: 'Neuer Mitarbeiter nicht gefunden oder nicht aktiv' },
        { status: 404 }
      )
    }

    // Weise Termin neu zu
    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        employeeId,
        status: 'ACCEPTED', // Setze zurück auf ACCEPTED nach Neuzuweisung
      },
      include: {
        customer: true,
        employee: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ appointment: updatedAppointment })
  } catch (error) {
    console.error('Fehler beim Neuzuweisen des Termins:', error)
    return NextResponse.json(
      { error: 'Fehler beim Neuzuweisen des Termins' },
      { status: 500 }
    )
  }
}

