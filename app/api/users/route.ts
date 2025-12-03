/**
 * Users API Route
 * GET: Liste aller Users des Tenants (für Mitarbeiter-Erstellung)
 * POST: Neuen User erstellen (nur Admin)
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

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

// POST: Neuen User erstellen
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
    const { name, email, role, password, initialVacationDays } = body

    if (!name || !email || !role) {
      return NextResponse.json(
        { error: 'Name, Email und Rolle sind erforderlich' },
        { status: 400 }
      )
    }

    // Validiere Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Ungültige Email-Adresse' },
        { status: 400 }
      )
    }

    // Validiere Rolle
    if (role !== 'ADMIN' && role !== 'MITARBEITER') {
      return NextResponse.json(
        { error: 'Ungültige Rolle. Muss ADMIN oder MITARBEITER sein' },
        { status: 400 }
      )
    }

    // Prüfe ob Email bereits existiert
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Ein User mit dieser Email existiert bereits' },
        { status: 400 }
      )
    }

    // Hash Passwort falls vorhanden
    let hashedPassword = ''
    if (password && password.length >= 8) {
      hashedPassword = await bcrypt.hash(password, 10)
    }

    // Erstelle User
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        role: role as 'ADMIN' | 'MITARBEITER',
        password: hashedPassword,
        tenantId: session.user.tenantId,
      },
    })

    // Erstelle automatisch Employee-Profil falls Rolle MITARBEITER
    let employee = null
    if (role === 'MITARBEITER') {
      employee = await prisma.employee.create({
        data: {
          userId: newUser.id,
          tenantId: session.user.tenantId,
          isActive: true,
          active: true,
          vacationDaysTotal: initialVacationDays ? parseInt(initialVacationDays) : 25,
          vacationDaysUsed: 0,
        },
      })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        hasPassword: !!hashedPassword,
      },
      employee: employee ? {
        id: employee.id,
        vacationDaysTotal: employee.vacationDaysTotal,
      } : null,
      credentials: password ? {
        email,
        password,
        loginUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login`,
      } : null,
    })
  } catch (error) {
    console.error('Fehler beim Erstellen des Users:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Users' },
      { status: 500 }
    )
  }
}
