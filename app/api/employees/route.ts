/**
 * Employees API Route
 * GET: Liste aller Mitarbeiter
 * POST: Neuen Mitarbeiter erstellen
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Alle Mitarbeiter abrufen
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    // Nur Admin kann alle Mitarbeiter sehen
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 403 }
      )
    }

    const employees = await prisma.employee.findMany({
      where: {
        tenantId: session.user.tenantId,
        // Zeige alle Mitarbeiter, auch inaktive
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        vacationRequests: {
          where: {
            status: 'APPROVED',
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    console.log(`[API] Gefundene Mitarbeiter für Tenant ${session.user.tenantId}:`, employees.length)

    // Füge Verfügbarkeits-Info hinzu
    const employeesWithAvailability = employees.map((employee) => ({
      ...employee,
      isAvailable: !employee.isSick && employee.isActive,
      hasApprovedVacation: employee.vacationRequests.length > 0,
    }))

    return NextResponse.json({ employees: employeesWithAvailability })
  } catch (error) {
    console.error('Fehler beim Abrufen der Mitarbeiter:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Mitarbeiter' },
      { status: 500 }
    )
  }
}

// POST: Neuen Mitarbeiter erstellen
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId, position, color, workHours, isActive } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId ist erforderlich' },
        { status: 400 }
      )
    }

    // Prüfe ob User existiert und zum gleichen Tenant gehört
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user || user.tenantId !== session.user.tenantId) {
      return NextResponse.json(
        { error: 'User nicht gefunden oder gehört nicht zu diesem Tenant' },
        { status: 404 }
      )
    }

    // Prüfe ob Employee bereits existiert
    const existingEmployee = await prisma.employee.findUnique({
      where: { userId },
    })

    if (existingEmployee) {
      return NextResponse.json(
        { error: 'Mitarbeiter existiert bereits' },
        { status: 400 }
      )
    }

    const employee = await prisma.employee.create({
      data: {
        userId,
        tenantId: session.user.tenantId,
        position: position || null,
        color: color || null,
        workHours: workHours || null,
        isActive: isActive !== undefined ? isActive : true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    })

    // Füge neuen Mitarbeiter automatisch zum Teamchat hinzu
    const teamchat = await prisma.chatChannel.findFirst({
      where: {
        tenantId: session.user.tenantId,
        isSystem: true,
        name: 'Teamchat',
      },
    })

    if (teamchat) {
      await prisma.channelMember.create({
        data: {
          channelId: teamchat.id,
          userId: employee.userId,
        },
      })
    }

    return NextResponse.json({ employee }, { status: 201 })
  } catch (error) {
    console.error('Fehler beim Erstellen des Mitarbeiters:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Mitarbeiters' },
      { status: 500 }
    )
  }
}

