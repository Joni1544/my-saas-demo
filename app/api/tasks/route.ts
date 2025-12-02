/**
 * Tasks API Route
 * GET: Liste aller Aufgaben (gefiltert nach Tenant)
 * POST: Neue Aufgabe erstellen
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Alle Aufgaben abrufen
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const where: {
      tenantId: string
      assignedTo?: string
    } = {
      tenantId: session.user.tenantId,
    }

    // Mitarbeiter sieht NUR eigene Aufgaben
    if (session.user.role === 'MITARBEITER') {
      where.assignedTo = session.user.id
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignedToUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('Fehler beim Abrufen der Aufgaben:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Aufgaben' },
      { status: 500 }
    )
  }
}

// POST: Neue Aufgabe erstellen
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, description, priority, dueDate, deadline, assignedTo } = body

    if (!title) {
      return NextResponse.json(
        { error: 'Titel ist erforderlich' },
        { status: 400 }
      )
    }

    // Unterstütze sowohl dueDate als auch deadline (Kompatibilität)
    const finalDeadline = deadline || dueDate

    // Mitarbeiter kann Aufgaben NUR für sich selbst erstellen
    let finalAssignedTo = assignedTo || null
    if (session.user.role === 'MITARBEITER') {
      finalAssignedTo = session.user.id
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        priority: priority || 'MEDIUM',
        dueDate: finalDeadline ? new Date(finalDeadline) : null,
        deadline: finalDeadline ? new Date(finalDeadline) : null,
        assignedTo: finalAssignedTo,
        tenantId: session.user.tenantId,
      },
    })

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    console.error('Fehler beim Erstellen der Aufgabe:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Aufgabe' },
      { status: 500 }
    )
  }
}

