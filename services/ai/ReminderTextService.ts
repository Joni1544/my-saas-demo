/**
 * Reminder Text Service
 * Generiert DSGVO-sichere Mahntexte
 */
import { aiUsageService } from './AiUsageService'

export interface ReminderContext {
  level: number
  invoiceAmount: number
  companyMood: 'freundlich' | 'neutral' | 'streng'
}

/**
 * Mahntext generieren (DSGVO-sicher)
 * Nur generische Texte, keine personenbezogenen Daten
 */
export async function generateReminderText(
  context: ReminderContext,
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

  // Track AI Usage
  await aiUsageService.recordUsage({
    tenantId,
    feature: 'reminder_text',
    tokensInput: JSON.stringify(context).length / 4,
    tokensOutput: text.length / 4,
    aiProvider: 'openai',
  })

  return text
}

