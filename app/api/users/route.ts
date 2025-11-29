/**
 * Users API Route
 * GET: Liste aller Users des Tenants (für Mitarbeiter-Erstellung)
 */
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    // Nur Admin kann Users sehen
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 403 }
      )
    }

    const users = await prisma.user.findMany({
      where: {
        tenantId: session.user.tenantId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Filtere Users die bereits Mitarbeiter sind
    const employees = await prisma.employee.findMany({
      where: {
        tenantId: session.user.tenantId,
      },
      select: {
        userId: true,
      },
    })

    const employeeUserIds = new Set(employees.map((e) => e.userId))
    const availableUsers = users.filter((u) => !employeeUserIds.has(u.id))

    return NextResponse.json({ users: availableUsers })
  } catch (error) {
    console.error('Fehler beim Abrufen der Users:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Users' },
      { status: 500 }
    )
  }
}

