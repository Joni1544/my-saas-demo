/**
 * Vacation Requests List API Route
 * GET: Liste aller Urlaubsanträge (Admin: alle, Mitarbeiter: eigene)
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

    if (session.user.role === 'ADMIN') {
      // Admin sieht alle Urlaubsanträge des Tenants
      const requests = await prisma.vacationRequest.findMany({
        where: {
          employee: {
            tenantId: session.user.tenantId,
          },
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
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json({ requests })
    } else {
      // Mitarbeiter sieht nur eigene Anträge
      const employee = await prisma.employee.findFirst({
        where: {
          userId: session.user.id,
          tenantId: session.user.tenantId,
        },
      })

      if (!employee) {
        return NextResponse.json({ requests: [] })
      }

      const requests = await prisma.vacationRequest.findMany({
        where: {
          employeeId: employee.id,
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
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json({ requests })
    }
  } catch (error) {
    console.error('Fehler beim Abrufen der Urlaubsanträge:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Urlaubsanträge' },
      { status: 500 }
    )
  }
}

