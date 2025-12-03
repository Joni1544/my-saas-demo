/**
 * Chat Channel API - Einzelner Channel
 * GET: Channel-DELETE: Channel löschen
 * PUT: Channel aktualisieren
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Channel Details
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

    const channel = await prisma.chatChannel.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            messages: true,
            members: true,
          },
        },
      },
    })

    if (!channel) {
      return NextResponse.json({ error: 'Channel nicht gefunden' }, { status: 404 })
    }

    return NextResponse.json({ channel })
  } catch (error) {
    console.error('Fehler beim Laden des Channels:', error)
    return NextResponse.json({ error: 'Fehler beim Laden des Channels' }, { status: 500 })
  }
}

// PUT: Channel aktualisieren (Name ändern)
export async function PUT(
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
    const { name, description } = body

    // Prüfe ob Channel existiert und zum Tenant gehört
    const channel = await prisma.chatChannel.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    })

    if (!channel) {
      return NextResponse.json({ error: 'Channel nicht gefunden' }, { status: 404 })
    }

    // System-Channels können nicht umbenannt werden
    if (channel.isSystem && name !== undefined) {
      return NextResponse.json({ error: 'System-Channels können nicht umbenannt werden' }, { status: 403 })
    }

    // Prüfe ob User Mitglied ist oder Admin
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

    const updateData: { name?: string; description?: string | null } = {}
    if (name !== undefined) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description?.trim() || null

    const updatedChannel = await prisma.chatChannel.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ channel: updatedChannel })
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Channels:', error)
    return NextResponse.json({ error: 'Fehler beim Aktualisieren des Channels' }, { status: 500 })
  }
}

// DELETE: Channel löschen (System-Channels können nicht gelöscht werden)
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

    // Prüfe ob Channel existiert und zum Tenant gehört
    const channel = await prisma.chatChannel.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    })

    if (!channel) {
      return NextResponse.json({ error: 'Channel nicht gefunden' }, { status: 404 })
    }

    // System-Channels können nicht gelöscht werden
    if (channel.isSystem) {
      return NextResponse.json({ error: 'System-Channels können nicht gelöscht werden' }, { status: 403 })
    }

    // Nur Admin oder Channel-Ersteller kann löschen
    if (channel.createdBy !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 })
    }

    await prisma.chatChannel.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Fehler beim Löschen des Channels:', error)
    return NextResponse.json({ error: 'Fehler beim Löschen des Channels' }, { status: 500 })
  }
}

