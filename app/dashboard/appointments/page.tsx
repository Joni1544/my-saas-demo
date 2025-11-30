/**
 * Termine-Verwaltung
 * Liste aller Termine mit Filter und Suche
 */
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { inputBase, selectBase } from '@/lib/inputStyles'

interface Appointment {
  id: string
  title: string
  description: string | null
  notes: string | null
  startTime: string
  endTime: string
  status: string
  price: number | null
  color: string | null
  customer: {
    id: string
    firstName: string
    lastName: string
  } | null
  employee: {
    id: string
    user: {
      name: string | null
      email: string
    }
    color: string | null
  } | null
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: '#3B82F6',
  ACCEPTED: '#10B981',
  CANCELLED: '#EF4444',
  RESCHEDULED: '#F59E0B',
  COMPLETED: '#6B7280',
}

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Offen',
  ACCEPTED: 'Angenommen',
  CANCELLED: 'Storniert',
  RESCHEDULED: 'Verschoben',
  COMPLETED: 'Abgeschlossen',
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [dateFilter, setDateFilter] = useState<string>('')

  useEffect(() => {
    fetchAppointments()
  }, [statusFilter, dateFilter])

  // Beim Laden der Seite prüfen, ob wir von einer neuen Termin-Erstellung kommen
  useEffect(() => {
    // Prüfe URL-Parameter für Refresh
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('refresh') === 'true') {
      fetchAppointments()
      // Entferne Parameter aus URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      if (dateFilter) {
        const date = new Date(dateFilter)
        const startDate = new Date(date.setHours(0, 0, 0, 0))
        const endDate = new Date(date.setHours(23, 59, 59, 999))
        params.append('startDate', startDate.toISOString())
        params.append('endDate', endDate.toISOString())
      } else {
        // Standard: Aktueller Monat + nächste 2 Monate (damit neue Termine sichtbar sind)
        const now = new Date()
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 3, 0, 23, 59, 59)
        params.append('startDate', monthStart.toISOString())
        params.append('endDate', monthEnd.toISOString())
      }

      const response = await fetch(`/api/appointments?${params.toString()}`)
      if (!response.ok) throw new Error('Fehler beim Laden der Termine')
      const data = await response.json()
      
      let filtered = data.appointments || []
      if (search) {
        const searchLower = search.toLowerCase()
        filtered = filtered.filter((apt: Appointment) =>
          apt.title.toLowerCase().includes(searchLower) ||
          apt.customer?.firstName.toLowerCase().includes(searchLower) ||
          apt.customer?.lastName.toLowerCase().includes(searchLower) ||
          apt.employee?.user.name?.toLowerCase().includes(searchLower) ||
          apt.employee?.user.email.toLowerCase().includes(searchLower)
        )
      }
      
      setAppointments(filtered)
    } catch (error) {
      console.error('Fehler:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Termin wirklich löschen?')) return

    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Fehler beim Löschen')
      fetchAppointments()
    } catch (error) {
      console.error('Fehler:', error)
      alert('Fehler beim Löschen')
    }
  }

  const getAppointmentColor = (appointment: Appointment) => {
    if (appointment.color) return appointment.color
    if (appointment.employee?.color) return appointment.employee.color
    return STATUS_COLORS[appointment.status] || '#3B82F6'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Termine</h1>
            <p className="mt-2 text-gray-600">Verwalten Sie alle Ihre Termine</p>
          </div>
          <Link
            href="/dashboard/appointments/new"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            + Neuer Termin
          </Link>
        </div>

        {/* Filter */}
        <div className="mb-6 space-y-4 rounded-lg bg-white p-4 shadow">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                placeholder="Titel, Kunde, Mitarbeiter..."
                className={`mt-1 ${inputBase}`}
              />
            </div>

            {/* Status Filter */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`mt-1 ${inputBase}`}
              >
                <option value="">Alle Status</option>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Datum Filter */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                Datum
              </label>
              <input
                type="date"
                id="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className={`mt-1 ${inputBase}`}
              />
            </div>
          </div>
        </div>

        {/* Termine Liste */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Lade Termine...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center shadow">
            <p className="text-gray-500">Keine Termine gefunden</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="rounded-lg bg-white p-6 shadow hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: getAppointmentColor(appointment) }}
                      />
                      <h3 className="text-lg font-semibold text-gray-900">{appointment.title}</h3>
                      <span
                        className="rounded px-2 py-1 text-xs font-medium text-white"
                        style={{ backgroundColor: getAppointmentColor(appointment) }}
                      >
                        {STATUS_LABELS[appointment.status] || appointment.status}
                      </span>
                    </div>

                    <div className="ml-7 space-y-1 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">Zeit:</span>{' '}
                        {format(new Date(appointment.startTime), 'EEEE, d. MMMM yyyy, HH:mm')} -{' '}
                        {format(new Date(appointment.endTime), 'HH:mm')}
                      </p>
                      {appointment.customer && (
                        <p>
                          <span className="font-medium">Kunde:</span> {appointment.customer.firstName}{' '}
                          {appointment.customer.lastName}
                        </p>
                      )}
                      {appointment.employee && (
                        <p>
                          <span className="font-medium">Mitarbeiter:</span>{' '}
                          {appointment.employee.user.name || appointment.employee.user.email}
                        </p>
                      )}
                      {appointment.price && (
                        <p>
                          <span className="font-medium">Preis:</span>{' '}
                          <span className="font-semibold text-gray-900">
                            {Number(appointment.price).toFixed(2)} €
                          </span>
                        </p>
                      )}
                      {appointment.description && (
                        <p className="text-gray-500 line-clamp-2">{appointment.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/appointments/${appointment.id}`}
                      className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                    >
                      Bearbeiten
                    </Link>
                    <button
                      onClick={() => handleDelete(appointment.id)}
                      className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
                    >
                      Löschen
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

