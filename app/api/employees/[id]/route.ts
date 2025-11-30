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
      include: {
        user: {
          select: {
            name: true,
            email: true,
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

    // Parse salary und payoutDay (nullable)
    const parsedSalary = salary !== undefined && salary !== null && salary !== '' ? parseFloat(salary) : null
    const parsedPayoutDay = payoutDay !== undefined && payoutDay !== null && payoutDay !== '' ? parseInt(payoutDay) : null

    // Validiere payoutDay falls vorhanden
    if (parsedPayoutDay !== null && (parsedPayoutDay < 1 || parsedPayoutDay > 31)) {
      return NextResponse.json(
        { error: 'Auszahlungstag muss zwischen 1 und 31 liegen' },
        { status: 400 }
      )
    }

    // Update Employee
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
        ...(salary !== undefined && { salary: parsedSalary }),
        ...(hourlyRate !== undefined && { hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null }),
        ...(commissionRate !== undefined && { commissionRate: commissionRate ? parseFloat(commissionRate) : null }),
        ...(payoutDay !== undefined && { payoutDay: parsedPayoutDay }),
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

    // Automatisch RecurringExpense für Gehalt erstellen/aktualisieren
    if (parsedSalary !== null && parsedSalary > 0 && parsedPayoutDay !== null && parsedPayoutDay >= 1 && parsedPayoutDay <= 31) {
      // Suche nach existierendem RecurringExpense für diesen Mitarbeiter
      const existingRecurringExpense = await prisma.recurringExpense.findFirst({
        where: {
          tenantId: session.user.tenantId,
          employeeId: id,
          category: 'GEHALT',
        },
      })

      const employeeName = employee.user.name || employee.user.email
      const now = new Date()
      const nextRun = new Date(now.getFullYear(), now.getMonth(), parsedPayoutDay)
      if (nextRun < now) {
        nextRun.setMonth(nextRun.getMonth() + 1)
      }

      if (existingRecurringExpense) {
        // Aktualisiere existierenden RecurringExpense
        await prisma.recurringExpense.update({
          where: { id: existingRecurringExpense.id },
          data: {
            name: `Gehalt • ${employeeName}`,
            amount: parsedSalary,
            dayOfMonth: parsedPayoutDay,
            nextRun,
            isActive: true,
            description: `Automatisch generiertes Gehalt für ${employeeName}`,
          },
        })
      } else {
        // Erstelle neuen RecurringExpense
        await prisma.recurringExpense.create({
          data: {
            tenantId: session.user.tenantId,
            name: `Gehalt • ${employeeName}`,
            amount: parsedSalary,
            category: 'GEHALT',
            interval: 'MONTHLY',
            startDate: now,
            nextRun,
            dayOfMonth: parsedPayoutDay,
            employeeId: id,
            isActive: true,
            description: `Automatisch generiertes Gehalt für ${employeeName}`,
          },
        })
      }
    } else {
      // Wenn kein Gehalt oder kein Auszahlungstag: Deaktiviere RecurringExpense
      const existingRecurringExpense = await prisma.recurringExpense.findFirst({
        where: {
          tenantId: session.user.tenantId,
          employeeId: id,
          category: 'GEHALT',
        },
      })

      if (existingRecurringExpense) {
        await prisma.recurringExpense.update({
          where: { id: existingRecurringExpense.id },
          data: { isActive: false },
        })
      }
    }

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

