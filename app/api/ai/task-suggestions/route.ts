/**
 * KI API Route: Aufgaben-Vorschläge generieren
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { aiService } from '@/services/ai/AiService'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 403 }
      )
    }

    const suggestions = await aiService.generateTaskSuggestions(
      session.user.tenantId
    )

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('[AI API] Error generating task suggestions:', error)
    return NextResponse.json(
      { error: 'Fehler beim Generieren der Aufgaben-Vorschläge' },
      { status: 500 }
    )
  }
}

