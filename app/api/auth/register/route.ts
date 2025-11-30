/**
 * Registrierungs-API Route
 * Erstellt neuen Benutzer und Shop (Tenant)
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Prisma 5 Transaction Client Typ
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TransactionClient = any

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, shopName, inviteToken } = body

    // Validierung
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email und Passwort sind erforderlich' },
        { status: 400 }
      )
    }

    // Prüfe, ob Benutzer bereits existiert
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Benutzer mit dieser Email existiert bereits' },
        { status: 400 }
      )
    }

    // Passwort hashen
    const hashedPassword = await bcrypt.hash(password, 10)

    // Wenn Invite-Token vorhanden: Verwende Einladungsdaten
    if (inviteToken) {
      // Validiere Invite-Token
      const invitation = await prisma.invitation.findUnique({
        where: { token: inviteToken },
        include: {
          shop: true,
        },
      })

      if (!invitation) {
        return NextResponse.json(
          { error: 'Ungültiger Einladungslink' },
          { status: 400 }
        )
      }

      if (invitation.used) {
        return NextResponse.json(
          { error: 'Diese Einladung wurde bereits verwendet' },
          { status: 400 }
        )
      }

      if (new Date() > invitation.expiresAt) {
        return NextResponse.json(
          { error: 'Diese Einladung ist abgelaufen' },
          { status: 400 }
        )
      }

      // Prüfe Email-Match, falls Email in Invitation gesetzt
      if (invitation.email && invitation.email !== email) {
        return NextResponse.json(
          { error: 'Die Email-Adresse stimmt nicht mit der Einladung überein' },
          { status: 400 }
        )
      }

      // Transaktion: Erstelle User und markiere Invitation als verwendet
      const result = await prisma.$transaction(async (tx: TransactionClient) => {
        // Erstelle User mit Invitation-Daten
        const user = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            name: name || null,
            role: invitation.role,
            tenantId: invitation.tenantId,
          },
        })

        // Erstelle Employee-Eintrag
        await tx.employee.create({
          data: {
            userId: user.id,
            tenantId: invitation.tenantId,
          },
        })

        // Markiere Invitation als verwendet
        await tx.invitation.update({
          where: { id: invitation.id },
          data: {
            used: true,
            usedBy: user.id,
            usedAt: new Date(),
          },
        })

        return { user }
      })

      return NextResponse.json(
        {
          message: 'Registrierung erfolgreich',
          user: {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
            role: result.user.role,
          },
        },
        { status: 201 }
      )
    }

    // Normale Registrierung (ohne Invite): Erstelle neuen Shop
    if (!shopName) {
      return NextResponse.json(
        { error: 'Firmenname ist erforderlich' },
        { status: 400 }
      )
    }

    // Generiere eindeutige Tenant-ID
    const tenantId = `tenant_${Date.now()}_${Math.random().toString(36).substring(7)}`

    // Transaktion: Erstelle Shop und User gleichzeitig
    const result = await prisma.$transaction(async (tx: TransactionClient) => {
      // Erstelle Shop
      const shop = await tx.shop.create({
        data: {
          name: shopName,
          tenantId,
        },
      })

      // Erstelle Admin-User
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name: name || null,
          role: 'ADMIN',
          tenantId: shop.id,
        },
      })

      return { user, shop }
    })

    return NextResponse.json(
      {
        message: 'Registrierung erfolgreich',
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registrierungsfehler:', error)
    return NextResponse.json(
      { error: 'Fehler bei der Registrierung' },
      { status: 500 }
    )
  }
}

