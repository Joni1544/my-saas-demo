/**
 * Employee API Route (Einzelner Mitarbeiter)
 * GET: Mitarbeiter abrufen
 * PUT: Mitarbeiter aktualisieren
 * DELETE: Mitarbeiter löschen (deaktivieren)
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Einzelnen Mitarbeiter abrufen
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            password: true, // Für Prüfung ob Konto aktiviert
          },
        },
        appointments: {
          take: 10,
          orderBy: { startTime: 'desc' },
          include: {
            customer: true,
          },
        },
      },
    })

    if (!employee || employee.tenantId !== session.user.tenantId) {
      return NextResponse.json(
        { error: 'Mitarbeiter nicht gefunden' },
        { status: 404 }
      )
    }

    // Entferne Passwort aus Response, aber setze hasPassword Flag
    const { password, ...userWithoutPassword } = employee.user
    const employeeResponse = {
      ...employee,
      user: {
        ...userWithoutPassword,
        hasPassword: !!password && password.length > 0,
      },
    }

    return NextResponse.json({ employee: employeeResponse })
  } catch (error) {
    console.error('Fehler beim Abrufen des Mitarbeiters:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen des Mitarbeiters' },
      { status: 500 }
    )
  }
}

// PUT: Mitarbeiter aktualisieren
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user?.tenantId || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { position, color, workHours, isActive, active, employmentType, salaryType, baseSalary, salary, hourlyRate, commissionRate, payoutDay } = body

    const employee = await prisma.employee.findUnique({
      where: { id },
    })

    if (!employee || employee.tenantId !== session.user.tenantId) {
      return NextResponse.json(
        { error: 'Mitarbeiter nicht gefunden' },
        { status: 404 }
      )
    }

    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: {
        ...(position !== undefined && { position }),
        ...(color !== undefined && { color }),
        ...(isActive !== undefined && { isActive }),
        ...(active !== undefined && { active }),
        ...(employmentType !== undefined && { employmentType }),
        ...(salaryType !== undefined && { salaryType }),
        ...(baseSalary !== undefined && { baseSalary: baseSalary ? parseFloat(baseSalary) : null }),
        ...(salary !== undefined && { salary: parseFloat(salary) || 0 }),
        ...(hourlyRate !== undefined && { hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null }),
        ...(commissionRate !== undefined && { commissionRate: commissionRate ? parseFloat(commissionRate) : null }),
        ...(payoutDay !== undefined && { payoutDay: parseInt(payoutDay) || 1 }),
        ...(workHours !== undefined && { workHours }),
        ...(isActive !== undefined && { isActive }),
        ...(active !== undefined && { active }),
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

    return NextResponse.json({ employee: updatedEmployee })
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Mitarbeiters:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des Mitarbeiters' },
      { status: 500 }
    )
  }
}

// DELETE: Mitarbeiter deaktivieren (nicht löschen)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user?.tenantId || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 403 }
      )
    }

    const employee = await prisma.employee.findUnique({
      where: { id },
    })

    if (!employee || employee.tenantId !== session.user.tenantId) {
      return NextResponse.json(
        { error: 'Mitarbeiter nicht gefunden' },
        { status: 404 }
      )
    }

    // Deaktiviere statt zu löschen
    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ employee: updatedEmployee })
  } catch (error) {
    console.error('Fehler beim Deaktivieren des Mitarbeiters:', error)
    return NextResponse.json(
      { error: 'Fehler beim Deaktivieren des Mitarbeiters' },
      { status: 500 }
    )
  }
}

