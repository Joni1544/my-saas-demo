/**
 * Onboarding Token Validation API Route
 * GET: Validiert einen Onboarding-Token
 */
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Token fehlt' },
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
        shop: true,
      },
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Mitarbeiter nicht gefunden' },
        { status: 404 }
      )
    }

    // Prüfe ob Passwort bereits gesetzt ist
    const hasPassword = employee.user.password && employee.user.password.length > 0

    return NextResponse.json({
      valid: true,
      employee: {
        id: employee.id,
        email: employee.user.email,
        name: employee.user.name,
        role: employee.user.role,
        shopName: employee.shop.name,
        hasPassword,
      },
    })
  } catch (error) {
    console.error('Fehler bei der Token-Validierung:', error)
    return NextResponse.json(
      { error: 'Fehler bei der Token-Validierung' },
      { status: 500 }
    )
  }
}

