/**
 * Channel Members API
 * GET: Alle Mitglieder eines Channels
 * POST: Mitglied hinzufügen
 * DELETE: Mitglied entfernen
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Alle Mitglieder eines Channels
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || !session.user?.tenantId) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const { id } = await params

    // Prüfe ob Channel existiert und User Mitglied ist
    const channel = await prisma.chatChannel.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    })

    if (!channel) {
      return NextResponse.json({ error: 'Channel nicht gefunden' }, { status: 404 })
    }

    const isMember = await prisma.channelMember.findUnique({
      where: {
        channelId_userId: {
          channelId: id,
          userId: session.user.id!,
        },
      },
    })

    if (!isMember && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 })
    }

    const members = await prisma.channelMember.findMany({
      where: { channelId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    })

    return NextResponse.json({ members })
  } catch (error) {
    console.error('Fehler beim Laden der Mitglieder:', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Mitglieder' }, { status: 500 })
  }
}

// POST: Mitglied hinzufügen
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || !session.user?.tenantId) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId ist erforderlich' }, { status: 400 })
    }

    // Prüfe ob Channel existiert
    const channel = await prisma.chatChannel.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    })

    if (!channel) {
      return NextResponse.json({ error: 'Channel nicht gefunden' }, { status: 404 })
    }

    // Prüfe ob aktueller User Mitglied ist oder Admin
    const isMember = await prisma.channelMember.findUnique({
      where: {
        channelId_userId: {
          channelId: id,
          userId: session.user.id!,
        },
      },
    })

    if (!isMember && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 })
    }

    // Prüfe ob User zum gleichen Tenant gehört
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user || user.tenantId !== session.user.tenantId) {
      return NextResponse.json({ error: 'User nicht gefunden oder nicht im gleichen Unternehmen' }, { status: 403 })
    }

    // Prüfe ob bereits Mitglied
    const existingMember = await prisma.channelMember.findUnique({
      where: {
        channelId_userId: {
          channelId: id,
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
        channelId: id,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
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

// DELETE: Mitglied entfernen
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || !session.user?.tenantId) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const { id } = await params
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId ist erforderlich' }, { status: 400 })
    }

    // Prüfe ob Channel existiert
    const channel = await prisma.chatChannel.findFirst({
      where: {
        id,
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
          channelId: id,
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
          channelId: id,
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

