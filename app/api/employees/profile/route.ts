/**
 * Employee Profile API Route
 * GET: Profil abrufen (eigenes oder anderes wenn Admin)
 * PUT: Profil bearbeiten (Mitarbeiter nur eigenes, Admin alle)
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Profil abrufen
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
    const employeeId = searchParams.get('employeeId')

    // Wenn employeeId angegeben und User ist Admin, hole dieses Profil
    if (employeeId && session.user.role === 'ADMIN') {
      const employee = await prisma.employee.findFirst({
        where: {
          id: employeeId,
          tenantId: session.user.tenantId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          vacationRequests: {
            orderBy: { createdAt: 'desc' },
          },
        },
      })

      if (!employee) {
        return NextResponse.json(
          { error: 'Mitarbeiter nicht gefunden' },
          { status: 404 }
        )
      }

      return NextResponse.json({ employee })
    }

    // Sonst: eigenes Profil
    const employee = await prisma.employee.findFirst({
      where: {
        userId: session.user.id,
        tenantId: session.user.tenantId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        vacationRequests: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Mitarbeiter-Profil nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json({ employee })
  } catch (error) {
    console.error('Fehler beim Abrufen des Profils:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen des Profils' },
      { status: 500 }
    )
  }
}

// PUT: Profil bearbeiten
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      employeeId, // Optional: für Admin, um anderes Profil zu bearbeiten
      phone,
      position,
      bio,
      avatarUrl,
    } = body

    // Bestimme welches Profil bearbeitet wird
    let targetEmployeeId: string | null = null

    if (employeeId && session.user.role === 'ADMIN') {
      // Admin kann jedes Profil bearbeiten
      const targetEmployee = await prisma.employee.findFirst({
        where: {
          id: employeeId,
          tenantId: session.user.tenantId,
        },
      })

      if (!targetEmployee) {
        return NextResponse.json(
          { error: 'Mitarbeiter nicht gefunden' },
          { status: 404 }
        )
      }

      targetEmployeeId = targetEmployee.id
    } else {
      // Mitarbeiter kann nur eigenes Profil bearbeiten
      const ownEmployee = await prisma.employee.findFirst({
        where: {
          userId: session.user.id,
          tenantId: session.user.tenantId,
        },
      })

      if (!ownEmployee) {
        return NextResponse.json(
          { error: 'Mitarbeiter-Profil nicht gefunden' },
          { status: 404 }
        )
      }

      targetEmployeeId = ownEmployee.id
    }

    // Aktualisiere Profil
    const updatedEmployee = await prisma.employee.update({
      where: { id: targetEmployeeId },
      data: {
        ...(phone !== undefined && { phone }),
        ...(position !== undefined && { position }),
        ...(bio !== undefined && { bio }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ employee: updatedEmployee })
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Profils:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des Profils' },
      { status: 500 }
    )
  }
}

