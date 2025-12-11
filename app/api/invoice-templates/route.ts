/**
 * Invoice Templates API Route
 * CRUD für Rechnungstemplates
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { invoiceTemplateService } from '@/services/invoice/InvoiceTemplateService'

// GET: Templates auflisten
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const templates = await invoiceTemplateService.listTemplates(session.user.tenantId)

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('[Invoice Templates API] Error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Templates' },
      { status: 500 }
    )
  }
}

// POST: Template erstellen
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
    const {
      name,
      description,
      logoUrl,
      primaryColor,
      secondaryColor,
      layoutType,
      headerText,
      footerText,
      defaultItems,
      isDefault,
    } = body

    if (!name) {
      return NextResponse.json(
        { error: 'name ist erforderlich' },
        { status: 400 }
      )
    }

    const template = await invoiceTemplateService.createTemplate({
      tenantId: session.user.tenantId,
      name,
      description,
      logoUrl,
      primaryColor,
      secondaryColor,
      layoutType,
      headerText,
      footerText,
      defaultItems,
      isDefault,
    })

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error('[Invoice Templates API] Error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Templates' },
      { status: 500 }
    )
  }
}

