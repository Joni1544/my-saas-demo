/**
 * Private Chat API
 * GET: Hole oder erstelle privaten Chat zwischen zwei Usern
 * POST: Erstelle privaten Chat explizit
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Hole privaten Chat oder erstelle ihn falls nicht vorhanden
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || !session.user?.tenantId) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const otherUserId = searchParams.get('userId')

    if (!otherUserId) {
      return NextResponse.json({ error: 'userId ist erforderlich' }, { status: 400 })
    }

    // Prüfe ob User zum gleichen Tenant gehört
    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
    })

    if (!otherUser || otherUser.tenantId !== session.user.tenantId) {
      return NextResponse.json({ error: 'User nicht gefunden oder nicht im gleichen Unternehmen' }, { status: 403 })
    }

    // Prüfe ob bereits Nachrichten zwischen den beiden Usern existieren
    const existingMessages = await prisma.message.findFirst({
      where: {
        tenantId: session.user.tenantId,
        OR: [
          { senderId: session.user.id!, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: session.user.id! },
        ],
      },
      orderBy: { createdAt: 'asc' },
    })

    // Hole alle Nachrichten zwischen den beiden Usern
    const messages = await prisma.message.findMany({
      where: {
        tenantId: session.user.tenantId,
        OR: [
          { senderId: session.user.id!, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: session.user.id! },
        ],
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
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({
      chat: {
        type: 'private',
        otherUser: {
          id: otherUser.id,
          name: otherUser.name,
          email: otherUser.email,
        },
        messages,
      },
    })
  } catch (error) {
    console.error('Fehler beim Laden des privaten Chats:', error)
    return NextResponse.json({ error: 'Fehler beim Laden des privaten Chats' }, { status: 500 })
  }
}

