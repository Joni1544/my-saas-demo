/**
 * Kundenverwaltung (CRM Lite)
 * Features: Liste, Suche, Filter, Tags, Historie, Archivierung
 */
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Customer {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  address: string | null
  notes: string | null
  tags: string[]
  isArchived: boolean
  lastAppointment: string | null
  appointmentCount: number
  createdAt: string
}

const AVAILABLE_TAGS = ['Normal', 'VIP', 'Problemkunde', 'No-Show', 'Neu', 'Stammkunde', 'Wichtig']

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedTag, setSelectedTag] = useState<string>('')
  const [showArchived, setShowArchived] = useState(false)
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'appointmentCount'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetchCustomers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, selectedTag, showArchived, sortBy, sortOrder])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (selectedTag) params.append('tag', selectedTag)
      params.append('archived', showArchived.toString())
      params.append('sortBy', sortBy)
      params.append('sortOrder', sortOrder)

      const response = await fetch(`/api/customers?${params.toString()}`)
      if (!response.ok) throw new Error('Fehler beim Laden der Kunden')
      
      const data = await response.json()
      setCustomers(data.customers || [])
    } catch (error) {
      console.error('Fehler:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleArchive = async (id: string) => {
    if (!confirm('Kunde wirklich archivieren?')) return

    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Fehler beim Archivieren')
      fetchCustomers()
    } catch (error) {
      console.error('Fehler:', error)
      alert('Fehler beim Archivieren')
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nie'
    return new Date(dateString).toLocaleDateString('de-DE')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Kundenverwaltung</h1>
            <p className="mt-2 text-gray-600">Verwalten Sie Ihre Kunden, Tags und Notizen</p>
          </div>
          <Link
            href="/dashboard/customers/new"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            + Neuer Kunde
          </Link>
        </div>

        {/* Filter & Suche */}
        <div className="mb-6 space-y-4 rounded-lg bg-white p-4 shadow">
          {/* Suche */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700">
              Suche
            </label>
            <input
              type="text"
              id="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, Email, Telefon..."
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-black shadow-sm transition-all placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Filter Row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Tag Filter */}
            <div>
              <label htmlFor="tag" className="block text-sm font-medium text-gray-700">
                Tag
              </label>
              <select
                id="tag"
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-black shadow-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">Alle Tags</option>
                {AVAILABLE_TAGS.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>

            {/* Sortierung */}
            <div>
              <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700">
                Sortieren nach
              </label>
              <select
                id="sortBy"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'createdAt' | 'appointmentCount')}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-black shadow-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="createdAt">Erstellt</option>
                <option value="name">Name</option>
                <option value="appointmentCount">Termine</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700">
                Reihenfolge
              </label>
              <select
                id="sortOrder"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-black shadow-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="desc">Absteigend</option>
                <option value="asc">Aufsteigend</option>
              </select>
            </div>
          </div>

          {/* Archiviert Toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="archived"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="archived" className="ml-2 text-sm text-gray-700">
              Archivierte Kunden anzeigen
            </label>
          </div>
        </div>

        {/* Kunden Liste */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Lade Kunden...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center shadow">
            <p className="text-gray-500">Keine Kunden gefunden</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {customers.map((customer) => (
              <div
                key={customer.id}
                className="rounded-lg bg-white p-6 shadow hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {customer.firstName} {customer.lastName}
                    </h3>
                    {customer.isArchived && (
                      <span className="mt-1 inline-block rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
                        Archiviert
                      </span>
                    )}
                  </div>
                </div>

                {/* Kontakt */}
                <div className="mb-4 space-y-1 text-sm text-gray-600">
                  {customer.email && (
                    <p>
                      <span className="font-medium">Email:</span> {customer.email}
                    </p>
                  )}
                  {customer.phone && (
                    <p>
                      <span className="font-medium">Tel:</span> {customer.phone}
                    </p>
                  )}
                </div>

                {/* Tags */}
                {customer.tags.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {customer.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-block rounded bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Historie */}
                <div className="mb-4 border-t pt-4 text-sm text-gray-600">
                  <p>
                    <span className="font-medium">Termine:</span> {customer.appointmentCount}
                  </p>
                  <p>
                    <span className="font-medium">Letzter Termin:</span>{' '}
                    {formatDate(customer.lastAppointment)}
                  </p>
                </div>

                {/* Notizen Vorschau */}
                {customer.notes && (
                  <div className="mb-4 border-t pt-4">
                    <p className="text-sm text-gray-600 line-clamp-2">{customer.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 border-t pt-4">
                  <Link
                    href={`/dashboard/customers/${customer.id}`}
                    className="flex-1 rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-indigo-500"
                  >
                    Details
                  </Link>
                  <button
                    onClick={() => handleArchive(customer.id)}
                    className="rounded-md bg-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300"
                  >
                    {customer.isArchived ? 'Wiederherstellen' : 'Archivieren'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

