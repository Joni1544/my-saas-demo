/**
 * Invitations API Route
 * GET: Liste aller Einladungen für den Tenant (nur Admin)
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    // Nur Admin kann Einladungen sehen
    if (!session?.user?.tenantId || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const includeUsed = searchParams.get('includeUsed') === 'true'

    const where: {
      tenantId: string
      used?: boolean
    } = {
      tenantId: session.user.tenantId,
    }

    if (!includeUsed) {
      where.used = false
    }

    const invitations = await prisma.invitation.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        usedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        shop: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Generiere Invite-Links
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const invitationsWithLinks = invitations.map((inv) => ({
      id: inv.id,
      email: inv.email,
      token: inv.token,
      role: inv.role,
      expiresAt: inv.expiresAt,
      used: inv.used,
      usedAt: inv.usedAt,
      usedBy: inv.usedByUser,
      createdBy: inv.creator,
      shopName: inv.shop.name,
      inviteLink: `${baseUrl}/invite/${inv.token}`,
      createdAt: inv.createdAt,
    }))

    return NextResponse.json({ invitations: invitationsWithLinks })
  } catch (error) {
    console.error('Fehler beim Abrufen der Einladungen:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Einladungen' },
      { status: 500 }
    )
  }
}

