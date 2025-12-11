/**
 * Template Preview Component
 * Vorschau eines Rechnungstemplates
 */
'use client'

import Image from 'next/image'

interface Template {
  id?: string
  name: string
  logoUrl?: string | null
  primaryColor?: string | null
  secondaryColor?: string | null
  layoutType?: string | null
  headerText?: string | null
  footerText?: string | null
}

interface TemplatePreviewProps {
  template: Template
  className?: string
}

export default function TemplatePreview({ template, className = '' }: TemplatePreviewProps) {
  const primaryColor = template.primaryColor || '#3B82F6'
  const secondaryColor = template.secondaryColor || '#1E40AF'

  return (
    <div className={`rounded-lg border-2 border-gray-200 bg-white shadow-lg ${className}`}>
      <div
        className="rounded-t-lg p-6 text-white"
        style={{ backgroundColor: primaryColor }}
      >
        {template.logoUrl && (
          <div className="relative mb-4 h-12 w-32">
            <Image
              src={template.logoUrl}
              alt="Logo"
              fill
              className="object-contain"
              unoptimized
            />
          </div>
        )}
        {template.headerText && (
          <p className="text-sm opacity-90">{template.headerText}</p>
        )}
        {!template.headerText && (
          <h2 className="text-xl font-bold">Rechnung</h2>
        )}
      </div>

      <div className="p-6">
        <div className="mb-4 border-b border-gray-200 pb-4">
          <p className="text-sm text-gray-500">Rechnungsnummer</p>
          <p className="font-semibold text-gray-900">RE-2024-0001</p>
        </div>

        <div className="mb-4 space-y-2">
          <div>
            <p className="text-sm text-gray-500">Kunde</p>
            <p className="text-gray-900">Musterkunde GmbH</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Datum</p>
            <p className="text-gray-900">11.12.2024</p>
          </div>
        </div>

        <div className="mb-4 border-t border-gray-200 pt-4">
          <div className="mb-2 flex justify-between">
            <span className="text-gray-900">Dienstleistung</span>
            <span className="font-semibold text-gray-900">100,00 €</span>
          </div>
        </div>

        <div
          className="rounded-md p-4 text-white"
          style={{ backgroundColor: secondaryColor }}
        >
          <div className="flex justify-between">
            <span className="font-semibold">Gesamtbetrag</span>
            <span className="text-xl font-bold">100,00 €</span>
          </div>
        </div>
      </div>

      {template.footerText && (
        <div className="rounded-b-lg border-t border-gray-200 bg-gray-50 p-4">
          <p className="text-xs text-gray-600">{template.footerText}</p>
        </div>
      )}
    </div>
  )
}

