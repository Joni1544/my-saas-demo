/**
 * Inventory API Route
 * GET: Liste aller Inventar-Artikel
 * POST: Neuen Artikel erstellen
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    const where: {
      tenantId: string
      category?: string
    } = {
      tenantId: session.user.tenantId,
    }

    if (category) {
      where.category = category
    }

    const items = await prisma.inventoryItem.findMany({
      where,
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Fehler beim Abrufen der Inventar-Artikel:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Inventar-Artikel' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert. Nur Administratoren können Artikel erstellen.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, quantity, minThreshold, category, pricePerUnit, link, manufacturer } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Name ist erforderlich' },
        { status: 400 }
      )
    }

    const item = await prisma.inventoryItem.create({
      data: {
        name,
        quantity: parseInt(quantity) || 0,
        minThreshold: parseInt(minThreshold) || 0,
        category: category || null,
        pricePerUnit: pricePerUnit ? parseFloat(pricePerUnit) : null,
        link: link || null,
        manufacturer: manufacturer || null,
        tenantId: session.user.tenantId,
      },
    })

    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    console.error('Fehler beim Erstellen des Artikels:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Artikels' },
      { status: 500 }
    )
  }
}

