/**
 * KI API Route: Mahntext generieren (DSGVO-sicher)
 * WICHTIG: Keine personenbezogenen Daten an KI senden!
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { aiServiceWrapper } from '@/services/ai/AiServiceWrapper'
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

    // Erstelle DSGVO-sicheren Kontext (nur Metadaten)
    const aiContext = {
      level,
      invoiceAmount: invoiceAmount || 0,
      companyMood: companyMood || 'neutral',
    }

    // Generiere Mahntext mit Tracking
    const reminderText = await generateReminderText(aiContext, session.user.tenantId)

    return NextResponse.json({
      reminderText,
      context: aiContext, // Zur Info, was verwendet wurde
    })
  } catch (error) {
    console.error('[AI Reminder Text API] Error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Generieren des Mahntexts' },
      { status: 500 }
    )
  }
}

/**
 * Mahntext generieren (DSGVO-sicher)
 * Nur generische Texte, keine personenbezogenen Daten
 */
async function generateReminderText(
  context: { level: number; invoiceAmount: number; companyMood: string },
  tenantId: string
): Promise<string> {
  // Dummy-Implementierung - würde später durch echte KI ersetzt werden
  await new Promise(resolve => setTimeout(resolve, 300))

  const mood = context.companyMood || 'neutral'
  const amount = context.invoiceAmount || 0
  const formattedAmount = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)

  let text = ''

  if (context.level === 1) {
    // Freundliche Erinnerung
    if (mood === 'freundlich') {
      text = `Sehr geehrte Damen und Herren,\n\n`
      text += `wir möchten Sie freundlich daran erinnern, dass die Rechnung über ${formattedAmount} noch aussteht.\n\n`
      text += `Bitte überweisen Sie den Betrag innerhalb der nächsten 7 Tage auf unser Konto.\n\n`
      text += `Falls Sie die Zahlung bereits veranlasst haben, betrachten Sie diese Nachricht als gegenstandslos.\n\n`
      text += `Mit freundlichen Grüßen\nIhr Team`
    } else {
      text = `Erinnerung: Die Rechnung über ${formattedAmount} ist fällig.\n\n`
      text += `Bitte überweisen Sie den Betrag umgehend auf unser Konto.\n\n`
      text += `Vielen Dank.`
    }
  } else if (context.level === 2) {
    // Bestimmte Mahnung
    text = `Sehr geehrte Damen und Herren,\n\n`
    text += `trotz unserer ersten Erinnerung ist die Rechnung über ${formattedAmount} noch nicht bei uns eingegangen.\n\n`
    text += `Wir bitten Sie, die Zahlung innerhalb von 3 Tagen zu veranlassen.\n\n`
    text += `Bei Nichtzahlung behalten wir uns weitere rechtliche Schritte vor.\n\n`
    text += `Mit freundlichen Grüßen\nIhr Team`
  } else if (context.level === 3) {
    // Letzte Mahnung
    text = `Sehr geehrte Damen und Herren,\n\n`
    text += `die Rechnung über ${formattedAmount} ist seit längerer Zeit überfällig.\n\n`
    text += `Wir fordern Sie hiermit auf, den ausstehenden Betrag innerhalb von 7 Tagen zu begleichen.\n\n`
    text += `Sollte die Zahlung nicht innerhalb dieser Frist eingehen, werden wir die Angelegenheit an ein Inkassobüro übergeben.\n\n`
    text += `Mit freundlichen Grüßen\nIhr Team`
  }

  return text
}

