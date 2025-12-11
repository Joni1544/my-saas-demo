/**
 * Appointments API Route
 * GET: Liste aller Termine (gefiltert nach Tenant und Rolle)
 * POST: Neuen Termin erstellen
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkEmployeeAvailability } from '@/lib/employee-availability'

// GET: Alle Termine abrufen
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
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const customerId = searchParams.get('customerId')
    const status = searchParams.get('status')
    const employeeIdFilter = searchParams.get('employeeId')

    const where: {
      tenantId: string
      startTime?: { gte: Date; lte: Date }
      employeeId?: string
      customerId?: string
      status?: 'OPEN' | 'ACCEPTED' | 'CANCELLED' | 'RESCHEDULED' | 'COMPLETED' | 'NEEDS_REASSIGNMENT'
    } = {
      tenantId: session.user.tenantId,
    }

    // Datumsfilter
    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    // Kundenfilter
    if (customerId) {
      where.customerId = customerId
    }

    // Statusfilter
    if (status && ['OPEN', 'ACCEPTED', 'CANCELLED', 'RESCHEDULED', 'COMPLETED', 'NEEDS_REASSIGNMENT'].includes(status)) {
      where.status = status as 'OPEN' | 'ACCEPTED' | 'CANCELLED' | 'RESCHEDULED' | 'COMPLETED' | 'NEEDS_REASSIGNMENT'
    }

    // Mitarbeiterfilter (für Admin)
    if (employeeIdFilter && session.user.role === 'ADMIN') {
      where.employeeId = employeeIdFilter
    }

    // Mitarbeiter sieht nur eigene Termine
    if (session.user.role === 'MITARBEITER') {
      const employee = await prisma.employee.findUnique({
        where: { userId: session.user.id },
      })

      if (employee) {
        where.employeeId = employee.id
      } else {
        return NextResponse.json({ appointments: [] })
      }
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        customer: true,
        employee: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    })

    return NextResponse.json({ appointments })
  } catch (error) {
    console.error('Fehler beim Abrufen der Termine:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Termine' },
      { status: 500 }
    )
  }
}

// POST: Neuen Termin erstellen
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
    const { 
      title, 
      description, 
      notes,
      startTime, 
      endTime, 
      customerId, 
      employeeId,
      status,
      price,
      color,
      adminOverride
    } = body

    if (!title || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Titel, Start- und Endzeit sind erforderlich' },
        { status: 400 }
      )
    }

    // Mitarbeiter kann nur eigene Termine erstellen
    let finalEmployeeId = employeeId
    if (session.user.role === 'MITARBEITER') {
      const employee = await prisma.employee.findUnique({
        where: { userId: session.user.id },
      })
      if (employee) {
        finalEmployeeId = employee.id
      }
    }

    // Prüfe Verfügbarkeit des Mitarbeiters (außer wenn Admin Override)
    if (finalEmployeeId && !adminOverride) {
      const availability = await checkEmployeeAvailability(
        finalEmployeeId,
        new Date(startTime),
        new Date(endTime)
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

    // Status-Farbe automatisch setzen wenn nicht angegeben
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

    const appointment = await prisma.appointment.create({
      data: {
        title,
        description: description || null,
        notes: notes || null,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: status || 'OPEN',
        price: price ? parseFloat(price.toString()) : 0,
        color: finalColor || null,
        customerId: customerId || null,
        employeeId: finalEmployeeId || null,
        tenantId: session.user.tenantId,
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

    // Event emitieren
    try {
      const { eventBus } = await import('@/events/EventBus')
      eventBus.emit('appointment.created', {
        tenantId: session.user.tenantId,
        appointmentId: appointment.id,
        customerId: appointment.customerId || undefined,
        employeeId: appointment.employeeId || undefined,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        timestamp: new Date(),
        userId: session.user.id,
      })
    } catch (error) {
      console.error('[Appointments API] Failed to emit appointment.created event:', error)
    }

    return NextResponse.json({ appointment }, { status: 201 })
  } catch (error) {
    console.error('Fehler beim Erstellen des Termins:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Termins' },
      { status: 500 }
    )
  }
}

