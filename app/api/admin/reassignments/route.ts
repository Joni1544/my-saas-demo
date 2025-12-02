/**
 * Admin Reassignments API Route
 * GET: Alle Termine die neu zugewiesen werden müssen
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

    // Nur Admin kann Reassignments sehen
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert. Nur Administratoren können Reassignments einsehen.' },
        { status: 403 }
      )
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        tenantId: session.user.tenantId,
        status: 'NEEDS_REASSIGNMENT',
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
      orderBy: { startTime: 'asc' },
    })

    return NextResponse.json({ appointments, count: appointments.length })
  } catch (error) {
    console.error('Fehler beim Abrufen der Reassignments:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Reassignments' },
      { status: 500 }
    )
  }
}

