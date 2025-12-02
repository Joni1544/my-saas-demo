/**
 * Channel Members API
 * POST: Mitglied zu Channel hinzufügen
 * DELETE: Mitglied aus Channel entfernen
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST: Mitglied zu Channel hinzufügen
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || !session.user?.tenantId) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const body = await request.json()
    const { channelId, userId } = body

    if (!channelId || !userId) {
      return NextResponse.json({ error: 'channelId und userId sind erforderlich' }, { status: 400 })
    }

    // Prüfe ob Channel existiert und zum Tenant gehört
    const channel = await prisma.chatChannel.findFirst({
      where: {
        id: channelId,
        tenantId: session.user.tenantId,
      },
    })

    if (!channel) {
      return NextResponse.json({ error: 'Channel nicht gefunden' }, { status: 404 })
    }

    // Prüfe ob User zum gleichen Tenant gehört
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user || user.tenantId !== session.user.tenantId) {
      return NextResponse.json({ error: 'User nicht gefunden oder nicht im gleichen Unternehmen' }, { status: 403 })
    }

    // Prüfe ob aktueller User Mitglied ist oder Admin
    const isMember = await prisma.channelMember.findUnique({
      where: {
        channelId_userId: {
          channelId,
          userId: session.user.id!,
        },
      },
    })

    if (!isMember && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 })
    }

    // Prüfe ob bereits Mitglied
    const existingMember = await prisma.channelMember.findUnique({
      where: {
        channelId_userId: {
          channelId,
          userId,
        },
      },
    })

    if (existingMember) {
      return NextResponse.json({ error: 'User ist bereits Mitglied' }, { status: 400 })
    }

    // Füge Mitglied hinzu
    const member = await prisma.channelMember.create({
      data: {
        channelId,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ member }, { status: 201 })
  } catch (error) {
    console.error('Fehler beim Hinzufügen des Members:', error)
    return NextResponse.json({ error: 'Fehler beim Hinzufügen des Members' }, { status: 500 })
  }
}

// DELETE: Mitglied aus Channel entfernen
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || !session.user?.tenantId) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const channelId = searchParams.get('channelId')
    const userId = searchParams.get('userId')

    if (!channelId || !userId) {
      return NextResponse.json({ error: 'channelId und userId sind erforderlich' }, { status: 400 })
    }

    // Prüfe ob Channel existiert und zum Tenant gehört
    const channel = await prisma.chatChannel.findFirst({
      where: {
        id: channelId,
        tenantId: session.user.tenantId,
      },
    })

    if (!channel) {
      return NextResponse.json({ error: 'Channel nicht gefunden' }, { status: 404 })
    }

    // System-Channels: Nur Admin kann Mitglieder entfernen
    if (channel.isSystem && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Aus System-Channels können nur Admins Mitglieder entfernen' }, { status: 403 })
    }

    // Prüfe ob aktueller User Mitglied ist oder Admin
    const isMember = await prisma.channelMember.findUnique({
      where: {
        channelId_userId: {
          channelId,
          userId: session.user.id!,
        },
      },
    })

    // User kann sich selbst entfernen, oder Admin/Mitglied kann andere entfernen
    if (userId !== session.user.id && !isMember && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 })
    }

    // Entferne Mitglied
    await prisma.channelMember.delete({
      where: {
        channelId_userId: {
          channelId,
          userId,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Fehler beim Entfernen des Members:', error)
    return NextResponse.json({ error: 'Fehler beim Entfernen des Members' }, { status: 500 })
  }
}

