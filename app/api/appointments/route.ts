/**
 * Appointments API Route
 * GET: Liste aller Termine (gefiltert nach Tenant und Rolle)
 * POST: Neuen Termin erstellen
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    const where: {
      tenantId: string
      startTime?: { gte: Date; lte: Date }
      employeeId?: string
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
    const { title, description, startTime, endTime, customerId, employeeId } =
      body

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

    const appointment = await prisma.appointment.create({
      data: {
        title,
        description: description || null,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
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

    return NextResponse.json({ appointment }, { status: 201 })
  } catch (error) {
    console.error('Fehler beim Erstellen des Termins:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Termins' },
      { status: 500 }
    )
  }
}

