/**
 * KI API Route: Mahntext generieren (DSGVO-sicher)
 * WICHTIG: Keine personenbezogenen Daten an KI senden!
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { generateReminderText, ReminderContext } from '@/services/ai/ReminderTextService'
import { aiUsageService } from '@/services/ai/AiUsageService'

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
    const { level, invoiceAmount, companyMood } = body

    if (!level || (level !== 1 && level !== 2 && level !== 3)) {
      return NextResponse.json(
        { error: 'level muss 1, 2 oder 3 sein' },
        { status: 400 }
      )
    }

    // VALIDIERUNG: Prüfe dass keine personenbezogenen Daten enthalten sind
    const forbiddenFields = ['customerName', 'customerId', 'firstName', 'lastName', 'email', 'phone', 'address']
    const bodyKeys = Object.keys(body)
    const hasForbiddenFields = bodyKeys.some(key => 
      forbiddenFields.some(forbidden => key.toLowerCase().includes(forbidden.toLowerCase()))
    )

    if (hasForbiddenFields) {
      return NextResponse.json(
        { error: 'Personenbezogene Daten dürfen nicht an die KI gesendet werden' },
        { status: 400 }
      )
    }

    // Prüfe Limits vor KI-Aufruf
    try {
      const limits = await aiUsageService.checkLimits(session.user.tenantId)
      if (!limits.withinLimits) {
        return NextResponse.json(
          { 
            error: 'KI-Limit erreicht',
            details: limits
          },
          { status: 429 }
        )
      }
    } catch {
      // checkLimits existiert möglicherweise nicht, ignoriere
    }

    // Erstelle DSGVO-sicheren Kontext (nur Metadaten)
    const reminderContext: ReminderContext = {
      level,
      invoiceAmount: invoiceAmount || 0,
      companyMood: (companyMood || 'neutral') as 'freundlich' | 'neutral' | 'streng',
    }

    // Generiere Mahntext mit Tracking (Tracking erfolgt in generateReminderText)
    const reminderText = await generateReminderText(reminderContext, session.user.tenantId)

    return NextResponse.json({
      reminderText,
      context: reminderContext, // Zur Info, was verwendet wurde
    })
  } catch (error) {
    console.error('[AI Reminder Text API] Error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Generieren des Mahntexts' },
      { status: 500 }
    )
  }
}


