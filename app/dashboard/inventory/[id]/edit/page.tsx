/**
 * Inventar-Artikel bearbeiten
 */
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { inputBase } from '@/lib/inputStyles'

interface InventoryItem {
  id: string
  name: string
  quantity: number
  minThreshold: number
  category: string | null
  pricePerUnit: number | null
  link: string | null
  manufacturer: string | null
}

export default function EditInventoryItemPage() {
  const params = useParams()
  const router = useRouter()
  const itemId = params.id as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    quantity: '0',
    minThreshold: '0',
    category: '',
    pricePerUnit: '',
    link: '',
    manufacturer: '',
  })

  useEffect(() => {
    if (itemId) {
      fetchItem()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId])

  const fetchItem = async () => {
    try {
      const response = await fetch(`/api/inventory/${itemId}`)
      if (!response.ok) throw new Error('Artikel nicht gefunden')
      const data = await response.json()
      const item: InventoryItem = data.item
      setFormData({
        name: item.name,
        quantity: item.quantity.toString(),
        minThreshold: item.minThreshold.toString(),
        category: item.category || '',
        pricePerUnit: item.pricePerUnit ? item.pricePerUnit.toString() : '',
        link: item.link || '',
        manufacturer: item.manufacturer || '',
      })
    } catch (error) {
      console.error('Fehler:', error)
      router.push('/dashboard/inventory')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/inventory/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          quantity: parseInt(formData.quantity) || 0,
          minThreshold: parseInt(formData.minThreshold) || 0,
          pricePerUnit: formData.pricePerUnit ? parseFloat(formData.pricePerUnit) : null,
          category: formData.category || null,
          link: formData.link || null,
          manufacturer: formData.manufacturer || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Fehler beim Speichern')
      }

      router.push('/dashboard/inventory')
    } catch (error: unknown) {
      console.error('Fehler:', error)
      alert((error instanceof Error ? error.message : 'Fehler beim Speichern'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Lade Artikel...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/dashboard/inventory"
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            ← Zurück zur Übersicht
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">Artikel bearbeiten</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-white p-6 shadow">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`mt-1 ${inputBase}`}
              placeholder="Artikel-Name..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Bestand</label>
              <input
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className={`mt-1 ${inputBase}`}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mindestbestand</label>
              <input
                type="number"
                min="0"
                value={formData.minThreshold}
                onChange={(e) => setFormData({ ...formData, minThreshold: e.target.value })}
                className={`mt-1 ${inputBase}`}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Kategorie</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className={`mt-1 ${inputBase}`}
                placeholder="z.B. Material, Werkzeug..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Preis pro Einheit (€)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.pricePerUnit}
                onChange={(e) => setFormData({ ...formData, pricePerUnit: e.target.value })}
                className={`mt-1 ${inputBase}`}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Link (optional)</label>
              <input
                type="url"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                className={`mt-1 ${inputBase}`}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Firma/Hersteller (optional)</label>
              <input
                type="text"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                className={`mt-1 ${inputBase}`}
                placeholder="z.B. Firma XYZ..."
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Link
              href="/dashboard/inventory"
              className="flex-1 rounded-md bg-gray-200 px-4 py-2 text-center text-sm font-semibold text-gray-700 hover:bg-gray-300"
            >
              Abbrechen
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {saving ? 'Wird gespeichert...' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

