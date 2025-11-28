/**
 * Customers API Route
 * GET: Liste aller Kunden (gefiltert nach Tenant und Rolle)
 * POST: Neuen Kunden erstellen
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Alle Kunden abrufen
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    // Admin sieht alle Kunden der Firma, Mitarbeiter nur eigene
    const where: any = {
      tenantId: session.user.tenantId,
    }

    // Wenn Mitarbeiter: Nur Kunden mit eigenen Terminen
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
          .map((a) => a.customerId)
          .filter((id): id is string => id !== null)

        if (customerIds.length > 0) {
          where.id = { in: customerIds }
        } else {
          // Keine Termine = keine Kunden
          return NextResponse.json({ customers: [] })
        }
      } else {
        return NextResponse.json({ customers: [] })
      }
    }

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ customers })
  } catch (error) {
    console.error('Fehler beim Abrufen der Kunden:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Kunden' },
      { status: 500 }
    )
  }
}

// POST: Neuen Kunden erstellen
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { firstName, lastName, email, phone, address } = body

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'Vorname und Nachname sind erforderlich' },
        { status: 400 }
      )
    }

    const customer = await prisma.customer.create({
      data: {
        firstName,
        lastName,
        email: email || null,
        phone: phone || null,
        address: address || null,
        tenantId: session.user.tenantId,
      },
    })

    return NextResponse.json({ customer }, { status: 201 })
  } catch (error) {
    console.error('Fehler beim Erstellen des Kunden:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Kunden' },
      { status: 500 }
    )
  }
}

