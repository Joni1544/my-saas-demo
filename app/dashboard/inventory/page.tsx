/**
 * Inventar-Verwaltung
 * Liste aller Inventar-Artikel mit Filter und Warnungen
 */
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { selectBase } from '@/lib/inputStyles'

interface InventoryItem {
  id: string
  name: string
  quantity: number
  minThreshold: number
  category: string | null
  pricePerUnit: number | null
  link: string | null
  manufacturer: string | null
  lastUpdated: string
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [categories, setCategories] = useState<string[]>([])
  const [editingQuantity, setEditingQuantity] = useState<{ id: string; value: string } | null>(null)

  useEffect(() => {
    fetchItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter])

  const fetchItems = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (categoryFilter) params.append('category', categoryFilter)

      const response = await fetch(`/api/inventory?${params.toString()}`)
      if (!response.ok) throw new Error('Fehler beim Laden der Artikel')
      const data = await response.json()
      setItems(data.items || [])
      
      // Extrahiere eindeutige Kategorien
      const uniqueCategories = Array.from(new Set(data.items.map((item: InventoryItem) => item.category).filter(Boolean)))
      setCategories(uniqueCategories as string[])
    } catch (error) {
      console.error('Fehler:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Artikel wirklich löschen?')) return

    try {
      const response = await fetch(`/api/inventory/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Fehler beim Löschen')
      fetchItems()
    } catch (error) {
      console.error('Fehler:', error)
      alert('Fehler beim Löschen')
    }
  }

  const handleQuickUpdate = async (id: string, delta: number) => {
    try {
      const item = items.find(i => i.id === id)
      if (!item) return

      const newQuantity = Math.max(0, item.quantity + delta)
      
      const response = await fetch(`/api/inventory/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity: newQuantity,
        }),
      })
      if (!response.ok) throw new Error('Fehler beim Aktualisieren')
      fetchItems()
      setEditingQuantity(null)
    } catch (error) {
      console.error('Fehler:', error)
      alert('Fehler beim Aktualisieren')
    }
  }

  const handleQuantityChange = async (id: string, newQuantity: number) => {
    try {
      const quantity = Math.max(0, Math.floor(newQuantity))
      
      const response = await fetch(`/api/inventory/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity,
        }),
      })
      if (!response.ok) throw new Error('Fehler beim Aktualisieren')
      fetchItems()
      setEditingQuantity(null)
    } catch (error) {
      console.error('Fehler:', error)
      alert('Fehler beim Aktualisieren')
    }
  }

  const isLowStock = (item: InventoryItem) => {
    return item.quantity < item.minThreshold
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventar</h1>
            <p className="mt-2 text-gray-600">Verwalten Sie Ihre Inventar-Artikel</p>
          </div>
          <Link
            href="/dashboard/inventory/new"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            + Neuer Artikel
          </Link>
        </div>

        {/* Filter */}
        <div className="mb-6 rounded-lg bg-white p-4 shadow">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Kategorie
              </label>
              <select
                id="category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={`mt-1 ${selectBase}`}
              >
                <option value="">Alle Kategorien</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Inventar Liste */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Lade Inventar...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center shadow">
            <p className="text-gray-500">Keine Artikel gefunden</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Kategorie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Bestand
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Mindestbestand
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Preis/Unit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {items.map((item) => {
                  const lowStock = isLowStock(item)
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-gray-50 ${lowStock ? 'bg-yellow-50' : ''}`}
                    >
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex flex-col">
                          <div className="flex items-center">
                            {lowStock && (
                              <span className="mr-2 text-yellow-600" title="Niedriger Bestand">
                                ⚠️
                              </span>
                            )}
                            <span className={`text-sm font-medium ${lowStock ? 'text-yellow-800' : 'text-gray-900'}`}>
                              {item.name}
                            </span>
                          </div>
                          {item.manufacturer && (
                            <span className="text-xs text-gray-500 mt-1">{item.manufacturer}</span>
                          )}
                          {item.link && (
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-600 hover:text-indigo-800 mt-1"
                            >
                              🔗 Link öffnen
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {item.category || '–'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-2">
                          {editingQuantity?.id === item.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                value={editingQuantity.value}
                                onChange={(e) => setEditingQuantity({ id: item.id, value: e.target.value })}
                                onBlur={() => {
                                  const value = parseInt(editingQuantity.value) || 0
                                  handleQuantityChange(item.id, value)
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const value = parseInt(editingQuantity.value) || 0
                                    handleQuantityChange(item.id, value)
                                  } else if (e.key === 'Escape') {
                                    setEditingQuantity(null)
                                  }
                                }}
                                autoFocus
                                className="w-20 rounded border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                              <button
                                onClick={() => {
                                  const value = parseInt(editingQuantity.value) || 0
                                  handleQuantityChange(item.id, value)
                                }}
                                className="rounded bg-indigo-600 px-2 py-1 text-xs text-white hover:bg-indigo-700"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => setEditingQuantity(null)}
                                className="rounded bg-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-300"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className={`text-sm font-semibold ${lowStock ? 'text-yellow-600' : 'text-gray-900'}`}>
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => {
                                  const newValue = Math.max(0, item.quantity - 1)
                                  handleQuantityChange(item.id, newValue)
                                }}
                                className="rounded bg-red-100 px-2 py-1 text-xs text-red-700 hover:bg-red-200 font-semibold"
                                title="Verbraucht 1"
                              >
                                -1
                              </button>
                              <button
                                onClick={() => {
                                  const newValue = item.quantity + 1
                                  handleQuantityChange(item.id, newValue)
                                }}
                                className="rounded bg-green-100 px-2 py-1 text-xs text-green-700 hover:bg-green-200 font-semibold"
                                title="Hinzufügen 1"
                              >
                                +1
                              </button>
                              <button
                                onClick={() => setEditingQuantity({ id: item.id, value: item.quantity.toString() })}
                                className="rounded bg-indigo-100 px-2 py-1 text-xs text-indigo-700 hover:bg-indigo-200 font-semibold"
                                title="Menge bearbeiten"
                              >
                                ✎
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {item.minThreshold}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {item.pricePerUnit
                          ? new Intl.NumberFormat('de-DE', {
                              style: 'currency',
                              currency: 'EUR',
                            }).format(item.pricePerUnit)
                          : '–'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                        <div className="flex items-center justify-end gap-4">
                          <Link
                            href={`/dashboard/inventory/${item.id}/edit`}
                            className="text-indigo-600 hover:text-indigo-900 font-medium"
                          >
                            Bearbeiten
                          </Link>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-900 font-medium"
                          >
                            Löschen
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

