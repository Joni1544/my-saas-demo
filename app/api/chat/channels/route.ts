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

    // Stelle sicher, dass Teamchat existiert und User Mitglied ist
    let teamchat = await prisma.chatChannel.findFirst({
      where: {
        tenantId: session.user.tenantId,
        isSystem: true,
        name: 'Teamchat',
      },
    })

    // Erstelle Teamchat falls nicht vorhanden
    if (!teamchat) {
      teamchat = await prisma.chatChannel.create({
        data: {
          name: 'Teamchat',
          tenantId: session.user.tenantId,
          isSystem: true,
          createdBy: session.user.id,
        },
      })
    }

    // Stelle sicher, dass alle aktiven Mitarbeiter Mitglieder sind
    const activeEmployees = await prisma.employee.findMany({
      where: {
        tenantId: session.user.tenantId,
        isActive: true,
      },
      select: {
        userId: true,
      },
    })

    // Füge alle aktiven Mitarbeiter zum Teamchat hinzu
    await prisma.channelMember.createMany({
      data: activeEmployees.map((emp) => ({
        channelId: teamchat!.id,
        userId: emp.userId,
      })),
      skipDuplicates: true,
    })

    // Stelle sicher, dass aktueller User Mitglied ist
    await prisma.channelMember.upsert({
      where: {
        channelId_userId: {
          channelId: teamchat.id,
          userId: session.user.id!,
        },
      },
      create: {
        channelId: teamchat.id,
        userId: session.user.id!,
      },
      update: {},
    })

    // Hole nur Channels, in denen der User Mitglied ist
    const userChannels = await prisma.channelMember.findMany({
      where: {
        userId: session.user.id!,
      },
      select: {
        channelId: true,
      },
    })

    const channelIds = userChannels.map((cm) => cm.channelId)

    const channels = await prisma.chatChannel.findMany({
      where: {
        tenantId: session.user.tenantId,
        id: { in: channelIds },
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
            members: true,
          },
        },
      },
      orderBy: [
        { isSystem: 'desc' }, // System-Channels zuerst
        { name: 'asc' }, // Dann alphabetisch
      ],
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

    // Jeder Mitarbeiter darf Channels erstellen
    const body = await request.json()
    const { name, userIds } = body // userIds: Array von User-IDs die automatisch hinzugefügt werden sollen

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Channel-Name ist erforderlich' }, { status: 400 })
    }

    // Erstelle Channel
    const channel = await prisma.chatChannel.create({
      data: {
        name: name.trim(),
        tenantId: session.user.tenantId,
        createdBy: session.user.id,
        isSystem: false,
      },
    })

    // Ersteller automatisch als Mitglied hinzufügen
    await prisma.channelMember.create({
      data: {
        channelId: channel.id,
        userId: session.user.id!,
      },
    })

    // Füge zusätzliche Mitglieder hinzu (falls angegeben)
    if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      // Prüfe ob alle User zum gleichen Tenant gehören
      const users = await prisma.user.findMany({
        where: {
          id: { in: userIds },
          tenantId: session.user.tenantId,
        },
      })

      // Füge alle gültigen User hinzu
      await prisma.channelMember.createMany({
        data: users.map((user) => ({
          channelId: channel.id,
          userId: user.id,
        })),
        skipDuplicates: true,
      })
    }

    return NextResponse.json({ channel }, { status: 201 })
  } catch (error) {
    console.error('Fehler beim Erstellen des Channels:', error)
    return NextResponse.json({ error: 'Fehler beim Erstellen des Channels' }, { status: 500 })
  }
}

