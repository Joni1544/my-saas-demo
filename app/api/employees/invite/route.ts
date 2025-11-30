/**
 * Employee Invite API Route
 * POST: Erstellt einen Einladungslink für einen Mitarbeiter
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

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
    const { employeeId, email } = body

    if (!employeeId) {
      return NextResponse.json(
        { error: 'Mitarbeiter-ID ist erforderlich' },
        { status: 400 }
      )
    }

    // Prüfe ob Employee existiert und zum Tenant gehört
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        tenantId: session.user.tenantId,
      },
      include: {
        user: true,
      },
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Mitarbeiter nicht gefunden' },
        { status: 404 }
      )
    }

    // Prüfe ob User bereits ein Passwort hat
    if (employee.user.password && employee.user.password.length > 0) {
      return NextResponse.json(
        { error: 'Mitarbeiter hat bereits ein Konto' },
        { status: 400 }
      )
    }

    // Generiere JWT Token
    const token = jwt.sign(
      {
        tenantId: session.user.tenantId,
        employeeId: employee.id,
        userId: employee.userId,
        role: employee.user.role,
        email: email || employee.user.email,
      },
      process.env.NEXTAUTH_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    )

    // Baue Onboarding-Link
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const inviteLink = `${baseUrl}/onboarding?token=${token}`

    return NextResponse.json({
      success: true,
      inviteLink,
      token,
      expiresIn: '7 Tage',
    })
  } catch (error) {
    console.error('Fehler beim Erstellen des Einladungslinks:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Einladungslinks' },
      { status: 500 }
    )
  }
}

