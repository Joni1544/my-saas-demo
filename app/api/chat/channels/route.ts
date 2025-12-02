/**
 * Chat API - Channels abrufen und erstellen
 * GET /api/chat/channels
 * POST /api/chat/channels
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    if (!session || !session.user?.tenantId) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const channels = await prisma.chatChannel.findMany({
      where: {
        tenantId: session.user.tenantId,
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
          include: {
            sender: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ channels })
  } catch (error) {
    console.error('Fehler beim Laden der Channels:', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Channels' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || !session.user?.tenantId) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    // Nur Admin darf Channels erstellen
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Nur Administratoren dürfen Channels erstellen' }, { status: 403 })
    }

    const body = await request.json()
    const { name } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Channel-Name ist erforderlich' }, { status: 400 })
    }

    const channel = await prisma.chatChannel.create({
      data: {
        name: name.trim(),
        tenantId: session.user.tenantId,
        createdBy: session.user.id,
      },
    })

    return NextResponse.json({ channel }, { status: 201 })
  } catch (error) {
    console.error('Fehler beim Erstellen des Channels:', error)
    return NextResponse.json({ error: 'Fehler beim Erstellen des Channels' }, { status: 500 })
  }
}

