/**
 * Employee Working Times API Route
 * GET: Arbeitszeiten abrufen
 * PUT: Arbeitszeiten bearbeiten (nur Admin)
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Arbeitszeiten abrufen
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
    const employeeId = searchParams.get('employeeId')

    let targetEmployeeId: string | null = null

    if (employeeId && session.user.role === 'ADMIN') {
      targetEmployeeId = employeeId
    } else {
      // Eigenes Profil
      const ownEmployee = await prisma.employee.findFirst({
        where: {
          userId: session.user.id,
          tenantId: session.user.tenantId,
        },
      })

      if (!ownEmployee) {
        return NextResponse.json(
          { error: 'Mitarbeiter-Profil nicht gefunden' },
          { status: 404 }
        )
      }

      targetEmployeeId = ownEmployee.id
    }

    const employee = await prisma.employee.findUnique({
      where: { id: targetEmployeeId },
      select: {
        id: true,
        workStart: true,
        workEnd: true,
        breakStart: true,
        breakEnd: true,
        daysOff: true,
      },
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Mitarbeiter nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json({ times: employee })
  } catch (error) {
    console.error('Fehler beim Abrufen der Arbeitszeiten:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Arbeitszeiten' },
      { status: 500 }
    )
  }
}

// PUT: Arbeitszeiten bearbeiten (nur Admin)
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    // Nur Admin kann Arbeitszeiten ändern
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert. Nur Administratoren können Arbeitszeiten ändern.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      employeeId,
      workStart,
      workEnd,
      breakStart,
      breakEnd,
      daysOff,
    } = body

    if (!employeeId) {
      return NextResponse.json(
        { error: 'employeeId ist erforderlich' },
        { status: 400 }
      )
    }

    // Prüfe ob Mitarbeiter existiert und zum Tenant gehört
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        tenantId: session.user.tenantId,
      },
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Mitarbeiter nicht gefunden' },
        { status: 404 }
      )
    }

    // Aktualisiere Arbeitszeiten
    const updatedEmployee = await prisma.employee.update({
      where: { id: employeeId },
      data: {
        ...(workStart !== undefined && { workStart }),
        ...(workEnd !== undefined && { workEnd }),
        ...(breakStart !== undefined && { breakStart }),
        ...(breakEnd !== undefined && { breakEnd }),
        ...(daysOff !== undefined && { daysOff }),
      },
      select: {
        id: true,
        workStart: true,
        workEnd: true,
        breakStart: true,
        breakEnd: true,
        daysOff: true,
      },
    })

    return NextResponse.json({ times: updatedEmployee })
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Arbeitszeiten:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren der Arbeitszeiten' },
      { status: 500 }
    )
  }
}

