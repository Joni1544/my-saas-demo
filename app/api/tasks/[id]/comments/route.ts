/**
 * Task Comments API Route
 * GET: Kommentare einer Aufgabe abrufen
 * POST: Neuen Kommentar erstellen
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Kommentare einer Aufgabe abrufen
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    // Prüfe ob Task existiert und zum Tenant gehört
    const task = await prisma.task.findFirst({
      where: {
        id: id,
        tenantId: session.user.tenantId,
      },
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Aufgabe nicht gefunden' },
        { status: 404 }
      )
    }

    const comments = await prisma.taskComment.findMany({
      where: {
        taskId: id,
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
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Fehler beim Abrufen der Kommentare:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Kommentare' },
      { status: 500 }
    )
  }
}

// POST: Neuen Kommentar erstellen
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { content } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Kommentar-Inhalt ist erforderlich' },
        { status: 400 }
      )
    }

    // Prüfe ob Task existiert und zum Tenant gehört
    const task = await prisma.task.findFirst({
      where: {
        id: id,
        tenantId: session.user.tenantId,
      },
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Aufgabe nicht gefunden' },
        { status: 404 }
      )
    }

    const comment = await prisma.taskComment.create({
      data: {
        taskId: id,
        userId: session.user.id,
        content: content.trim(),
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

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    console.error('Fehler beim Erstellen des Kommentars:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Kommentars' },
      { status: 500 }
    )
  }
}

