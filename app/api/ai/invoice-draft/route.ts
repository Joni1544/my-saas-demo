/**
 * KI API Route: Rechnungsentwurf generieren (DSGVO-sicher)
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
    const { serviceType, duration, price, companyStyle } = body

    // VALIDIERUNG: Prüfe dass keine personenbezogenen Daten enthalten sind
    const forbiddenFields = ['customerName', 'customerId', 'firstName', 'lastName', 'email', 'phone', 'address', 'street', 'city', 'zip', 'postalCode']
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

    // Erstelle DSGVO-sicheren Kontext (nur Metadaten)
    const aiContext = {
      serviceType: serviceType || 'service',
      duration: duration || null,
      price: price || 0,
      companyStyle: companyStyle || 'professionell, freundlich',
    }

    // Generiere Rechnungstext (Dummy-Implementierung)
    const draftText = await generateInvoiceDraftText(aiContext)

    return NextResponse.json({
      draftText,
      context: aiContext, // Zur Info, was verwendet wurde
    })
  } catch (error) {
    console.error('[AI Invoice Draft API] Error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Generieren des Rechnungsentwurfs' },
      { status: 500 }
    )
  }
}


