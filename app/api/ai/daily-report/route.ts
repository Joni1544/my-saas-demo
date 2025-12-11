/**
 * KI API Route: Tagesbericht generieren
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { aiService } from '@/services/ai/AiService'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const periodDays = body.periodDays || 1

    const result = await aiService.generateDailyReport(
      session.user.tenantId,
      periodDays
    )

    return NextResponse.json({ result })
  } catch (error) {
    console.error('[AI API] Error generating daily report:', error)
    return NextResponse.json(
      { error: 'Fehler beim Generieren des Tagesberichts' },
      { status: 500 }
    )
  }
}

