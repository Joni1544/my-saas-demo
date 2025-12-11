/**
 * New Invoice Page
 * Rechnungserstellung mit Template-Auswahl
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import TemplateSelector from '@/components/invoices/templates/TemplateSelector'
import TemplatePreview from '@/components/invoices/templates/TemplatePreview'

interface Template {
  id: string
  name: string
  logoUrl?: string | null
  primaryColor?: string | null
  secondaryColor?: string | null
  layoutType?: string | null
  headerText?: string | null
  footerText?: string | null
}

interface Customer {
  id: string
  firstName: string
  lastName: string
  email: string | null
}

export default function NewInvoicePage() {
  const router = useRouter()
  const [templateId, setTemplateId] = useState<string>('')
  const [template, setTemplate] = useState<Template | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [generatingAiText, setGeneratingAiText] = useState(false)
  const [formData, setFormData] = useState({
    customerId: '',
    amount: '',
    currency: 'EUR',
    description: '',
    aiDraftText: '',
    items: [] as Array<{ description: string; amount: number }>,
    dueDate: '',
  })

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await fetch('/api/customers')
      if (response.ok) {
        const data = await response.json()
        setCustomers(data.customers || [])
      }
    } catch (error) {
      console.error('Fehler:', error)
    }
  }, [])

  const fetchTemplate = useCallback(async () => {
    if (!templateId) return
    try {
      const response = await fetch(`/api/invoice-templates/${templateId}`)
      if (response.ok) {
        const data = await response.json()
        setTemplate(data.template)
      }
    } catch (error) {
      console.error('Fehler:', error)
    }
  }, [templateId])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  useEffect(() => {
    if (templateId) {
      fetchTemplate()
    }
  }, [templateId, fetchTemplate])

  const handleGenerateAiText = async () => {
    setGeneratingAiText(true)
    try {
      // WICHTIG: Nur Metadaten senden, keine personenbezogenen Daten!
      const response = await fetch('/api/ai/invoice-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType: 'service',
          duration: 30,
          price: parseFloat(formData.amount) || 0,
          companyStyle: 'professionell, freundlich',
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setFormData({ ...formData, aiDraftText: data.draftText })
      }
    } catch (error) {
      console.error('Fehler:', error)
      alert('Fehler beim Generieren des KI-Texts')
    } finally {
      setGeneratingAiText(false)
    }
  }

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', amount: 0 }],
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: formData.customerId || undefined,
          amount: parseFloat(formData.amount) || 0,
          currency: formData.currency,
          description: formData.description || formData.aiDraftText || undefined,
          aiDraftText: formData.aiDraftText || undefined,
          items: formData.items.length > 0 ? formData.items : undefined,
          dueDate: formData.dueDate || undefined,
          templateId: templateId || undefined,
        }),
      })

      if (!response.ok) throw new Error('Fehler beim Erstellen der Rechnung')

      const data = await response.json()
      router.push(`/dashboard/invoices/${data.invoice.id}`)
    } catch (error) {
      console.error('Fehler:', error)
      alert('Fehler beim Erstellen der Rechnung')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Neue Rechnung</h1>
          <p className="mt-2 text-sm text-gray-600">Erstelle eine neue Rechnung</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Formular */}
          <div className="lg:col-span-2 space-y-6">
            {/* Template-Auswahl */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Template</h2>
              <TemplateSelector value={templateId} onChange={setTemplateId} />
            </div>

            {/* Kunde */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Kunde</h2>
              <select
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Kunde wählen...</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.firstName} {customer.lastName}
                  </option>
                ))}
              </select>
            </div>

            {/* Betrag */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Betrag</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Betrag</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Währung</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="CHF">CHF</option>
                  </select>
                </div>
              </div>
            </div>

            {/* KI-Text */}
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Rechnungstext</h2>
                <button
                  type="button"
                  onClick={handleGenerateAiText}
                  disabled={generatingAiText}
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {generatingAiText ? 'Generiert...' : '🤖 KI-Text generieren'}
                </button>
              </div>
              <textarea
                value={formData.aiDraftText || formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={6}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Rechnungstext (wird von KI generiert oder manuell eingegeben)"
              />
              {formData.aiDraftText && (
                <p className="mt-2 text-xs text-gray-500">
                  💡 KI-generierter Text. Bitte Kundendaten manuell ergänzen.
                </p>
              )}
            </div>

            {/* Rechnungsposten */}
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Rechnungsposten</h2>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
                >
                  + Position hinzufügen
                </button>
              </div>
              <div className="space-y-2">
                {formData.items.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => {
                        const newItems = [...formData.items]
                        newItems[index].description = e.target.value
                        setFormData({ ...formData, items: newItems })
                      }}
                      placeholder="Beschreibung"
                      className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={item.amount}
                      onChange={(e) => {
                        const newItems = [...formData.items]
                        newItems[index].amount = parseFloat(e.target.value) || 0
                        setFormData({ ...formData, items: newItems })
                      }}
                      placeholder="Betrag"
                      className="w-32 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Fälligkeitsdatum */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Fälligkeitsdatum</h2>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Wird erstellt...' : 'Rechnung erstellen'}
              </button>
            </div>
          </div>

          {/* Vorschau */}
          <div className="lg:col-span-1">
            {template && (
              <div className="sticky top-4">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Vorschau</h3>
                <TemplatePreview template={template} />
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

