/**
 * Employee Password API Route
 * PUT: Setzt oder ändert das Passwort eines Mitarbeiters
 * DELETE: Löscht das Passwort (deaktiviert Zugang)
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// PUT: Passwort setzen oder ändern
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
    const { password } = body

    if (!password) {
      return NextResponse.json(
        { error: 'Passwort ist erforderlich' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Passwort muss mindestens 8 Zeichen lang sein' },
        { status: 400 }
      )
    }

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        user: true,
      },
    })

    if (!employee || employee.tenantId !== session.user.tenantId) {
      return NextResponse.json(
        { error: 'Mitarbeiter nicht gefunden' },
        { status: 404 }
      )
    }

    // Hash Passwort
    const hashedPassword = await bcrypt.hash(password, 10)

    // Aktualisiere User-Passwort
    await prisma.user.update({
      where: { id: employee.userId },
      data: {
        password: hashedPassword,
      },
    })

    // Aktiviere Employee falls noch nicht aktiv
    await prisma.employee.update({
      where: { id },
      data: {
        isActive: true,
        active: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Passwort wurde erfolgreich gesetzt.',
    })
  } catch (error) {
    console.error('Fehler beim Setzen des Passworts:', error)
    return NextResponse.json(
      { error: 'Fehler beim Setzen des Passworts' },
      { status: 500 }
    )
  }
}

// DELETE: Passwort löschen (Zugang deaktivieren)
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
      include: {
        user: true,
      },
    })

    if (!employee || employee.tenantId !== session.user.tenantId) {
      return NextResponse.json(
        { error: 'Mitarbeiter nicht gefunden' },
        { status: 404 }
      )
    }

    // Lösche Passwort (setze auf leeren String)
    await prisma.user.update({
      where: { id: employee.userId },
      data: {
        password: '',
      },
    })

    // Deaktiviere Employee
    await prisma.employee.update({
      where: { id },
      data: {
        isActive: false,
        active: false,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Zugang wurde deaktiviert. Passwort wurde gelöscht.',
    })
  } catch (error) {
    console.error('Fehler beim Löschen des Passworts:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Passworts' },
      { status: 500 }
    )
  }
}

