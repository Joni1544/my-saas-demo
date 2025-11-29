/**
 * Customers API Route
 * GET: Liste aller Kunden (gefiltert nach Tenant und Rolle)
 * POST: Neuen Kunden erstellen
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Alle Kunden abrufen (mit Filter, Suche, Tags)
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
    const search = searchParams.get('search')
    const tag = searchParams.get('tag')
    const archived = searchParams.get('archived') === 'true'
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Admin sieht alle Kunden der Firma, Mitarbeiter nur eigene
    const where: {
      tenantId: string
      isArchived?: boolean
      id?: { in: string[] }
      OR?: Array<{
        firstName?: { contains: string; mode: 'insensitive' }
        lastName?: { contains: string; mode: 'insensitive' }
        email?: { contains: string; mode: 'insensitive' }
        phone?: { contains: string; mode: 'insensitive' }
      }>
      tags?: { has: string }
    } = {
      tenantId: session.user.tenantId,
      isArchived: archived,
    }

    // Suche
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Tag-Filter
    if (tag) {
      where.tags = { has: tag }
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
          .map((a: { customerId: string | null }) => a.customerId)
          .filter((id: string | null): id is string => id !== null)

        if (customerIds.length > 0) {
          where.id = { in: customerIds }
        } else {
          return NextResponse.json({ customers: [] })
        }
      } else {
        return NextResponse.json({ customers: [] })
      }
    }

    // Sortierung
    const orderBy: Record<string, 'asc' | 'desc'> = {}
    if (sortBy === 'name') {
      orderBy.firstName = sortOrder as 'asc' | 'desc'
    } else {
      orderBy[sortBy] = sortOrder as 'asc' | 'desc'
    }

    const customers = await prisma.customer.findMany({
      where,
      orderBy,
      include: {
        appointments: {
          take: 1,
          orderBy: { startTime: 'desc' },
          select: {
            startTime: true,
            status: true,
          },
        },
        _count: {
          select: {
            appointments: true,
          },
        },
      },
    })

    // Berechne Historie (Letzter Termin, Häufigkeit)
    const customersWithHistory = customers.map((customer) => ({
      ...customer,
      lastAppointment: customer.appointments[0]?.startTime || null,
      appointmentCount: customer._count.appointments,
    }))

    return NextResponse.json({ customers: customersWithHistory })
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
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { firstName, lastName, email, phone, address, notes, tags } = body

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
        notes: notes || null,
        tags: tags || [],
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

