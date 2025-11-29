/**
 * Registrierungs-API Route
 * Erstellt neuen Benutzer und Shop (Tenant)
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Prisma 5 Transaction Client Typ
type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, shopName } = body

    // Validierung
    if (!email || !password || !shopName) {
      return NextResponse.json(
        { error: 'Email, Passwort und Firmenname sind erforderlich' },
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

