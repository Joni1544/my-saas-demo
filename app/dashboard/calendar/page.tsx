/**
 * Kalender-Seite
 * Tag/Woche/Monat Views mit Filtern
 */
'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
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
  getWeek,
  setWeek,
} from 'date-fns'
import Link from 'next/link'
import DateSelector from '@/components/DateSelector'
import DaySelector from '@/components/DaySelector'
import WeekSelector from '@/components/WeekSelector'

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
  const searchParams = useSearchParams()
  const dateParam = searchParams.get('date')
  const now = new Date()
  
  // Wenn ein Datum in der URL ist, wechsle zur Tagesansicht
  const initialViewMode: ViewMode = dateParam ? 'day' : 'month'
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [customers, setCustomers] = useState<Array<{ id: string; firstName: string; lastName: string }>>([])
  const [loading, setLoading] = useState(true)
  
  // Einheitliche Datumsauswahl-States
  // Wenn ein Datum in der URL ist, verwende es
  const initialDate = dateParam ? new Date(dateParam) : now
  const [daySelection, setDaySelection] = useState({
    day: initialDate.getDate(),
    month: initialDate.getMonth(),
    year: initialDate.getFullYear(),
  })
  const [weekSelection, setWeekSelection] = useState({
    week: getWeek(now, { weekStartsOn: 1 }),
    year: now.getFullYear(),
  })
  const [monthSelection, setMonthSelection] = useState({
    month: now.getMonth(),
    year: now.getFullYear(),
  })
  
  // Filter
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('')
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  
  // Berechne currentDate basierend auf viewMode und Selection
  const getCurrentDate = (): Date => {
    switch (viewMode) {
      case 'day':
        return new Date(daySelection.year, daySelection.month, daySelection.day)
      case 'week':
        // Berechne Datum für die ausgewählte Woche
        const yearStart = new Date(weekSelection.year, 0, 1)
        const weekStart = startOfWeek(setWeek(yearStart, weekSelection.week, { weekStartsOn: 1 }), { weekStartsOn: 1 })
        return weekStart
      case 'month':
        return new Date(monthSelection.year, monthSelection.month, 1)
      default:
        return now
    }
  }
  
  const currentDate = getCurrentDate()

  useEffect(() => {
    fetchEmployees()
    fetchCustomers()
  }, [])

  useEffect(() => {
    fetchAppointments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, daySelection, weekSelection, monthSelection, selectedEmployeeId, selectedCustomerId, selectedStatus])

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

  const goToToday = () => {
    const today = new Date()
    setDaySelection({
      day: today.getDate(),
      month: today.getMonth(),
      year: today.getFullYear(),
    })
    setWeekSelection({
      week: getWeek(today, { weekStartsOn: 1 }),
      year: today.getFullYear(),
    })
    setMonthSelection({
      month: today.getMonth(),
      year: today.getFullYear(),
    })
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
              className={`min-h-[100px] border border-gray-200 p-1 cursor-pointer hover:bg-indigo-50 transition-colors ${
                !isCurrentMonth ? 'bg-gray-50' : ''
              } ${isToday ? 'bg-blue-50 ring-2 ring-blue-500' : ''}`}
              onClick={(e) => {
                // Wenn auf einen Termin geklickt wurde, nicht zur Tagesansicht wechseln
                if ((e.target as HTMLElement).closest('.appointment-item')) {
                  return
                }
                // Wechsle zur Tagesansicht für diesen Tag
                const dateStr = format(day, 'yyyy-MM-dd')
                window.location.href = `/dashboard/calendar?date=${dateStr}`
              }}
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
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedAppointment(apt)
                    }}
                    className="appointment-item rounded px-1 py-0.5 text-xs text-white cursor-pointer hover:opacity-80 truncate"
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

            {/* Einheitliche Datumsauswahl */}
            <div className="flex items-center gap-4">
              <button
                onClick={goToToday}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Heute
              </button>
              
              {/* Tag-Auswahl */}
              {viewMode === 'day' && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Datum:</span>
                  <DaySelector
                    value={daySelection}
                    onChange={(value) => setDaySelection(value)}
                    minYear={2020}
                    maxYear={2080}
                  />
                </div>
              )}
              
              {/* Woche-Auswahl */}
              {viewMode === 'week' && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Woche:</span>
                  <WeekSelector
                    value={weekSelection}
                    onChange={(value) => setWeekSelection(value)}
                    minYear={2020}
                    maxYear={2080}
                  />
                </div>
              )}
              
              {/* Monat-Auswahl */}
              {viewMode === 'month' && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Monat:</span>
                  <DateSelector
                    value={monthSelection}
                    onChange={(value) => setMonthSelection(value)}
                    minYear={2020}
                    maxYear={2080}
                  />
                </div>
              )}
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

