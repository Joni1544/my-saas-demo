/**
 * Kunden-Detail Seite
 * Zeigt alle Informationen, Termine, Historie
 */
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { inputBase, textareaBase } from '@/lib/inputStyles'

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
  createdAt: string
  updatedAt: string
}

interface Appointment {
  id: string
  title: string
  startTime: string
  endTime: string
  status: string
  price: number | null
  employeeId: string | null
}

const AVAILABLE_TAGS = ['Normal', 'VIP', 'Problemkunde', 'No-Show', 'Neu', 'Stammkunde', 'Wichtig']

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const customerId = params.id as string
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [userRole, setUserRole] = useState<'ADMIN' | 'MITARBEITER'>('ADMIN')
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
    tags: [] as string[],
  })

  useEffect(() => {
    async function fetchUserInfo() {
      try {
        const sessionRes = await fetch('/api/auth/session')
        const session = await sessionRes.json()
        const role = session?.user?.role || 'ADMIN'
        setUserRole(role)
        
        // Wenn Mitarbeiter, hole Employee-ID
        if (role === 'MITARBEITER') {
          const employeesRes = await fetch('/api/employees')
          if (employeesRes.ok) {
            const employeesData = await employeesRes.json()
            const currentEmployee = employeesData.employees?.find(
              (emp: { user: { id: string } }) => emp.user.id === session?.user?.id
            )
            if (currentEmployee) {
              setCurrentEmployeeId(currentEmployee.id)
            }
          }
        }
      } catch (error) {
        console.error('Fehler beim Laden der Benutzerinfo:', error)
      }
    }
    
    fetchUserInfo()
  }, [])

  useEffect(() => {
    if (customerId && userRole) {
      fetchCustomer()
      fetchAppointments()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId, userRole, currentEmployeeId])

  const fetchCustomer = async () => {
    try {
      const response = await fetch(`/api/customers/${customerId}`)
      if (!response.ok) throw new Error('Kunde nicht gefunden')
      const data = await response.json()
      setCustomer(data.customer)
      setFormData({
        firstName: data.customer.firstName,
        lastName: data.customer.lastName,
        email: data.customer.email || '',
        phone: data.customer.phone || '',
        address: data.customer.address || '',
        notes: data.customer.notes || '',
        tags: data.customer.tags || [],
      })
    } catch (error) {
      console.error('Fehler:', error)
      router.push('/dashboard/customers')
    } finally {
      setLoading(false)
    }
  }

  const fetchAppointments = async () => {
    try {
      const response = await fetch(`/api/appointments?customerId=${customerId}`)
      if (response.ok) {
        const data = await response.json()
        // Mitarbeiter sieht nur eigene Termine
        let filteredAppointments = data.appointments || []
        if (userRole === 'MITARBEITER' && currentEmployeeId) {
          filteredAppointments = filteredAppointments.filter(
            (apt: { employeeId: string | null }) => apt.employeeId === currentEmployeeId
          )
        }
        setAppointments(filteredAppointments)
      }
    } catch (error) {
      console.error('Fehler beim Laden der Termine:', error)
    }
  }

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!response.ok) throw new Error('Fehler beim Speichern')
      setEditing(false)
      fetchCustomer()
    } catch (error) {
      console.error('Fehler:', error)
      alert('Fehler beim Speichern')
    }
  }

  const toggleTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Lade Kunde...</p>
      </div>
    )
  }

  if (!customer) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link
              href="/dashboard/customers"
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              ← Zurück zur Übersicht
            </Link>
            <h1 className="mt-2 text-3xl font-bold text-gray-900">
              {customer.firstName} {customer.lastName}
            </h1>
          </div>
          <div className="flex gap-2">
            {editing ? (
              <>
                <button
                  onClick={() => {
                    setEditing(false)
                    fetchCustomer()
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
              <button
                onClick={() => setEditing(true)}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                Bearbeiten
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Hauptinformationen */}
          <div className="lg:col-span-2 space-y-6">
            {/* Kontaktdaten */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Kontaktdaten</h2>
              {editing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Vorname</label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className={`mt-1 ${inputBase}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nachname</label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className={`mt-1 ${inputBase}`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`mt-1 ${textareaBase}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Telefon</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className={`mt-1 ${textareaBase}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Adresse</label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={3}
                      className={`mt-1 ${textareaBase}`}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-sm text-gray-600">
                  <p>
                    <span className="font-medium">Email:</span> {customer.email || '-'}
                  </p>
                  <p>
                    <span className="font-medium">Telefon:</span> {customer.phone || '-'}
                  </p>
                  {customer.address && (
                    <p>
                      <span className="font-medium">Adresse:</span> {customer.address}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Tags</h2>
              {editing ? (
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`rounded px-3 py-1 text-sm font-medium ${
                        formData.tags.includes(tag)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {customer.tags.length > 0 ? (
                    customer.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-block rounded bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-800"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">Keine Tags</p>
                  )}
                </div>
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
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Notizen zum Kunden..."
                />
              ) : (
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {customer.notes || 'Keine Notizen'}
                </p>
              )}
            </div>

            {/* Termine */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Termine</h2>
              {appointments.length > 0 ? (
                <div className="space-y-2">
                  {appointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="flex items-center justify-between rounded border p-3"
                    >
                      <div>
                        <p className="font-medium">{apt.title}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(apt.startTime).toLocaleString('de-DE')}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">
                          {apt.status}
                        </span>
                        {/* Mitarbeiter sieht Preise NUR bei eigenen Terminen */}
                        {apt.price && (userRole === 'ADMIN' || apt.employeeId === currentEmployeeId) && (
                          <p className="mt-1 text-sm font-medium text-gray-900">
                            {Number(apt.price).toFixed(2)} €
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Keine Termine</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Info Box */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Informationen</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <span className="font-medium">Erstellt:</span>{' '}
                  {new Date(customer.createdAt).toLocaleDateString('de-DE')}
                </p>
                <p>
                  <span className="font-medium">Aktualisiert:</span>{' '}
                  {new Date(customer.updatedAt).toLocaleDateString('de-DE')}
                </p>
                {customer.isArchived && (
                  <p className="text-orange-600 font-medium">Archiviert</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

