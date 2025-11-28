/**
 * Task Detail API Route
 * GET: Einzelne Aufgabe abrufen
 * PUT: Aufgabe aktualisieren
 * DELETE: Aufgabe löschen
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Einzelne Aufgabe abrufen
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const task = await prisma.task.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Aufgabe nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json({ task })
  } catch (error) {
    console.error('Fehler beim Abrufen der Aufgabe:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Aufgabe' },
      { status: 500 }
    )
  }
}

// PUT: Aufgabe aktualisieren
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, description, status, priority, dueDate, assignedTo } = body

    const task = await prisma.task.updateMany({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(assignedTo !== undefined && { assignedTo }),
      },
    })

    if (task.count === 0) {
      return NextResponse.json(
        { error: 'Aufgabe nicht gefunden' },
        { status: 404 }
      )
    }

    const updatedTask = await prisma.task.findUnique({
      where: { id: params.id },
    })

    return NextResponse.json({ task: updatedTask })
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Aufgabe:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren der Aufgabe' },
      { status: 500 }
    )
  }
}

// DELETE: Aufgabe löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const task = await prisma.task.deleteMany({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    })

    if (task.count === 0) {
      return NextResponse.json(
        { error: 'Aufgabe nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Aufgabe erfolgreich gelöscht' })
  } catch (error) {
    console.error('Fehler beim Löschen der Aufgabe:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen der Aufgabe' },
      { status: 500 }
    )
  }
}

