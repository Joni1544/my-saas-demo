/**
 * Employee Availability Calendar API Route
 * GET: Verfügbarkeits-Info für Kalender (Urlaub, Krankheit pro Mitarbeiter)
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

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate und endDate sind erforderlich' },
        { status: 400 }
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    // Hole alle Mitarbeiter mit Urlaub und Krankheit
    const employees = await prisma.employee.findMany({
      where: {
        tenantId: session.user.tenantId,
      },
      include: {
        vacationRequests: {
          where: {
            status: 'APPROVED',
          },
        },
      },
    })

    const availabilityMap: Record<string, Array<{ date: string; type: 'sick' | 'vacation' }>> = {}

    for (const employee of employees) {
      const employeeAvailability: Array<{ date: string; type: 'sick' | 'vacation' }> = []

      // Krankheit
      if (employee.isSick) {
        const currentDate = new Date(start)
        while (currentDate <= end) {
          employeeAvailability.push({
            date: formatDate(currentDate),
            type: 'sick',
          })
          currentDate.setDate(currentDate.getDate() + 1)
        }
      }

      // Urlaub
      for (const vacation of employee.vacationRequests) {
        const vacationStart = new Date(vacation.startDate)
        const vacationEnd = new Date(vacation.endDate)
        const currentDate = new Date(vacationStart)

        while (currentDate <= vacationEnd && currentDate <= end) {
          if (currentDate >= start) {
            employeeAvailability.push({
              date: formatDate(currentDate),
              type: 'vacation',
            })
          }
          currentDate.setDate(currentDate.getDate() + 1)
        }
      }

      if (employeeAvailability.length > 0) {
        availabilityMap[employee.id] = employeeAvailability
      }
    }

    return NextResponse.json({ availability: availabilityMap })
  } catch (error) {
    console.error('Fehler beim Abrufen der Verfügbarkeit:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Verfügbarkeit' },
      { status: 500 }
    )
  }
}

function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
