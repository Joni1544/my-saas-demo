/**
 * Neuer Termin - Formular
 */
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { inputBase, textareaBase, selectBase } from '@/lib/inputStyles'

interface Customer {
  id: string
  firstName: string
  lastName: string
  email?: string | null
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

export default function NewAppointmentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [userRole, setUserRole] = useState<'ADMIN' | 'MITARBEITER'>('ADMIN')
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null)
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
  const [availabilityErrors, setAvailabilityErrors] = useState<Record<string, string>>({})
  const [adminOverride, setAdminOverride] = useState(false)

  useEffect(() => {
    async function fetchUserInfo() {
      try {
        const sessionRes = await fetch('/api/auth/session')
        const session = await sessionRes.json()
        const role = (session?.user?.role || 'ADMIN') as 'ADMIN' | 'MITARBEITER'
        setUserRole(role)
        
        // Wenn Mitarbeiter, hole Employee-ID und setze automatisch
        if (role === 'MITARBEITER') {
          const employeesRes = await fetch('/api/employees')
          if (employeesRes.ok) {
            const employeesData = await employeesRes.json()
            const currentEmployee = employeesData.employees?.find(
              (emp: { user: { id: string } }) => emp.user.id === session?.user?.id
            )
            if (currentEmployee) {
              setCurrentEmployeeId(currentEmployee.id)
              setFormData((prev) => ({
                ...prev,
                employeeId: currentEmployee.id,
              }))
            }
          }
        }
      } catch (error) {
        console.error('Fehler beim Laden der Benutzerinfo:', error)
      }
    }
    
    fetchUserInfo()
    fetchCustomers()
    fetchEmployees()
    
    // Setze Standard-Zeit (heute, nächste Stunde)
    const now = new Date()
    now.setHours(now.getHours() + 1, 0, 0, 0)
    const endTime = new Date(now)
    endTime.setHours(endTime.getHours() + 1)
    
    setFormData((prev) => ({
      ...prev,
      startTime: formatDateTimeLocal(now),
      endTime: formatDateTimeLocal(endTime),
    }))
  }, [])

  const formatDateTimeLocal = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  // Konvertiere datetime-local String zu ISO-String mit korrekter Zeitzone
  const convertToISOString = (dateTimeLocal: string): string => {
    if (!dateTimeLocal) return ''
    
    // datetime-local Format: "YYYY-MM-DDTHH:mm" (lokale Zeit ohne Zeitzone)
    const [datePart, timePart] = dateTimeLocal.split('T')
    if (!datePart || !timePart) return ''
    
    const [year, month, day] = datePart.split('-').map(Number)
    const [hours, minutes] = timePart.split(':').map(Number)
    
    // Erstelle Date-Objekt in lokaler Zeitzone
    const localDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0)
    
    if (isNaN(localDateTime.getTime())) {
      console.error('Ungültiges Datum:', dateTimeLocal)
      return ''
    }
    
    // Konvertiere zu ISO-String (UTC)
    return localDateTime.toISOString()
  }

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers?isArchived=false&sortBy=name&sortOrder=asc')
      if (response.ok) {
        const data = await response.json()
        // Sortiere Kunden alphabetisch nach Name
        const sortedCustomers = (data.customers || []).sort((a: Customer, b: Customer) => {
          const nameA = `${a.firstName} ${a.lastName}`.toLowerCase()
          const nameB = `${b.firstName} ${b.lastName}`.toLowerCase()
          return nameA.localeCompare(nameB)
        })
        setCustomers(sortedCustomers)
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
        
        // Prüfe Verfügbarkeit für jeden Mitarbeiter wenn Start/End-Zeit gesetzt ist
        if (formData.startTime && formData.endTime) {
          checkEmployeesAvailability(data.employees || [])
        }
      }
    } catch (error) {
      console.error('Fehler beim Laden der Mitarbeiter:', error)
    }
  }

  const checkEmployeesAvailability = async (employeesList: Employee[]) => {
    const errors: Record<string, string> = {}
    
    for (const employee of employeesList) {
      if (!employee.id || !formData.startTime || !formData.endTime) continue
      
      try {
        // Konvertiere zu ISO-String für Verfügbarkeitsprüfung
        const startTimeISO = convertToISOString(formData.startTime)
        const endTimeISO = convertToISOString(formData.endTime)
        
        if (!startTimeISO || !endTimeISO) continue

        const response = await fetch('/api/employees/check-availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employeeId: employee.id,
            startTime: startTimeISO,
            endTime: endTimeISO,
          }),
        })
        
        if (!response.ok) {
          const data = await response.json()
          if (data.availability && !data.availability.isAvailable) {
            errors[employee.id] = data.availability.reason || 'Nicht verfügbar'
          }
        }
      } catch {
        // Ignoriere Fehler
      }
    }
    
    setAvailabilityErrors(errors)
  }

  useEffect(() => {
    if (formData.startTime && formData.endTime && employees.length > 0) {
      checkEmployeesAvailability(employees)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.startTime, formData.endTime])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Konvertiere datetime-local zu ISO-String für korrekte Zeitzone-Behandlung
      const startTimeISO = convertToISOString(formData.startTime)
      const endTimeISO = convertToISOString(formData.endTime)

      if (!startTimeISO || !endTimeISO) {
        alert('Bitte geben Sie Start- und Endzeit ein')
        setLoading(false)
        return
      }

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          startTime: startTimeISO,
          endTime: endTimeISO,
          price: formData.price ? parseFloat(formData.price) : 0,
          customerId: formData.customerId || null,
          employeeId: formData.employeeId || null,
          adminOverride: userRole === 'ADMIN' ? adminOverride : false,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Fehler beim Erstellen')
      }

      await response.json()
      // Zurück zur Termin-Liste mit Refresh-Parameter, damit der neue Termin sofort sichtbar ist
      router.push('/dashboard/appointments?refresh=true')
      router.refresh()
    } catch (error: unknown) {
      console.error('Fehler:', error)
      alert((error instanceof Error ? error.message : 'Fehler beim Erstellen des Termins'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/dashboard/appointments"
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            ← Zurück zur Übersicht
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">Neuer Termin</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-white p-6 shadow">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Titel <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`mt-1 ${inputBase}`}
              placeholder="z.B. Haarschnitt, Massage..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                Startzeit <span className="text-red-500">*</span>
              </label>
              <input
                id="startTime"
                type="datetime-local"
                required
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className={`mt-1 ${inputBase}`}
              />
            </div>
            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                Endzeit <span className="text-red-500">*</span>
              </label>
              <input
                id="endTime"
                type="datetime-local"
                required
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className={`mt-1 ${inputBase}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="customerId" className="block text-sm font-medium text-gray-700">
                Kunde (Name)
              </label>
              <select
                id="customerId"
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                className={`mt-1 ${selectBase}`}
              >
                <option value="">Kein Kunde auswählen</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.firstName} {customer.lastName}
                    {customer.email ? ` (${customer.email})` : ''}
                  </option>
                ))}
              </select>
              {customers.length === 0 && (
                <p className="mt-1 text-xs text-gray-500">
                  Keine Kunden verfügbar. <Link href="/dashboard/customers/new" className="text-indigo-600 hover:underline">Kunde erstellen</Link>
                </p>
              )}
            </div>
            {/* Mitarbeiter kann Termine NUR für sich selbst erstellen */}
            {userRole === 'ADMIN' ? (
              <div>
                <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700">Mitarbeiter</label>
                <select
                  id="employeeId"
                  value={formData.employeeId}
                  onChange={(e) => {
                    setFormData({ ...formData, employeeId: e.target.value })
                    setAdminOverride(false)
                  }}
                  className={`mt-1 ${selectBase} ${
                    availabilityErrors[formData.employeeId] && !adminOverride
                      ? 'border-red-300 bg-red-50'
                      : ''
                  }`}
                >
                  <option value="">Kein Mitarbeiter</option>
                  {employees.map((employee) => {
                    const error = availabilityErrors[employee.id]
                    const isUnavailable = !!error
                    return (
                      <option
                        key={employee.id}
                        value={employee.id}
                        disabled={isUnavailable && !adminOverride}
                        style={isUnavailable ? { color: '#999', fontStyle: 'italic' } : {}}
                        title={error || ''}
                      >
                        {employee.user.name || employee.user.email}
                        {isUnavailable ? ` (${error})` : ''}
                      </option>
                    )
                  })}
                </select>
                {availabilityErrors[formData.employeeId] && (
                  <div className="mt-2 space-y-2">
                    <p className="text-sm text-red-600">
                      ⚠️ {availabilityErrors[formData.employeeId]}
                    </p>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={adminOverride}
                        onChange={(e) => setAdminOverride(e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Trotzdem zuweisen? (Admin Override)
                      </span>
                    </label>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700">Mitarbeiter</label>
                <input
                  id="employeeId"
                  type="text"
                  value={employees.find(emp => emp.id === currentEmployeeId)?.user.name || 'Sie selbst'}
                  className={`mt-1 ${selectBase}`}
                  disabled
                />
                <p className="mt-1 text-xs text-gray-500">Termine werden automatisch Ihnen zugewiesen</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className={`mt-1 ${selectBase}`}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Preis (€)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className={`mt-1 ${inputBase}`}
                placeholder="0.00"
              />
              <p className="mt-1 text-xs text-gray-500">Optional: Standard ist 0,00 €</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Beschreibung</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className={`mt-1 ${textareaBase}`}
              placeholder="Beschreibung des Termins..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notizen</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              className={`mt-1 ${textareaBase}`}
              placeholder="Interne Notizen zum Termin..."
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Link
              href="/dashboard/appointments"
              className="flex-1 rounded-md bg-gray-200 px-4 py-2 text-center text-sm font-semibold text-gray-700 hover:bg-gray-300"
            >
              Abbrechen
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Wird erstellt...' : 'Termin erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

