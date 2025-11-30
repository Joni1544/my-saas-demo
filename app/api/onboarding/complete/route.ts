/**
 * Onboarding Complete API Route
 * POST: Aktiviert Mitarbeiter-Konto mit Name und Passwort
 */
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, name, password } = body

    if (!token || !name || !password) {
      return NextResponse.json(
        { error: 'Token, Name und Passwort sind erforderlich' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Passwort muss mindestens 8 Zeichen lang sein' },
        { status: 400 }
      )
    }

    // Validiere Token
    let decoded: {
      tenantId: string
      employeeId: string
      userId: string
      role: string
      email: string
    }
    try {
      decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'fallback-secret') as {
        tenantId: string
        employeeId: string
        userId: string
        role: string
        email: string
      }
    } catch {
      return NextResponse.json(
        { error: 'Ungültiger oder abgelaufener Token' },
        { status: 401 }
      )
    }

    // Prüfe ob Employee existiert
    const employee = await prisma.employee.findUnique({
      where: { id: decoded.employeeId },
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

    // Prüfe ob bereits aktiviert
    if (employee.user.password && employee.user.password.length > 0) {
      return NextResponse.json(
        { error: 'Konto wurde bereits aktiviert' },
        { status: 400 }
      )
    }

    // Hash Passwort
    const hashedPassword = await bcrypt.hash(password, 10)

    // Aktualisiere User
    await prisma.user.update({
      where: { id: employee.userId },
      data: {
        name: name,
        password: hashedPassword,
      },
    })

    // Aktiviere Employee
    await prisma.employee.update({
      where: { id: employee.id },
      data: {
        isActive: true,
        active: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Konto erfolgreich aktiviert',
    })
  } catch (error) {
    console.error('Fehler beim Aktivieren des Kontos:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktivieren des Kontos' },
      { status: 500 }
    )
  }
}

