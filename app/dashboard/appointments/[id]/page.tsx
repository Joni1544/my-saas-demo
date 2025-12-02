/**
 * Termin-Detail Seite
 * Bearbeiten und Anzeigen eines Termins
 */
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { inputBase, textareaBase } from '@/lib/inputStyles'

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

interface Customer {
  id: string
  firstName: string
  lastName: string
}

interface Employee {
  id: string
  user: {
    name: string | null
    email: string
  }
}

const STATUS_OPTIONS = [
  { value: 'OPEN', label: 'Offen' },
  { value: 'ACCEPTED', label: 'Angenommen' },
  { value: 'CANCELLED', label: 'Storniert' },
  { value: 'RESCHEDULED', label: 'Verschoben' },
  { value: 'COMPLETED', label: 'Abgeschlossen' },
]

const STATUS_COLORS: Record<string, string> = {
  OPEN: '#3B82F6',
  ACCEPTED: '#10B981',
  CANCELLED: '#EF4444',
  RESCHEDULED: '#F59E0B',
  COMPLETED: '#6B7280',
}

export default function AppointmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const appointmentId = params.id as string
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [userRole, setUserRole] = useState<'ADMIN' | 'MITARBEITER'>('ADMIN')
  const [isOwnAppointment, setIsOwnAppointment] = useState(false)
  const [availabilityError, setAvailabilityError] = useState<string | null>(null)
  const [adminOverride, setAdminOverride] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    notes: '',
    startTime: '',
    endTime: '',
    status: 'OPEN',
    price: '',
    customerId: '',
    employeeId: '',
  })

  useEffect(() => {
    async function fetchUserInfo() {
      try {
        const sessionRes = await fetch('/api/auth/session')
        const session = await sessionRes.json()
        const role = session?.user?.role || 'ADMIN'
        setUserRole(role)
      } catch (error) {
        console.error('Fehler beim Laden der Benutzerinfo:', error)
      }
    }
    
    fetchUserInfo()
  }, [])

  useEffect(() => {
    if (appointmentId && userRole) {
      fetchAppointment()
      fetchCustomers()
      fetchEmployees()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId, userRole])

  const formatDateTimeLocal = (dateString: string) => {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const fetchAppointment = async () => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`)
      if (!response.ok) throw new Error('Termin nicht gefunden')
      const data = await response.json()
      setAppointment(data.appointment)
      
      // Prüfe ob Mitarbeiter eigenen Termin sieht
      if (userRole === 'MITARBEITER') {
        const sessionRes = await fetch('/api/auth/session')
        const session = await sessionRes.json()
        const employeesRes = await fetch('/api/employees')
        if (employeesRes.ok) {
          const employeesData = await employeesRes.json()
          const currentEmployee = employeesData.employees?.find(
            (emp: { user: { id: string } }) => emp.user.id === session?.user?.id
          )
          setIsOwnAppointment(currentEmployee?.id === data.appointment.employeeId)
        }
      } else {
        setIsOwnAppointment(true) // Admin sieht alles
      }
      
      setFormData({
        title: data.appointment.title,
        description: data.appointment.description || '',
        notes: data.appointment.notes || '',
        startTime: formatDateTimeLocal(data.appointment.startTime),
        endTime: formatDateTimeLocal(data.appointment.endTime),
        status: data.appointment.status,
        price: data.appointment.price ? data.appointment.price.toString() : '',
        customerId: data.appointment.customer?.id || '',
        employeeId: data.appointment.employee?.id || '',
      })
    } catch (error) {
      console.error('Fehler:', error)
      router.push('/dashboard/appointments')
    } finally {
      setLoading(false)
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

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: formData.price ? parseFloat(formData.price) : null,
          customerId: formData.customerId || null,
          employeeId: formData.employeeId || null,
          adminOverride: userRole === 'ADMIN' ? adminOverride : false,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        if (errorData.availability) {
          setAvailabilityError(errorData.availability.reason || errorData.error)
          return
        }
        throw new Error(errorData.error || 'Fehler beim Speichern')
      }
      
      setAvailabilityError(null)
      setAdminOverride(false)
      setEditing(false)
      fetchAppointment()
    } catch (error) {
      console.error('Fehler:', error)
      alert(error instanceof Error ? error.message : 'Fehler beim Speichern')
    }
  }

  useEffect(() => {
    // Prüfe Verfügbarkeit wenn Zeit oder Mitarbeiter geändert wird
    if (editing && formData.startTime && formData.endTime && formData.employeeId && userRole === 'ADMIN') {
      const checkAvailability = async () => {
        try {
          const response = await fetch('/api/employees/check-availability', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              employeeId: formData.employeeId,
              startTime: formData.startTime,
              endTime: formData.endTime,
            }),
          })
          
          if (response.ok) {
            const data = await response.json()
            if (!data.availability.isAvailable) {
              setAvailabilityError(data.availability.reason || 'Nicht verfügbar')
            } else {
              setAvailabilityError(null)
            }
          }
        } catch (error) {
          // Ignoriere Fehler
        }
      }
      
      checkAvailability()
    } else {
      setAvailabilityError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.startTime, formData.endTime, formData.employeeId, editing])

  const handleDelete = async () => {
    if (!confirm('Termin wirklich löschen?')) return

    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Fehler beim Löschen')
      router.push('/dashboard/appointments')
    } catch (error) {
      console.error('Fehler:', error)
      alert('Fehler beim Löschen')
    }
  }

  const getAppointmentColor = () => {
    if (appointment?.color) return appointment.color
    if (appointment?.employee?.color) return appointment.employee.color
    return STATUS_COLORS[appointment?.status || 'OPEN'] || '#3B82F6'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Lade Termin...</p>
      </div>
    )
  }

  if (!appointment) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/appointments"
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            ← Zurück zur Übersicht
          </Link>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{appointment.title}</h1>
              <div className="mt-2 flex items-center gap-3">
                <span
                  className="rounded px-3 py-1 text-sm font-medium text-white"
                  style={{ backgroundColor: getAppointmentColor() }}
                >
                  {STATUS_OPTIONS.find((s) => s.value === appointment.status)?.label || appointment.status}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              {editing ? (
                <>
                  <button
                    onClick={() => {
                      setEditing(false)
                      fetchAppointment()
                    }}
                    className="rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleSave}
                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                  >
                    Speichern
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setEditing(true)}
                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                  >
                    Bearbeiten
                  </button>
                  <button
                    onClick={handleDelete}
                    className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
                  >
                    Löschen
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Grundinformationen */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Grundinformationen</h2>
            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Titel</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className={`mt-1 ${inputBase}`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Startzeit</label>
                    <input
                      type="datetime-local"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className={`mt-1 ${inputBase}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Endzeit</label>
                    <input
                      type="datetime-local"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className={`mt-1 ${inputBase}`}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className={`mt-1 ${inputBase}`}
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* Mitarbeiter kann Preise NUR bei eigenen Terminen bearbeiten */}
                  {(userRole === 'ADMIN' || isOwnAppointment) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Preis (€)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className={`mt-1 ${inputBase}`}
                        disabled={userRole === 'MITARBEITER' && !isOwnAppointment}
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <span className="font-medium">Zeit:</span>{' '}
                  {format(new Date(appointment.startTime), 'EEEE, d. MMMM yyyy, HH:mm')} -{' '}
                  {format(new Date(appointment.endTime), 'HH:mm')}
                </p>
                {/* Mitarbeiter sieht Preise NUR bei eigenen Terminen */}
                {appointment.price && (userRole === 'ADMIN' || isOwnAppointment) && (
                  <p>
                    <span className="font-medium">Preis:</span>{' '}
                    <span className="font-semibold text-gray-900">
                      {Number(appointment.price).toFixed(2)} €
                    </span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Kunde & Mitarbeiter */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Zugeordnet</h2>
            {editing ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Kunde</label>
                  <select
                    value={formData.customerId}
                    onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                    className={`mt-1 ${inputBase}`}
                  >
                    <option value="">Kein Kunde</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.firstName} {customer.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Mitarbeiter kann Mitarbeiter-Zuweisung nicht ändern */}
                {userRole === 'ADMIN' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Mitarbeiter</label>
                    <select
                      value={formData.employeeId}
                      onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                      className={`mt-1 ${inputBase}`}
                    >
                      <option value="">Kein Mitarbeiter</option>
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.user.name || employee.user.email}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2 text-sm text-gray-600">
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
              </div>
            )}
          </div>

          {/* Beschreibung */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Beschreibung</h2>
            {editing ? (
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className={textareaBase}
              />
            ) : (
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {appointment.description || 'Keine Beschreibung'}
              </p>
            )}
          </div>

          {/* Notizen */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Notizen</h2>
            {editing ? (
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={6}
                className={textareaBase}
                placeholder="Interne Notizen zum Termin..."
              />
            ) : (
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {appointment.notes || 'Keine Notizen'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

