/**
 * Chat Users API
 * GET: Alle Mitarbeiter des Tenants für Chat
 */
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    if (!session || !session.user?.tenantId) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    // Hole alle aktiven Mitarbeiter des Tenants
    const employees = await prisma.employee.findMany({
      where: {
        tenantId: session.user.tenantId,
        isActive: true,
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
      orderBy: {
        user: {
          name: 'asc',
        },
      },
    })

    const users = employees.map((emp) => ({
      id: emp.user.id,
      name: emp.user.name,
      email: emp.user.email,
      role: emp.user.role,
    }))

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Fehler beim Laden der Mitarbeiter:', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Mitarbeiter' }, { status: 500 })
  }
}

