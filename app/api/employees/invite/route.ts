/**
 * Employee Invite API Route
 * POST: Erstellt einen Einladungslink für einen Mitarbeiter und setzt optional ein Passwort
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

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
    const { employeeId, email, password } = body

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

    // Wenn Passwort angegeben: Setze Passwort direkt
    if (password) {
      if (password.length < 8) {
        return NextResponse.json(
          { error: 'Passwort muss mindestens 8 Zeichen lang sein' },
          { status: 400 }
        )
      }

      const hashedPassword = await bcrypt.hash(password, 10)
      
      await prisma.user.update({
        where: { id: employee.userId },
        data: {
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

      // Finde Teamchat-Channel für diesen Tenant
      const teamchat = await prisma.chatChannel.findFirst({
        where: {
          tenantId: session.user.tenantId,
          isSystem: true,
          name: 'Teamchat',
        },
      })

      // Füge neuen Mitarbeiter automatisch zum Teamchat hinzu
      if (teamchat) {
        await prisma.channelMember.upsert({
          where: {
            channelId_userId: {
              channelId: teamchat.id,
              userId: employee.userId,
            },
          },
          create: {
            channelId: teamchat.id,
            userId: employee.userId,
          },
          update: {},
        })
      }

      return NextResponse.json({
        success: true,
        message: 'Passwort wurde gesetzt. Der Mitarbeiter kann sich jetzt mit Email und Passwort einloggen.',
        loginUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login`,
        email: email || employee.user.email,
      })
    }

    // Kein Passwort angegeben: Erstelle Onboarding-Link (Legacy-Verhalten)
    // Prüfe ob User bereits ein Passwort hat
    if (employee.user.password && employee.user.password.length > 0) {
      return NextResponse.json(
        { error: 'Mitarbeiter hat bereits ein Konto. Verwenden Sie die Passwort-Ändern-Funktion.' },
        { status: 400 }
      )
    }

    // Generiere JWT Token für Onboarding
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
      message: 'Onboarding-Link erstellt. Der Mitarbeiter kann sein Passwort selbst setzen.',
    })
  } catch (error) {
    console.error('Fehler beim Erstellen des Einladungslinks:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Einladungslinks' },
      { status: 500 }
    )
  }
}

