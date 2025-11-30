/**
 * Kalender-Seite
 * Tag/Woche/Monat Views mit Filtern
 */
'use client'

import { useState, useEffect } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isSameWeek,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  getWeek,
} from 'date-fns'
import Link from 'next/link'

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

interface Employee {
  id: string
  user: {
    name: string | null
    email: string
  }
  color: string | null
}

type ViewMode = 'day' | 'week' | 'month'

const STATUS_COLORS: Record<string, string> = {
  OPEN: '#3B82F6',        // Blau
  ACCEPTED: '#10B981',    // Grün
  CANCELLED: '#EF4444',   // Rot
  RESCHEDULED: '#F59E0B', // Orange
  COMPLETED: '#6B7280',   // Grau
}

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [customers, setCustomers] = useState<Array<{ id: string; firstName: string; lastName: string }>>([])
  const [loading, setLoading] = useState(true)
  
  // Filter
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('')
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [jumpToDate, setJumpToDate] = useState('')

  useEffect(() => {
    fetchEmployees()
    fetchCustomers()
  }, [])

  useEffect(() => {
    fetchAppointments()
  }, [currentDate, viewMode, selectedEmployeeId, selectedCustomerId, selectedStatus])

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees')
      if (response.ok) {
        const data = await response.json()
        setEmployees(data.employees || [])
      }
    } catch (error) {
      console.error('Fehler beim Laden der Mitarbeiter:', error)
    }
  }

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers?archived=false')
      if (response.ok) {
        const data = await response.json()
        setCustomers(data.customers || [])
      }
    } catch (error) {
      console.error('Fehler beim Laden der Kunden:', error)
    }
  }

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      let startDate: Date
      let endDate: Date

      switch (viewMode) {
        case 'day':
          startDate = startOfDay(currentDate)
          endDate = endOfDay(currentDate)
          break
        case 'week':
          startDate = startOfWeek(currentDate, { weekStartsOn: 1 })
          endDate = endOfWeek(currentDate, { weekStartsOn: 1 })
          break
        case 'month':
          startDate = startOfMonth(currentDate)
          endDate = endOfMonth(currentDate)
          break
      }

      const params = new URLSearchParams()
      params.append('startDate', startDate.toISOString())
      params.append('endDate', endDate.toISOString())
      if (selectedEmployeeId) params.append('employeeId', selectedEmployeeId)
      if (selectedCustomerId) params.append('customerId', selectedCustomerId)
      if (selectedStatus) params.append('status', selectedStatus)

      const response = await fetch(`/api/appointments?${params.toString()}`)
      if (!response.ok) throw new Error('Fehler beim Laden der Termine')
      const data = await response.json()
      setAppointments(data.appointments || [])
    } catch (error) {
      console.error('Fehler:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAppointmentColor = (appointment: Appointment) => {
    if (appointment.color) return appointment.color
    if (appointment.employee?.color) return appointment.employee.color
    return STATUS_COLORS[appointment.status] || '#3B82F6'
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    let newDate: Date
    switch (viewMode) {
      case 'day':
        newDate = direction === 'next' ? addDays(currentDate, 1) : subDays(currentDate, 1)
        break
      case 'week':
        newDate = direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1)
        break
      case 'month':
        newDate = direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1)
        break
      default:
        newDate = currentDate
    }
    
    // Prüfe ob Datum bis 2035
    if (newDate.getFullYear() <= 2035) {
      setCurrentDate(newDate)
    }
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const handleJumpToDate = () => {
    if (jumpToDate) {
      const date = new Date(jumpToDate)
      if (!isNaN(date.getTime())) {
        // Prüfe ob Datum bis 2035
        if (date.getFullYear() <= 2035) {
          setCurrentDate(date)
          setJumpToDate('')
        } else {
          alert('Datum darf nicht nach 2035 sein')
        }
      }
    }
  }

  const handleMonthYearChange = (month: number, year: number) => {
    if (year <= 2035) {
      const newDate = new Date(year, month, 1)
      setCurrentDate(newDate)
    }
  }

  // Render Functions
  const renderDayView = () => {
    const dayAppointments = appointments.filter((apt) =>
      isSameDay(new Date(apt.startTime), currentDate)
    )

    const hours = Array.from({ length: 24 }, (_, i) => i)

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-24 gap-1">
          <div className="col-span-1 text-xs text-gray-500 font-medium">Zeit</div>
          <div className="col-span-23">
            {hours.map((hour) => {
              const hourAppointments = dayAppointments.filter((apt) => {
                const aptHour = new Date(apt.startTime).getHours()
                return aptHour === hour
              })

              return (
                <div key={hour} className="border-b border-gray-200 min-h-[60px] relative">
                  <div className="absolute left-0 top-0 text-xs text-gray-400 px-2">
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                  <div className="ml-16 space-y-1 py-1">
                    {hourAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        onClick={() => setSelectedAppointment(apt)}
                        className="rounded px-2 py-1 text-xs text-white cursor-pointer hover:opacity-80"
                        style={{ backgroundColor: getAppointmentColor(apt) }}
                      >
                        <div className="font-medium">{apt.title}</div>
                        <div className="text-xs opacity-90">
                          {format(new Date(apt.startTime), 'HH:mm')} - {format(new Date(apt.endTime), 'HH:mm')}
                        </div>
                        {apt.customer && (
                          <div className="text-xs opacity-90">
                            {apt.customer.firstName} {apt.customer.lastName}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })
    const hours = Array.from({ length: 24 }, (_, i) => i)

    return (
      <div className="overflow-x-auto">
        <div className="grid grid-cols-8 gap-1 min-w-[1200px]">
          <div className="col-span-1"></div>
          {weekDays.map((day) => (
            <div key={day.toISOString()} className="text-center text-sm font-medium text-gray-700">
              <div>{format(day, 'EEE')}</div>
              <div className={isSameDay(day, new Date()) ? 'text-indigo-600 font-bold' : ''}>
                {format(day, 'd.M.')}
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-8 gap-1 min-w-[1200px]">
          <div className="col-span-1">
            {hours.map((hour) => (
              <div key={hour} className="h-16 border-b border-gray-200 text-xs text-gray-400 px-2">
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>
          {weekDays.map((day) => {
            const dayAppointments = appointments.filter((apt) =>
              isSameDay(new Date(apt.startTime), day)
            )

            return (
              <div key={day.toISOString()} className="border-l border-gray-200">
                {hours.map((hour) => {
                  const hourAppointments = dayAppointments.filter((apt) => {
                    const aptHour = new Date(apt.startTime).getHours()
                    return aptHour === hour
                  })

                  return (
                    <div key={hour} className="h-16 border-b border-gray-200 relative">
                      {hourAppointments.map((apt) => (
                        <div
                          key={apt.id}
                          onClick={() => setSelectedAppointment(apt)}
                          className="absolute inset-x-1 rounded px-1 py-0.5 text-xs text-white cursor-pointer hover:opacity-80 z-10"
                          style={{
                            backgroundColor: getAppointmentColor(apt),
                            top: `${(new Date(apt.startTime).getMinutes() / 60) * 100}%`,
                            height: `${((new Date(apt.endTime).getTime() - new Date(apt.startTime).getTime()) / (1000 * 60 * 60)) * 100}%`,
                          }}
                        >
                          <div className="font-medium truncate">{apt.title}</div>
                          {apt.customer && (
                            <div className="text-xs opacity-90 truncate">
                              {apt.customer.firstName} {apt.customer.lastName}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

    return (
      <div className="grid grid-cols-7 gap-1">
        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-700 py-2">
            {day}
          </div>
        ))}
        {days.map((day) => {
          const dayAppointments = appointments.filter((apt) =>
            isSameDay(new Date(apt.startTime), day)
          )
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isToday = isSameDay(day, new Date())

          return (
            <div
              key={day.toISOString()}
              className={`min-h-[100px] border border-gray-200 p-1 ${
                !isCurrentMonth ? 'bg-gray-50' : ''
              } ${isToday ? 'bg-blue-50 ring-2 ring-blue-500' : ''}`}
            >
              <div
                className={`text-sm mb-1 ${
                  isToday ? 'font-bold text-blue-700' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                }`}
              >
                {format(day, 'd')}
              </div>
              <div className="space-y-1">
                {dayAppointments.slice(0, 3).map((apt) => (
                  <div
                    key={apt.id}
                    onClick={() => setSelectedAppointment(apt)}
                    className="rounded px-1 py-0.5 text-xs text-white cursor-pointer hover:opacity-80 truncate"
                    style={{ backgroundColor: getAppointmentColor(apt) }}
                    title={apt.title}
                  >
                    {format(new Date(apt.startTime), 'HH:mm')} {apt.title}
                  </div>
                ))}
                {dayAppointments.length > 3 && (
                  <div className="text-xs text-gray-500 px-1">
                    +{dayAppointments.length - 3} weitere
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Kalender</h1>
          <Link
            href="/dashboard/appointments/new"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            + Neuer Termin
          </Link>
        </div>

        {/* Controls */}
        <div className="mb-6 rounded-lg bg-white p-4 shadow">
          <div className="flex flex-wrap items-center gap-4">
            {/* View Mode */}
            <div className="flex rounded-md border border-gray-300">
              {(['day', 'week', 'month'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-4 py-2 text-sm font-medium ${
                    viewMode === mode
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  } ${mode === 'day' ? 'rounded-l-md' : ''} ${mode === 'month' ? 'rounded-r-md' : ''}`}
                >
                  {mode === 'day' ? 'Tag' : mode === 'week' ? 'Woche' : 'Monat'}
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateDate('prev')}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                ←
              </button>
              <button
                onClick={goToToday}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Heute
              </button>
              <button
                onClick={() => navigateDate('next')}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                →
              </button>
              <div className="ml-4 flex items-center gap-2">
                <span className="text-lg font-semibold text-gray-900">
                  {viewMode === 'day'
                    ? format(currentDate, 'EEEE, d. MMMM yyyy', { locale: undefined })
                    : viewMode === 'week'
                    ? `Woche ${getWeek(currentDate)} - ${format(currentDate, 'MMMM yyyy')}`
                    : format(currentDate, 'MMMM yyyy')}
                </span>
                
                {/* Monat/Jahr Dropdown (nur für Monatsansicht) */}
                {viewMode === 'month' && (
                  <div className="flex gap-2">
                    <label htmlFor="monthSelect" className="sr-only">
                      Monat auswählen
                    </label>
                    <select
                      id="monthSelect"
                      value={currentDate.getMonth()}
                      onChange={(e) => handleMonthYearChange(parseInt(e.target.value), currentDate.getFullYear())}
                      className={`${selectBase} text-sm`}
                      aria-label="Monat auswählen"
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i} value={i}>
                          {format(new Date(2024, i, 1), 'MMMM')}
                        </option>
                      ))}
                    </select>
                    <label htmlFor="yearSelect" className="sr-only">
                      Jahr auswählen
                    </label>
                    <select
                      id="yearSelect"
                      value={currentDate.getFullYear()}
                      onChange={(e) => handleMonthYearChange(currentDate.getMonth(), parseInt(e.target.value))}
                      className={`${selectBase} text-sm`}
                      aria-label="Jahr auswählen"
                    >
                      {Array.from({ length: 2035 - 2020 + 1 }, (_, i) => {
                        const year = 2020 + i
                        return (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        )
                      })}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Jump to Date */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={jumpToDate}
                onChange={(e) => setJumpToDate(e.target.value)}
                max="2035-12-31"
                className={`${inputBase} text-sm`}
                placeholder="Zu Datum springen"
              />
              <button
                onClick={handleJumpToDate}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
              >
                Springen
              </button>
            </div>

            {/* Filters */}
            <div className="ml-auto flex gap-2">
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                aria-label="Mitarbeiter filtern"
              >
                <option value="">Alle Mitarbeiter</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.user.name || emp.user.email}
                  </option>
                ))}
              </select>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                aria-label="Kunde filtern"
              >
                <option value="">Alle Kunden</option>
                {customers.map((cust) => (
                  <option key={cust.id} value={cust.id}>
                    {cust.firstName} {cust.lastName}
                  </option>
                ))}
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                aria-label="Status filtern"
              >
                <option value="">Alle Status</option>
                <option value="OPEN">Offen</option>
                <option value="ACCEPTED">Angenommen</option>
                <option value="CANCELLED">Storniert</option>
                <option value="RESCHEDULED">Verschoben</option>
                <option value="COMPLETED">Abgeschlossen</option>
              </select>
            </div>
          </div>
        </div>

        {/* Calendar View */}
        <div className="rounded-lg bg-white p-6 shadow">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Lade Termine...</p>
            </div>
          ) : (
            <>
              {viewMode === 'day' && renderDayView()}
              {viewMode === 'week' && renderWeekView()}
              {viewMode === 'month' && renderMonthView()}
            </>
          )}
        </div>

        {/* Appointment Detail Modal */}
        {selectedAppointment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-start justify-between">
                <h2 className="text-2xl font-bold text-gray-900">{selectedAppointment.title}</h2>
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-700">Zeit</div>
                  <div className="text-gray-900">
                    {format(new Date(selectedAppointment.startTime), 'EEEE, d. MMMM yyyy, HH:mm')} -{' '}
                    {format(new Date(selectedAppointment.endTime), 'HH:mm')}
                  </div>
                </div>

                {selectedAppointment.customer && (
                  <div>
                    <div className="text-sm font-medium text-gray-700">Kunde</div>
                    <div className="text-gray-900">
                      {selectedAppointment.customer.firstName} {selectedAppointment.customer.lastName}
                    </div>
                  </div>
                )}

                {selectedAppointment.employee && (
                  <div>
                    <div className="text-sm font-medium text-gray-700">Mitarbeiter</div>
                    <div className="text-gray-900">
                      {selectedAppointment.employee.user.name || selectedAppointment.employee.user.email}
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-sm font-medium text-gray-700">Status</div>
                  <span
                    className="inline-block rounded px-2 py-1 text-xs font-medium text-white"
                    style={{ backgroundColor: getAppointmentColor(selectedAppointment) }}
                  >
                    {selectedAppointment.status}
                  </span>
                </div>

                {selectedAppointment.price && (
                  <div>
                    <div className="text-sm font-medium text-gray-700">Preis</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {Number(selectedAppointment.price).toFixed(2)} €
                    </div>
                  </div>
                )}

                {selectedAppointment.description && (
                  <div>
                    <div className="text-sm font-medium text-gray-700">Beschreibung</div>
                    <div className="text-gray-900">{selectedAppointment.description}</div>
                  </div>
                )}

                {selectedAppointment.notes && (
                  <div>
                    <div className="text-sm font-medium text-gray-700">Notizen</div>
                    <div className="text-gray-900 whitespace-pre-wrap">{selectedAppointment.notes}</div>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t">
                  <Link
                    href={`/dashboard/appointments/${selectedAppointment.id}`}
                    className="flex-1 rounded-md bg-indigo-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-indigo-500"
                  >
                    Bearbeiten
                  </Link>
                  <button
                    onClick={() => setSelectedAppointment(null)}
                    className="flex-1 rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300"
                  >
                    Schließen
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

