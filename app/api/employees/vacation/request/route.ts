/**
 * Vacation Request API Route
 * POST: Urlaubsantrag stellen
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { differenceInDays } from 'date-fns'

// POST: Urlaubsantrag stellen
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
    const { startDate, endDate, leaveReason } = body

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start- und Enddatum sind erforderlich' },
        { status: 400 }
      )
    }

    if (!leaveReason) {
      return NextResponse.json(
        { error: 'Urlaubsart ist erforderlich' },
        { status: 400 }
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (start >= end) {
      return NextResponse.json(
        { error: 'Enddatum muss nach Startdatum liegen' },
        { status: 400 }
      )
    }

    // Hole Mitarbeiter-Profil
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

    // Berechne Anzahl der Urlaubstage
    const days = differenceInDays(end, start) + 1

    // Prüfe verfügbare Urlaubstage
    const totalDays = employee.vacationDaysTotal || 25
    const usedDays = employee.vacationDaysUsed || 0
    const remainingDays = totalDays - usedDays

    if (days > remainingDays) {
      return NextResponse.json(
        { error: `Nicht genügend Urlaubstage verfügbar. Verfügbar: ${remainingDays}, Angefragt: ${days}` },
        { status: 400 }
      )
    }

    // Prüfe auf Überschneidungen mit bestehenden genehmigten Urlauben
    const overlappingRequests = await prisma.vacationRequest.findMany({
      where: {
        employeeId: employee.id,
        status: 'APPROVED',
        OR: [
          {
            startDate: { lte: end },
            endDate: { gte: start },
          },
        ],
      },
    })

    if (overlappingRequests.length > 0) {
      return NextResponse.json(
        { error: 'Überschneidung mit bereits genehmigtem Urlaub' },
        { status: 400 }
      )
    }

    // Erstelle Urlaubsantrag
    const vacationRequest = await prisma.vacationRequest.create({
      data: {
        employeeId: employee.id,
        startDate: start,
        endDate: end,
        days,
        leaveReason: leaveReason || 'Urlaub',
        status: 'PENDING',
      },
      include: {
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

    return NextResponse.json({ vacationRequest }, { status: 201 })
  } catch (error) {
    console.error('Fehler beim Erstellen des Urlaubsantrags:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Urlaubsantrags' },
      { status: 500 }
    )
  }
}

