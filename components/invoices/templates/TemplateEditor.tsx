/**
 * Template Editor Component
 * Editor zum Erstellen/Bearbeiten von Templates
 */
'use client'

import { useState } from 'react'
import Image from 'next/image'
import TemplatePreview from './TemplatePreview'

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

interface TemplateEditorProps {
  template?: Template
  onSave: (template: Template) => Promise<void>
  onCancel: () => void
}

const LAYOUT_TYPES = [
  { value: 'modern', label: 'Modern' },
  { value: 'classic', label: 'Klassisch' },
  { value: 'minimal', label: 'Minimal' },
]

export default function TemplateEditor({
  template,
  onSave,
  onCancel,
}: TemplateEditorProps) {
  const [formData, setFormData] = useState<Template>({
    name: template?.name || '',
    description: template?.description || '',
    logoUrl: template?.logoUrl || '',
    primaryColor: template?.primaryColor || '#3B82F6',
    secondaryColor: template?.secondaryColor || '#1E40AF',
    layoutType: template?.layoutType || 'modern',
    headerText: template?.headerText || '',
    footerText: template?.footerText || '',
    isDefault: template?.isDefault || false,
  })
  const [loading, setLoading] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Logo hochladen falls vorhanden
      let logoUrl = formData.logoUrl
      if (logoFile) {
        // Dummy-Upload - würde später durch echten Upload ersetzt werden
        logoUrl = URL.createObjectURL(logoFile)
      }

      await onSave({
        ...formData,
        logoUrl,
      })
    } catch (error) {
      console.error('Fehler beim Speichern:', error)
      alert('Fehler beim Speichern des Templates')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Editor */}
      <div className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Beschreibung</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Logo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
            />
            {formData.logoUrl && !logoFile && (
              <div className="relative mt-2 h-16 w-32">
                <Image
                  src={formData.logoUrl}
                  alt="Logo"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Primärfarbe</label>
              <div className="mt-1 flex gap-2">
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="h-10 w-20 cursor-pointer rounded border border-gray-300"
                />
                <input
                  type="text"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Sekundärfarbe</label>
              <div className="mt-1 flex gap-2">
                <input
                  type="color"
                  value={formData.secondaryColor}
                  onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  className="h-10 w-20 cursor-pointer rounded border border-gray-300"
                />
                <input
                  type="text"
                  value={formData.secondaryColor}
                  onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Layout</label>
            <select
              value={formData.layoutType}
              onChange={(e) => setFormData({ ...formData, layoutType: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {LAYOUT_TYPES.map((layout) => (
                <option key={layout.value} value={layout.value}>
                  {layout.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Kopfzeilen-Text</label>
            <textarea
              value={formData.headerText}
              onChange={(e) => setFormData({ ...formData, headerText: e.target.value })}
              rows={2}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Optional: Text für den Kopfbereich"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Fußzeilen-Text</label>
            <textarea
              value={formData.footerText}
              onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Optional: Text für den Fußbereich (z.B. Bankverbindung, AGB)"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isDefault"
              checked={formData.isDefault}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700">
              Als Standard-Template verwenden
            </label>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name}
              className="flex-1 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Wird gespeichert...' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>

      {/* Vorschau */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Vorschau</h3>
        <TemplatePreview template={formData} />
      </div>
    </div>
  )
}

