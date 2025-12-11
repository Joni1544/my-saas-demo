/**
 * Invoice Template Detail API Route
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { invoiceTemplateService } from '@/services/invoice/InvoiceTemplateService'

// GET: Template abrufen
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const template = await invoiceTemplateService.getTemplate(id, session.user.tenantId)

    if (!template) {
      return NextResponse.json(
        { error: 'Template nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json({ template })
  } catch (error) {
    console.error('[Invoice Template API] Error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen des Templates' },
      { status: 500 }
    )
  }
}

// PUT: Template aktualisieren
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const template = await invoiceTemplateService.updateTemplate(id, session.user.tenantId, {
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

    return NextResponse.json({ template })
  } catch (error) {
    console.error('[Invoice Template API] Error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des Templates' },
      { status: 500 }
    )
  }
}

// DELETE: Template löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user?.tenantId || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 403 }
      )
    }

    await invoiceTemplateService.deleteTemplate(id, session.user.tenantId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Invoice Template API] Error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Templates' },
      { status: 500 }
    )
  }
}

