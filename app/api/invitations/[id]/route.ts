/**
 * Invitation Detail API Route
 * DELETE: Löscht eine Einladung (nur Admin)
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    // Nur Admin kann Einladungen löschen
    if (!session?.user?.tenantId || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 403 }
      )
    }

    // Prüfe ob Einladung zum Tenant gehört
    const invitation = await prisma.invitation.findFirst({
      where: {
        id: id,
        tenantId: session.user.tenantId,
      },
    })

    if (!invitation) {
      return NextResponse.json(
        { error: 'Einladung nicht gefunden' },
        { status: 404 }
      )
    }

    // Lösche Einladung
    await prisma.invitation.delete({
      where: { id: id },
    })

    return NextResponse.json({ message: 'Einladung erfolgreich gelöscht' })
  } catch (error) {
    console.error('Fehler beim Löschen der Einladung:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen der Einladung' },
      { status: 500 }
    )
  }
}

