/**
 * Chat API - Nachricht löschen
 * DELETE /api/chat/messages/[id]
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    // Prüfe ob Nachricht existiert und zum Tenant gehört
    const message = await prisma.message.findUnique({
      where: { id },
    })

    if (!message || message.tenantId !== session.user.tenantId) {
      return NextResponse.json({ error: 'Nachricht nicht gefunden' }, { status: 404 })
    }

    // Nur Admin oder Sender darf löschen
    if (session.user.role !== 'ADMIN' && message.senderId !== session.user.id) {
      return NextResponse.json({ error: 'Keine Berechtigung zum Löschen' }, { status: 403 })
    }

    await prisma.message.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Fehler beim Löschen der Nachricht:', error)
    return NextResponse.json({ error: 'Fehler beim Löschen der Nachricht' }, { status: 500 })
  }
}

