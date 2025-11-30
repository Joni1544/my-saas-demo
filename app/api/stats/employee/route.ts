/**
 * Employee Statistics API Route
 * GET: Statistiken für Mitarbeiter (nur eigene Daten)
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    // Finde Employee-Eintrag
    const employee = await prisma.employee.findUnique({
      where: { userId: session.user.id },
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Mitarbeiterprofil nicht gefunden' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : new Date().getMonth()
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear()

    // Datumsbereich für den Monat
    const dateStart = new Date(year, month, 1)
    const dateEnd = new Date(year, month + 1, 0, 23, 59, 59)

    // Eigene Termine
    const appointments = await prisma.appointment.findMany({
      where: {
        tenantId: session.user.tenantId,
        employeeId: employee.id,
        startTime: {
          gte: dateStart,
          lte: dateEnd,
        },
      },
      include: {
        customer: true,
      },
    })

    // Abgeschlossene Termine (Umsatz)
    const completedAppointments = appointments.filter(apt => apt.status === 'COMPLETED')
    const totalRevenue = completedAppointments.reduce(
      (sum, apt) => sum + (apt.price?.toNumber() || 0),
      0
    )

    // Eigene Aufgaben
    const tasks = await prisma.task.findMany({
      where: {
        tenantId: session.user.tenantId,
        assignedTo: session.user.id,
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
      ],
    })

    return NextResponse.json({
      appointments: appointments.length,
      completedAppointments: completedAppointments.length,
      totalRevenue,
      tasks: tasks.length,
      upcomingAppointments: appointments.filter(apt => new Date(apt.startTime) >= new Date()).length,
    })
  } catch (error) {
    console.error('Fehler beim Abrufen der Mitarbeiter-Statistiken:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Statistiken' },
      { status: 500 }
    )
  }
}

