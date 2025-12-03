/**
 * Termine-Verwaltung
 * Liste aller Termine mit Filter und Suche
 * NEU: Zeitfilter (Tag/Monat/Jahr) + Preis-Anzeige
 */
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { useSession } from 'next-auth/react'
import { inputBase } from '@/lib/inputStyles'
import DateSelector from '@/components/DateSelector'
import DaySelector from '@/components/DaySelector'
import { getEffectiveRole } from '@/lib/view-mode'

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
  NEEDS_REASSIGNMENT: '#F59E0B',
}

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Offen',
  ACCEPTED: 'Angenommen',
  CANCELLED: 'Storniert',
  RESCHEDULED: 'Verschoben',
  COMPLETED: 'Abgeschlossen',
  NEEDS_REASSIGNMENT: 'Neu zuzuweisen',
}

type TimeFilterMode = 'day' | 'month' | 'year'

export default function AppointmentsPage() {
  const { data: session } = useSession()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [employeeFilter, setEmployeeFilter] = useState<string>('')
  const now = new Date()
  const [timeFilterMode, setTimeFilterMode] = useState<TimeFilterMode>('month')
  const [dayFilter, setDayFilter] = useState<{ day: number; month: number; year: number }>({
    day: now.getDate(),
    month: now.getMonth(),
    year: now.getFullYear(),
  })
  const [monthFilter, setMonthFilter] = useState<{ month: number; year: number }>({
    month: now.getMonth(),
    year: now.getFullYear(),
  })
  const [yearFilter, setYearFilter] = useState<number>(now.getFullYear())
  const [employees, setEmployees] = useState<Array<{ id: string; user: { name: string | null; email: string } }>>([])
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null)
  
  // View-Mode für Admin-Toggle
  const getInitialViewMode = (): 'admin' | 'employee' => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('viewMode') as 'admin' | 'employee' | null
      return savedMode || 'admin'
    }
    return 'admin'
  }
  const [viewMode] = useState<'admin' | 'employee'>(getInitialViewMode)
  
  // Effektive Rolle bestimmen
  const effectiveRole = session?.user?.role ? getEffectiveRole(session.user.role, viewMode) : 'MITARBEITER'
  const isAdmin = effectiveRole === 'ADMIN'

  useEffect(() => {
    // Hole aktuelle Employee-ID für Mitarbeiter
    async function fetchCurrentEmployee() {
      if (effectiveRole === 'MITARBEITER' && session?.user?.id) {
        try {
          const response = await fetch('/api/employees')
          if (response.ok) {
            const data = await response.json()
            const currentEmployee = data.employees?.find(
              (emp: { user: { id: string } }) => emp.user.id === session.user.id
            )
            if (currentEmployee) {
              setCurrentEmployeeId(currentEmployee.id)
            }
          }
        } catch (error) {
          console.error('Fehler beim Laden der eigenen Employee-ID:', error)
        }
      }
    }
    
    if (isAdmin) {
      fetchEmployees()
    } else {
      fetchCurrentEmployee()
    }
  }, [isAdmin, effectiveRole, session?.user?.id])

  useEffect(() => {
    fetchAppointments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, employeeFilter, timeFilterMode, dayFilter, monthFilter, yearFilter])

  // Beim Laden der Seite prüfen, ob wir von einer neuen Termin-Erstellung kommen
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('refresh') === 'true') {
      fetchAppointments()
      window.history.replaceState({}, '', window.location.pathname)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees')
      if (response.ok) {
        const data = await response.json()
        setEmployees(data.employees || [])
      } else if (response.status === 403) {
        // Mitarbeiter können keine Mitarbeiterliste sehen - das ist OK
        setEmployees([])
      }
    } catch (error) {
      console.error('Fehler beim Laden der Mitarbeiter:', error)
      setEmployees([])
    }
  }

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (statusFilter) params.append('status', statusFilter)
      // Mitarbeiter-Filter nur für Admins
      if (employeeFilter && isAdmin) params.append('employeeId', employeeFilter)

      // Zeitfilter basierend auf Modus
      let startDate: Date
      let endDate: Date

      if (timeFilterMode === 'day') {
        const date = new Date(dayFilter.year, dayFilter.month, dayFilter.day)
        startDate = new Date(date.setHours(0, 0, 0, 0))
        endDate = new Date(date.setHours(23, 59, 59, 999))
      } else if (timeFilterMode === 'month') {
        startDate = new Date(monthFilter.year, monthFilter.month, 1)
        endDate = new Date(monthFilter.year, monthFilter.month + 1, 0, 23, 59, 59)
      } else if (timeFilterMode === 'year') {
        startDate = new Date(yearFilter, 0, 1)
        endDate = new Date(yearFilter, 11, 31, 23, 59, 59)
      } else {
        // Fallback: Aktueller Monat
        const now = new Date()
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      }

      params.append('startDate', startDate.toISOString())
      params.append('endDate', endDate.toISOString())

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

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === 0) return '–'
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
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
        <div className="mb-6 space-y-4 rounded-lg bg-white p-6 shadow">
          {/* Zeitfilter Tabs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zeitraum
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setTimeFilterMode('day')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  timeFilterMode === 'day'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Tag
              </button>
              <button
                onClick={() => setTimeFilterMode('month')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  timeFilterMode === 'month'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Monat
              </button>
              <button
                onClick={() => setTimeFilterMode('year')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  timeFilterMode === 'year'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Jahr
              </button>
            </div>
          </div>

          {/* Zeitfilter Inputs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {timeFilterMode === 'day' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Datum
                </label>
                <DaySelector
                  value={dayFilter}
                  onChange={(value) => setDayFilter(value)}
                  minYear={2020}
                  maxYear={2080}
                />
              </div>
            )}

            {timeFilterMode === 'month' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monat & Jahr
                </label>
                <DateSelector
                  value={monthFilter}
                  onChange={(value) => setMonthFilter(value)}
                />
              </div>
            )}

            {timeFilterMode === 'year' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jahr
                </label>
                <select
                  id="year"
                  value={yearFilter}
                  onChange={(e) => setYearFilter(parseInt(e.target.value))}
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {Array.from({ length: 80 }, (_, i) => 2000 + i).map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            )}

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

            {/* Mitarbeiter Filter - nur für Admins */}
            {isAdmin && (
              <div>
                <label htmlFor="employee" className="block text-sm font-medium text-gray-700">
                  Mitarbeiter
                </label>
                <select
                  id="employee"
                  value={employeeFilter}
                  onChange={(e) => setEmployeeFilter(e.target.value)}
                  className={`mt-1 ${inputBase}`}
                >
                  <option value="">Alle Mitarbeiter</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.user.name || emp.user.email}
                    </option>
                  ))}
                </select>
              </div>
            )}
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
                      {/* Preis nur für Admins oder eigene Termine */}
                      {(isAdmin || appointment.employee?.id === currentEmployeeId) && (
                        <p>
                          <span className="font-medium">Preis:</span>{' '}
                          <span className="font-semibold text-gray-900">
                            {formatCurrency(appointment.price)}
                          </span>
                        </p>
                      )}
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
                    {/* Löschen-Button nur für Admins oder eigene Termine */}
                    {(isAdmin || appointment.employee?.id === currentEmployeeId) && (
                      <button
                        onClick={() => handleDelete(appointment.id)}
                        className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
                      >
                        Löschen
                      </button>
                    )}
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
