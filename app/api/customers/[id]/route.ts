/**
 * Customer Detail API Route
 * GET: Einzelnen Kunden abrufen
 * PUT: Kunden aktualisieren
 * DELETE: Kunden löschen
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Einzelnen Kunden abrufen
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

    const customer = await prisma.customer.findFirst({
      where: {
        id: id,
        tenantId: session.user.tenantId,
      },
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Kunde nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json({ customer })
  } catch (error) {
    console.error('Fehler beim Abrufen des Kunden:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen des Kunden' },
      { status: 500 }
    )
  }
}

// PUT: Kunden aktualisieren
export async function PUT(
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
    const { firstName, lastName, email, phone, address } = body

    const customer = await prisma.customer.updateMany({
      where: {
        id: id,
        tenantId: session.user.tenantId,
      },
      data: {
        firstName,
        lastName,
        email: email || null,
        phone: phone || null,
        address: address || null,
      },
    })

    if (customer.count === 0) {
      return NextResponse.json(
        { error: 'Kunde nicht gefunden' },
        { status: 404 }
      )
    }

    const updatedCustomer = await prisma.customer.findUnique({
      where: { id: id },
    })

    return NextResponse.json({ customer: updatedCustomer })
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Kunden:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des Kunden' },
      { status: 500 }
    )
  }
}

// DELETE: Kunden löschen
export async function DELETE(
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

    const customer = await prisma.customer.deleteMany({
      where: {
        id: id,
        tenantId: session.user.tenantId,
      },
    })

    if (customer.count === 0) {
      return NextResponse.json(
        { error: 'Kunde nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Kunde erfolgreich gelöscht' })
  } catch (error) {
    console.error('Fehler beim Löschen des Kunden:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Kunden' },
      { status: 500 }
    )
  }
}

