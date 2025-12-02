/**
 * Chat API - Nachricht senden
 * POST /api/chat/send
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || !session.user?.tenantId) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const body = await request.json()
    const { receiverId, channelId, content } = body

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Nachricht darf nicht leer sein' }, { status: 400 })
    }

    // Entweder receiverId ODER channelId muss gesetzt sein
    if (!receiverId && !channelId) {
      return NextResponse.json({ error: 'Empfänger oder Channel muss angegeben werden' }, { status: 400 })
    }

    if (receiverId && channelId) {
      return NextResponse.json({ error: 'Nur Empfänger ODER Channel, nicht beides' }, { status: 400 })
    }

    // Prüfe ob Empfänger/Channel zum gleichen Tenant gehört
    if (receiverId) {
      const receiver = await prisma.user.findUnique({
        where: { id: receiverId },
        include: { shop: true },
      })

      if (!receiver || receiver.tenantId !== session.user.tenantId) {
        return NextResponse.json({ error: 'Empfänger nicht gefunden oder nicht im gleichen Unternehmen' }, { status: 403 })
      }
    }

    if (channelId) {
      const channel = await prisma.chatChannel.findUnique({
        where: { id: channelId },
      })

      if (!channel || channel.tenantId !== session.user.tenantId) {
        return NextResponse.json({ error: 'Channel nicht gefunden oder nicht im gleichen Unternehmen' }, { status: 403 })
      }

      // Prüfe ob User Mitglied des Channels ist
      const isMember = await prisma.channelMember.findUnique({
        where: {
          channelId_userId: {
            channelId,
            userId: session.user.id!,
          },
        },
      })

      if (!isMember) {
        return NextResponse.json({ error: 'Sie sind kein Mitglied dieses Channels' }, { status: 403 })
      }
    }

    // Erstelle Nachricht
    const message = await prisma.message.create({
      data: {
        senderId: session.user.id,
        receiverId: receiverId || null,
        channelId: channelId || null,
        content: content.trim(),
        tenantId: session.user.tenantId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    console.error('Fehler beim Senden der Nachricht:', error)
    return NextResponse.json({ error: 'Fehler beim Senden der Nachricht' }, { status: 500 })
  }
}

