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

    // Wenn Mitarbeiter: Prüfe ob Kunde zu eigenen Terminen gehört
    let whereClause: {
      id: string
      tenantId: string
      id?: { in: string[] }
    } = {
      id: id,
      tenantId: session.user.tenantId,
    }

    if (session.user.role === 'MITARBEITER') {
      const employee = await prisma.employee.findUnique({
        where: { userId: session.user.id },
      })

      if (employee) {
        const appointments = await prisma.appointment.findMany({
          where: { employeeId: employee.id },
          select: { customerId: true },
        })

        const customerIds = appointments
          .map((a: { customerId: string | null }) => a.customerId)
          .filter((id: string | null): id is string => id !== null)

        if (!customerIds.includes(id)) {
          return NextResponse.json(
            { error: 'Kunde nicht gefunden oder nicht autorisiert' },
            { status: 404 }
          )
        }
      } else {
        return NextResponse.json(
          { error: 'Kunde nicht gefunden' },
          { status: 404 }
        )
      }
    }

    const customer = await prisma.customer.findFirst({
      where: whereClause,
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
    const { firstName, lastName, email, phone, address, notes, tags, isArchived } = body

    const customer = await prisma.customer.updateMany({
      where: {
        id: id,
        tenantId: session.user.tenantId,
      },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(email !== undefined && { email: email || null }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(address !== undefined && { address: address || null }),
        ...(notes !== undefined && { notes: notes || null }),
        ...(tags !== undefined && { tags }),
        ...(isArchived !== undefined && { isArchived }),
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

// DELETE: Kunden archivieren (nicht löschen)
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

    // Archiviere statt zu löschen
    const customer = await prisma.customer.updateMany({
      where: {
        id: id,
        tenantId: session.user.tenantId,
      },
      data: {
        isArchived: true,
      },
    })

    if (customer.count === 0) {
      return NextResponse.json(
        { error: 'Kunde nicht gefunden' },
        { status: 404 }
      )
    }

    const archivedCustomer = await prisma.customer.findUnique({
      where: { id: id },
    })

    return NextResponse.json({ 
      message: 'Kunde erfolgreich archiviert',
      customer: archivedCustomer 
    })
  } catch (error) {
    console.error('Fehler beim Archivieren des Kunden:', error)
    return NextResponse.json(
      { error: 'Fehler beim Archivieren des Kunden' },
      { status: 500 }
    )
  }
}

