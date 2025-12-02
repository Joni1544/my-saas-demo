/**
 * Appointment Detail API Route
 * GET: Einzelnen Termin abrufen
 * PUT: Termin aktualisieren
 * DELETE: Termin löschen
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkEmployeeAvailability } from '@/lib/employee-availability'

// GET: Einzelnen Termin abrufen
export async function GET(
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

    const where: {
      id: string
      tenantId: string
      employeeId?: string
    } = {
      id: id,
      tenantId: session.user.tenantId,
    }

    // Mitarbeiter sieht nur eigene Termine
    if (session.user.role === 'MITARBEITER') {
      const employee = await prisma.employee.findUnique({
        where: { userId: session.user.id },
      })
      if (employee) {
        where.employeeId = employee.id
      } else {
        return NextResponse.json(
          { error: 'Termin nicht gefunden' },
          { status: 404 }
        )
      }
    }

    const appointment = await prisma.appointment.findFirst({
      where,
      include: {
        customer: true,
        employee: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!appointment) {
      return NextResponse.json(
        { error: 'Termin nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json({ appointment })
  } catch (error) {
    console.error('Fehler beim Abrufen des Termins:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen des Termins' },
      { status: 500 }
    )
  }
}

// PUT: Termin aktualisieren
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

    const body = await request.json()
    const { 
      title, 
      description, 
      notes,
      startTime, 
      endTime, 
      status, 
      customerId,
      price,
      color,
      employeeId: newEmployeeId,
      adminOverride
    } = body

    // Hole erstmal den Termin um ihn zu prüfen
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        id: id,
        tenantId: session.user.tenantId,
      },
    })

    if (!existingAppointment) {
      return NextResponse.json(
        { error: 'Termin nicht gefunden' },
        { status: 404 }
      )
    }

    const where: {
      id: string
      tenantId: string
      employeeId?: string
    } = {
      id: id,
      tenantId: session.user.tenantId,
    }

    // Mitarbeiter kann nur eigene Termine aktualisieren
    if (session.user.role === 'MITARBEITER') {
      const employee = await prisma.employee.findUnique({
        where: { userId: session.user.id },
      })
      if (employee) {
        where.employeeId = employee.id
      } else {
        return NextResponse.json(
          { error: 'Termin nicht gefunden' },
          { status: 404 }
        )
      }
    }

    // Status-Farbe automatisch setzen wenn Status geändert wird
    let finalColor = color
    if (!finalColor && status) {
      const statusColors: Record<string, string> = {
        OPEN: '#3B82F6',        // Blau
        ACCEPTED: '#10B981',    // Grün
        CANCELLED: '#EF4444',   // Rot
        RESCHEDULED: '#F59E0B', // Orange
        COMPLETED: '#6B7280',   // Grau
      }
      finalColor = statusColors[status] || null
    }

    // Prüfe Verfügbarkeit wenn Mitarbeiter geändert wird oder Zeit geändert wird
    let finalEmployeeId = where.employeeId || existingAppointment.employeeId
    if (newEmployeeId && session.user.role === 'ADMIN') {
      finalEmployeeId = newEmployeeId
    }

    if (finalEmployeeId && (startTime || endTime || newEmployeeId) && !adminOverride) {
      const checkStartTime = startTime ? new Date(startTime) : new Date(existingAppointment.startTime)
      const checkEndTime = endTime ? new Date(endTime) : new Date(existingAppointment.endTime)

      const availability = await checkEmployeeAvailability(
        finalEmployeeId,
        checkStartTime,
        checkEndTime
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

    // Mitarbeiter kann Preise NUR bei eigenen Terminen ändern
    const finalPrice = price
    if (session.user.role === 'MITARBEITER' && price !== undefined) {
      if (!existingAppointment || existingAppointment.employeeId !== where.employeeId) {
        return NextResponse.json(
          { error: 'Nicht autorisiert. Sie können nur Preise bei eigenen Terminen ändern.' },
          { status: 403 }
        )
      }
    }

    const appointment = await prisma.appointment.updateMany({
      where,
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(notes !== undefined && { notes }),
        ...(startTime && { startTime: new Date(startTime) }),
        ...(endTime && { endTime: new Date(endTime) }),
        ...(status && { status }),
        ...(customerId !== undefined && { customerId }),
        ...(finalEmployeeId && { employeeId: finalEmployeeId }),
        ...(finalPrice !== undefined && { price: finalPrice ? parseFloat(finalPrice.toString()) : 0 }),
        ...(finalColor !== undefined && { color: finalColor }),
      },
    })

    if (appointment.count === 0) {
      return NextResponse.json(
        { error: 'Termin nicht gefunden' },
        { status: 404 }
      )
    }

    const updatedAppointment = await prisma.appointment.findUnique({
      where: { id: id },
      include: {
        customer: true,
        employee: {
          include: {
            user: true,
          },
        },
      },
    })

    return NextResponse.json({ appointment: updatedAppointment })
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Termins:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des Termins' },
      { status: 500 }
    )
  }
}

// DELETE: Termin löschen
export async function DELETE(
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

    const where: {
      id: string
      tenantId: string
      employeeId?: string
    } = {
      id: id,
      tenantId: session.user.tenantId,
    }

    // Mitarbeiter kann nur eigene Termine löschen
    if (session.user.role === 'MITARBEITER') {
      const employee = await prisma.employee.findUnique({
        where: { userId: session.user.id },
      })
      if (employee) {
        where.employeeId = employee.id
      } else {
        return NextResponse.json(
          { error: 'Termin nicht gefunden' },
          { status: 404 }
        )
      }
    }

    const appointment = await prisma.appointment.deleteMany({
      where,
    })

    if (appointment.count === 0) {
      return NextResponse.json(
        { error: 'Termin nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Termin erfolgreich gelöscht' })
  } catch (error) {
    console.error('Fehler beim Löschen des Termins:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Termins' },
      { status: 500 }
    )
  }
}

