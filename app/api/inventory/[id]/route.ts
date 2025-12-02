/**
 * Inventory Item Detail API Route
 * GET: Einzelnen Artikel abrufen
 * PUT: Artikel aktualisieren
 * DELETE: Artikel löschen
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    // Nur Admin kann Inventar sehen
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert. Nur Administratoren können Inventar einsehen.' },
        { status: 403 }
      )
    }

    const item = await prisma.inventoryItem.findFirst({
      where: {
        id: id,
        tenantId: session.user.tenantId,
      },
    })

    if (!item) {
      return NextResponse.json(
        { error: 'Artikel nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json({ item })
  } catch (error) {
    console.error('Fehler beim Abrufen des Artikels:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen des Artikels' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user?.tenantId || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, quantity, minThreshold, category, pricePerUnit, link, manufacturer } = body

    const item = await prisma.inventoryItem.updateMany({
      where: {
        id: id,
        tenantId: session.user.tenantId,
      },
      data: {
        ...(name !== undefined && { name }),
        ...(quantity !== undefined && { quantity: parseInt(quantity) || 0 }),
        ...(minThreshold !== undefined && { minThreshold: parseInt(minThreshold) || 0 }),
        ...(category !== undefined && { category: category || null }),
        ...(pricePerUnit !== undefined && { pricePerUnit: pricePerUnit ? parseFloat(pricePerUnit) : null }),
        ...(link !== undefined && { link: link || null }),
        ...(manufacturer !== undefined && { manufacturer: manufacturer || null }),
        lastUpdated: new Date(),
      },
    })

    if (item.count === 0) {
      return NextResponse.json(
        { error: 'Artikel nicht gefunden' },
        { status: 404 }
      )
    }

    const updatedItem = await prisma.inventoryItem.findUnique({
      where: { id: id },
    })

    return NextResponse.json({ item: updatedItem })
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Artikels:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des Artikels' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user?.tenantId || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 403 }
      )
    }

    const item = await prisma.inventoryItem.deleteMany({
      where: {
        id: id,
        tenantId: session.user.tenantId,
      },
    })

    if (item.count === 0) {
      return NextResponse.json(
        { error: 'Artikel nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Artikel erfolgreich gelöscht' })
  } catch (error) {
    console.error('Fehler beim Löschen des Artikels:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Artikels' },
      { status: 500 }
    )
  }
}

