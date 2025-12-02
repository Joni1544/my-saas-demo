/**
 * Employee Availability Check API Route
 * POST: Prüft Verfügbarkeit eines Mitarbeiters für einen Zeitraum
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkEmployeeAvailability } from '@/lib/employee-availability'

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
    const { employeeId, startTime, endTime } = body

    if (!employeeId || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'employeeId, startTime und endTime sind erforderlich' },
        { status: 400 }
      )
    }

    const availability = await checkEmployeeAvailability(
      employeeId,
      new Date(startTime),
      new Date(endTime)
    )

    return NextResponse.json({ availability })
  } catch (error) {
    console.error('Fehler beim Prüfen der Verfügbarkeit:', error)
    return NextResponse.json(
      { error: 'Fehler beim Prüfen der Verfügbarkeit' },
      { status: 500 }
    )
  }
}

