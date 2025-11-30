/**
 * Invitation Create API Route
 * POST: Erstellt eine neue Einladung für einen Mitarbeiter
 * Nur Admin kann Einladungen erstellen
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    // Nur Admin kann Einladungen erstellen
    if (!session?.user?.tenantId || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert. Nur Administratoren können Einladungen erstellen.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email, role = 'MITARBEITER' } = body

    // Validierung
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Gültige Email-Adresse ist erforderlich' },
        { status: 400 }
      )
    }

    // Prüfe, ob User bereits existiert
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Ein Benutzer mit dieser Email existiert bereits' },
        { status: 400 }
      )
    }

    // Prüfe, ob bereits eine aktive Einladung für diese Email existiert
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email,
        tenantId: session.user.tenantId,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    })

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'Es existiert bereits eine aktive Einladung für diese Email' },
        { status: 400 }
      )
    }

    // Generiere eindeutigen Token
    const token = randomBytes(32).toString('hex')

    // Erstelle Einladung (gültig für 7 Tage)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const invitation = await prisma.invitation.create({
      data: {
        token,
        email,
        tenantId: session.user.tenantId,
        role: role === 'ADMIN' ? 'ADMIN' : 'MITARBEITER',
        expiresAt,
        createdBy: session.user.id!,
      },
      include: {
        shop: {
          select: {
            name: true,
          },
        },
      },
    })

    // Generiere Invite-Link
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const inviteLink = `${baseUrl}/invite/${token}`

    return NextResponse.json(
      {
        invitation: {
          id: invitation.id,
          email: invitation.email,
          token: invitation.token,
          role: invitation.role,
          expiresAt: invitation.expiresAt,
          inviteLink,
          shopName: invitation.shop.name,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Fehler beim Erstellen der Einladung:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Einladung' },
      { status: 500 }
    )
  }
}

