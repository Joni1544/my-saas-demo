/**
 * New Invoice Template Page
 */
'use client'

import { useRouter } from 'next/navigation'
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

export default function NewTemplatePage() {
  const router = useRouter()

  const handleSave = async (template: Template) => {
    try {
      const response = await fetch('/api/invoice-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      })

      if (!response.ok) throw new Error('Fehler beim Erstellen des Templates')

      router.push('/dashboard/invoices/templates')
    } catch (error) {
      console.error('Fehler:', error)
      alert('Fehler beim Erstellen des Templates')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Neues Rechnungstemplate</h1>
          <p className="mt-2 text-sm text-gray-600">
            Erstelle ein neues Template für deine Rechnungen
          </p>
        </div>

        <TemplateEditor
          onSave={handleSave}
          onCancel={() => router.push('/dashboard/invoices/templates')}
        />
      </div>
    </div>
  )
}

