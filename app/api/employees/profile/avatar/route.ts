/**
 * Avatar Upload API Route
 * POST: Profilbild hochladen
 * DELETE: Profilbild entfernen
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'avatars')

// Stelle sicher, dass Upload-Verzeichnis existiert
async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true })
  }
}

// POST: Avatar hochladen
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    // Hole Employee-Profil
    const employee = await prisma.employee.findFirst({
      where: {
        userId: session.user.id,
        tenantId: session.user.tenantId,
      },
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Mitarbeiter-Profil nicht gefunden' },
        { status: 404 }
      )
    }

    // Parse FormData
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'Keine Datei hochgeladen' },
        { status: 400 }
      )
    }

    // Validiere Dateityp
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Nur Bildformate erlaubt (PNG, JPG, JPEG, WEBP)' },
        { status: 400 }
      )
    }

    // Validiere Dateigröße
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Datei zu groß. Maximal 5 MB erlaubt.' },
        { status: 400 }
      )
    }

    // Stelle sicher, dass Upload-Verzeichnis existiert
    await ensureUploadDir()

    // Generiere eindeutigen Dateinamen
    const fileExtension = file.name.split('.').pop() || 'jpg'
    const fileName = `${employee.id}-${Date.now()}.${fileExtension}`
    const filePath = join(UPLOAD_DIR, fileName)

    // Konvertiere File zu Buffer und speichere
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Generiere öffentliche URL
    const avatarUrl = `/uploads/avatars/${fileName}`

    // Lösche altes Avatar falls vorhanden
    if (employee.avatarUrl && employee.avatarUrl.startsWith('/uploads/avatars/')) {
      const oldFileName = employee.avatarUrl.split('/').pop()
      if (oldFileName) {
        const oldFilePath = join(UPLOAD_DIR, oldFileName)
        try {
          if (existsSync(oldFilePath)) {
            await unlink(oldFilePath)
          }
        } catch (error) {
          console.error('Fehler beim Löschen des alten Avatars:', error)
          // Ignoriere Fehler beim Löschen
        }
      }
    }

    // Aktualisiere Employee-Profil
    await prisma.employee.update({
      where: { id: employee.id },
      data: { avatarUrl },
    })

    return NextResponse.json({
      success: true,
      avatarUrl,
      message: 'Profilbild erfolgreich hochgeladen',
    })
  } catch (error) {
    console.error('Fehler beim Hochladen des Avatars:', error)
    return NextResponse.json(
      { error: 'Fehler beim Hochladen des Profilbilds' },
      { status: 500 }
    )
  }
}

// DELETE: Avatar entfernen
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    // Hole Employee-Profil
    const employee = await prisma.employee.findFirst({
      where: {
        userId: session.user.id,
        tenantId: session.user.tenantId,
      },
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Mitarbeiter-Profil nicht gefunden' },
        { status: 404 }
      )
    }

    // Lösche Datei falls vorhanden
    if (employee.avatarUrl && employee.avatarUrl.startsWith('/uploads/avatars/')) {
      const fileName = employee.avatarUrl.split('/').pop()
      if (fileName) {
        const filePath = join(UPLOAD_DIR, fileName)
        try {
          if (existsSync(filePath)) {
            await unlink(filePath)
          }
        } catch (error) {
          console.error('Fehler beim Löschen des Avatars:', error)
          // Ignoriere Fehler beim Löschen
        }
      }
    }

    // Entferne Avatar-URL aus Profil
    await prisma.employee.update({
      where: { id: employee.id },
      data: { avatarUrl: null },
    })

    return NextResponse.json({
      success: true,
      message: 'Profilbild erfolgreich entfernt',
    })
  } catch (error) {
    console.error('Fehler beim Entfernen des Avatars:', error)
    return NextResponse.json(
      { error: 'Fehler beim Entfernen des Profilbilds' },
      { status: 500 }
    )
  }
}

