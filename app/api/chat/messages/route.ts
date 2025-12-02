/**
 * Chat API - Nachrichten abrufen
 * GET /api/chat/messages?userId=...&channelId=...
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || !session.user?.tenantId) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const channelId = searchParams.get('channelId')

    if (!userId && !channelId) {
      return NextResponse.json({ error: 'userId oder channelId muss angegeben werden' }, { status: 400 })
    }

    // Prüfe ob User/Channel zum gleichen Tenant gehört
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      })

      if (!user || user.tenantId !== session.user.tenantId) {
        return NextResponse.json({ error: 'User nicht gefunden oder nicht im gleichen Unternehmen' }, { status: 403 })
      }
    }

    if (channelId) {
      const channel = await prisma.chatChannel.findUnique({
        where: { id: channelId },
      })

      if (!channel || channel.tenantId !== session.user.tenantId) {
        return NextResponse.json({ error: 'Channel nicht gefunden oder nicht im gleichen Unternehmen' }, { status: 403 })
      }
    }

    // Hole Nachrichten
    const where: {
      tenantId: string
      OR?: Array<{ senderId: string; receiverId: string }>
      channelId?: string
    } = {
      tenantId: session.user.tenantId,
    }

    if (userId) {
      // Einzelchat: Nachrichten zwischen currentUser und userId
      where.OR = [
        { senderId: session.user.id, receiverId: userId },
        { senderId: userId, receiverId: session.user.id },
      ]
    }

    if (channelId) {
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
        return NextResponse.json({ error: 'Nicht autorisiert - Sie sind kein Mitglied dieses Channels' }, { status: 403 })
      }

      where.channelId = channelId
    }

    const messages = await prisma.message.findMany({
      where,
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
      orderBy: {
        createdAt: 'asc',
      },
      take: 100, // Letzte 100 Nachrichten
    })

    // Markiere empfangene Nachrichten als gelesen
    if (userId || channelId) {
      await prisma.message.updateMany({
        where: {
          ...where,
          receiverId: userId ? session.user.id : undefined,
          read: false,
        },
        data: {
          read: true,
        },
      })
    }

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Fehler beim Laden der Nachrichten:', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Nachrichten' }, { status: 500 })
  }
}

