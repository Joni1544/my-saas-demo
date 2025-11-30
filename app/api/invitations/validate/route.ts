/**
 * Invitation Validate API Route
 * GET: Validiert einen Invite-Token
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Token ist erforderlich' },
        { status: 400 }
      )
    }

    // Finde Einladung
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            tenantId: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!invitation) {
      return NextResponse.json(
        { error: 'Ungültiger Einladungslink' },
        { status: 404 }
      )
    }

    // Prüfe ob bereits verwendet
    if (invitation.used) {
      return NextResponse.json(
        { error: 'Diese Einladung wurde bereits verwendet' },
        { status: 400 }
      )
    }

    // Prüfe Ablaufdatum
    if (new Date() > invitation.expiresAt) {
      return NextResponse.json(
        { error: 'Diese Einladung ist abgelaufen' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      valid: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        shopName: invitation.shop.name,
        shopId: invitation.shop.id,
        tenantId: invitation.shop.tenantId,
        createdBy: invitation.creator.name || invitation.creator.email,
        expiresAt: invitation.expiresAt,
      },
    })
  } catch (error) {
    console.error('Fehler beim Validieren der Einladung:', error)
    return NextResponse.json(
      { error: 'Fehler beim Validieren der Einladung' },
      { status: 500 }
    )
  }
}

