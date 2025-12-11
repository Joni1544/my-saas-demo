/**
 * Template Selector Component
 * Dropdown zur Auswahl eines Rechnungstemplates
 */
'use client'

import { useState, useEffect } from 'react'

interface Template {
  id: string
  name: string
  description: string | null
  layoutType: string
  isDefault: boolean
}

interface TemplateSelectorProps {
  value?: string
  onChange: (templateId: string) => void
  disabled?: boolean
}

export default function TemplateSelector({
  value,
  onChange,
  disabled = false,
}: TemplateSelectorProps) {
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
        
        // Wenn kein Wert gesetzt und es gibt ein Standard-Template, verwende es
        if (!value && data.templates?.length > 0) {
          const defaultTemplate = data.templates.find((t: Template) => t.isDefault) || data.templates[0]
          onChange(defaultTemplate.id)
        }
      }
    } catch (error) {
      console.error('Fehler beim Laden der Templates:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <select disabled className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-500">
        <option>Lade Templates...</option>
      </select>
    )
  }

  return (
    <div className="w-full">
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-500"
      >
        <option value="">Template wählen...</option>
        {templates.map((template) => (
          <option key={template.id} value={template.id}>
            {template.name} {template.isDefault && '(Standard)'}
          </option>
        ))}
      </select>
      {value && templates.find((t) => t.id === value) && (
        <p className="mt-1 text-xs text-gray-500">
          Layout: {templates.find((t) => t.id === value)?.layoutType}
        </p>
      )}
    </div>
  )
}

