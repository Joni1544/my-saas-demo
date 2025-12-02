/**
 * Vacation Approval API Route
 * POST: Urlaubsantrag genehmigen/ablehnen (nur Admin)
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST: Urlaubsantrag genehmigen/ablehnen
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    // Nur Admin kann Urlaub genehmigen
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert. Nur Administratoren können Urlaub genehmigen.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { requestId, action, reason } = body // action: 'approve' | 'deny'

    if (!requestId || !action) {
      return NextResponse.json(
        { error: 'requestId und action sind erforderlich' },
        { status: 400 }
      )
    }

    if (action !== 'approve' && action !== 'deny') {
      return NextResponse.json(
        { error: 'action muss "approve" oder "deny" sein' },
        { status: 400 }
      )
    }

    // Hole Urlaubsantrag
    const vacationRequest = await prisma.vacationRequest.findUnique({
      where: { id: requestId },
      include: {
        employee: {
          include: {
            user: {
              select: {
                id: true,
                tenantId: true,
              },
            },
          },
        },
      },
    })

    if (!vacationRequest) {
      return NextResponse.json(
        { error: 'Urlaubsantrag nicht gefunden' },
        { status: 404 }
      )
    }

    // Prüfe Tenant-Zugehörigkeit
    if (vacationRequest.employee.user.tenantId !== session.user.tenantId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 403 }
      )
    }

    // Aktualisiere Status
    const status = action === 'approve' ? 'APPROVED' : 'DENIED'

    const updatedRequest = await prisma.vacationRequest.update({
      where: { id: requestId },
      data: {
        status,
        ...(reason && { reason }),
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

    // Wenn genehmigt: Aktualisiere vacationDaysUsed und setze nextAvailableDate
    if (action === 'approve') {
      const updatedEmployee = await prisma.employee.update({
        where: { id: vacationRequest.employeeId },
        data: {
          vacationDaysUsed: {
            increment: vacationRequest.days,
          },
          nextAvailableDate: new Date(vacationRequest.endDate),
        },
      })

      // Prüfe und setze Termine auf NEEDS_REASSIGNMENT die im Urlaubszeitraum liegen
      const appointments = await prisma.appointment.findMany({
        where: {
          employeeId: vacationRequest.employeeId,
          startTime: {
            gte: new Date(vacationRequest.startDate),
            lte: new Date(vacationRequest.endDate),
          },
          status: {
            not: 'NEEDS_REASSIGNMENT',
          },
        },
      })

      for (const appointment of appointments) {
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: {
            status: 'NEEDS_REASSIGNMENT',
          },
        })
      }
    }

    return NextResponse.json({ vacationRequest: updatedRequest })
  } catch (error) {
    console.error('Fehler beim Genehmigen/Ablehnen des Urlaubs:', error)
    return NextResponse.json(
      { error: 'Fehler beim Genehmigen/Ablehnen des Urlaubs' },
      { status: 500 }
    )
  }
}

