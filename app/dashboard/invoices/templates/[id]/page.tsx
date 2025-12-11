/**
 * Edit Invoice Template Page
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import TemplateEditor from '@/components/invoices/templates/TemplateEditor'

interface Template {
  id?: string
  name: string
  description?: string
  logoUrl?: string
  primaryColor?: string
  secondaryColor?: string
  layoutType?: string
  headerText?: string
  footerText?: string
  isDefault?: boolean
}

export default function EditTemplatePage() {
  const params = useParams()
  const router = useRouter()
  const templateId = params.id as string
  const [template, setTemplate] = useState<Template | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchTemplate = useCallback(async () => {
    try {
      const response = await fetch(`/api/invoice-templates/${templateId}`)
      if (response.ok) {
        const data = await response.json()
        setTemplate(data.template)
      }
    } catch (error) {
      console.error('Fehler:', error)
    } finally {
      setLoading(false)
    }
  }, [templateId])

  useEffect(() => {
    if (templateId) {
      fetchTemplate()
    }
  }, [templateId, fetchTemplate])

  const handleSave = async (updatedTemplate: Template) => {
    try {
      const response = await fetch(`/api/invoice-templates/${templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTemplate),
      })

      if (!response.ok) throw new Error('Fehler beim Aktualisieren des Templates')

      router.push('/dashboard/invoices/templates')
    } catch (error) {
      console.error('Fehler:', error)
      alert('Fehler beim Aktualisieren des Templates')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Lade Template...</p>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Template nicht gefunden</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Template bearbeiten</h1>
          <p className="mt-2 text-sm text-gray-600">{template.name}</p>
        </div>

        <TemplateEditor
          template={template}
          onSave={handleSave}
          onCancel={() => router.push('/dashboard/invoices/templates')}
        />
      </div>
    </div>
  )
}

