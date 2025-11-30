/**
 * Login Validation API
 * Validiert Credentials und gibt spezifische Fehlermeldungen zurück
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'EMAIL_REQUIRED', message: 'Bitte geben Sie Email und Passwort ein' },
        { status: 400 }
      )
    }

    // Prüfe ob User existiert
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'USER_NOT_FOUND', message: 'Dieser Benutzer ist nicht registriert' },
        { status: 404 }
      )
    }

    // Prüfe Passwort
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return NextResponse.json(
        { error: 'INVALID_PASSWORD', message: 'Das Passwort ist falsch' },
        { status: 401 }
      )
    }

    // Alles OK
    return NextResponse.json({ valid: true })
  } catch (error) {
    console.error('Validation error:', error)
    return NextResponse.json(
      { error: 'UNKNOWN', message: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}

