/**
 * Template List Component
 * Liste aller Templates mit Vorschau
 */
'use client'

import { useState, useEffect } from 'react'
import TemplatePreview from './TemplatePreview'
import Link from 'next/link'

interface Template {
  id: string
  name: string
  description: string | null
  logoUrl?: string | null
  primaryColor?: string | null
  secondaryColor?: string | null
  layoutType?: string | null
  headerText?: string | null
  footerText?: string | null
  isDefault: boolean
  createdAt: Date
}

export default function TemplateList() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/invoice-templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Fehler beim Laden der Templates:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <p className="text-gray-500">Lade Templates...</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Rechnungstemplates</h2>
        <Link
          href="/dashboard/invoices/templates/new"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + Neues Template
        </Link>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-lg bg-white p-8 text-center shadow">
          <p className="text-gray-500">Noch keine Templates vorhanden</p>
          <Link
            href="/dashboard/invoices/templates/new"
            className="mt-4 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Erstes Template erstellen
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <div key={template.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{template.name}</h3>
                  {template.isDefault && (
                    <span className="text-xs text-green-600">Standard</span>
                  )}
                </div>
                <Link
                  href={`/dashboard/invoices/templates/${template.id}`}
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  Bearbeiten
                </Link>
              </div>
              <TemplatePreview template={template} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

