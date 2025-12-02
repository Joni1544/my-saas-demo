/**
 * Mitarbeiter-Profil Seite
 * Zeigt Profil, Arbeitszeiten, Urlaub und Krankmeldungen
 */
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { inputBase, textareaBase } from '@/lib/inputStyles'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

interface Employee {
  id: string
  avatarUrl: string | null
  phone: string | null
  position: string | null
  bio: string | null
  workStart: string | null
  workEnd: string | null
  breakStart: string | null
  breakEnd: string | null
  daysOff: string[]
  vacationDaysTotal: number | null
  vacationDaysUsed: number | null
  sickDays: number | null
  isSick: boolean
  user: {
    id: string
    name: string | null
    email: string
  }
  vacationRequests: VacationRequest[]
}

interface VacationRequest {
  id: string
  startDate: string
  endDate: string
  days: number
  status: string
  reason: string | null
  createdAt: string
  employee?: {
    user: {
      name: string | null
      email: string
    }
  }
}

type Tab = 'profile' | 'times' | 'vacation' | 'sick'

const DAYS_OF_WEEK = [
  { value: 'Monday', label: 'Montag' },
  { value: 'Tuesday', label: 'Dienstag' },
  { value: 'Wednesday', label: 'Mittwoch' },
  { value: 'Thursday', label: 'Donnerstag' },
  { value: 'Friday', label: 'Freitag' },
  { value: 'Saturday', label: 'Samstag' },
  { value: 'Sunday', label: 'Sonntag' },
]

export default function ProfilePage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    phone: '',
    position: '',
    bio: '',
    avatarUrl: '',
  })
  const [timesFormData, setTimesFormData] = useState({
    workStart: '',
    workEnd: '',
    breakStart: '',
    breakEnd: '',
    daysOff: [] as string[],
  })
  const [vacationFormData, setVacationFormData] = useState({
    startDate: '',
    endDate: '',
    leaveReason: 'Urlaub',
  })
  const [saving, setSaving] = useState(false)
  const [allVacationRequests, setAllVacationRequests] = useState<VacationRequest[]>([])
  const [sickEmployees, setSickEmployees] = useState<any[]>([])

  const isAdmin = session?.user?.role === 'ADMIN'

  useEffect(() => {
    fetchProfile()
    if (isAdmin) {
      fetchAllVacationRequests()
      fetchSickEmployees()
    }
  }, [isAdmin])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/employees/profile')
      if (!response.ok) throw new Error('Fehler beim Laden')
      const data = await response.json()
      setEmployee(data.employee)
      setFormData({
        phone: data.employee.phone || '',
        position: data.employee.position || '',
        bio: data.employee.bio || '',
        avatarUrl: data.employee.avatarUrl || '',
      })
      setTimesFormData({
        workStart: data.employee.workStart || '',
        workEnd: data.employee.workEnd || '',
        breakStart: data.employee.breakStart || '',
        breakEnd: data.employee.breakEnd || '',
        daysOff: data.employee.daysOff || [],
      })
    } catch (error) {
      console.error('Fehler:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/employees/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error('Fehler beim Speichern')
      await fetchProfile()
      setEditing(false)
    } catch (error) {
      console.error('Fehler:', error)
      alert('Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveTimes = async () => {
    if (!isAdmin) return

    setSaving(true)
    try {
      const response = await fetch('/api/employees/times', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: employee?.id,
          ...timesFormData,
        }),
      })

      if (!response.ok) throw new Error('Fehler beim Speichern')
      await fetchProfile()
      alert('Arbeitszeiten gespeichert')
    } catch (error) {
      console.error('Fehler:', error)
      alert('Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  const handleVacationRequest = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/employees/vacation/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vacationFormData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Fehler beim Erstellen')
      }

      await fetchProfile()
      setVacationFormData({ startDate: '', endDate: '', leaveReason: 'Urlaub' })
      alert('Urlaubsantrag erfolgreich gestellt')
    } catch (error) {
      console.error('Fehler:', error)
      alert(error instanceof Error ? error.message : 'Fehler beim Erstellen')
    } finally {
      setSaving(false)
    }
  }

  const handleSickReport = async () => {
    if (!confirm('Möchten Sie sich wirklich krankmelden?')) return

    setSaving(true)
    try {
      const response = await fetch('/api/employees/sick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'report' }),
      })

      if (!response.ok) throw new Error('Fehler')
      await fetchProfile()
      alert('Krankmeldung erfolgreich übermittelt. Warten Sie auf Bestätigung durch den Administrator.')
    } catch (error) {
      console.error('Fehler:', error)
      alert('Fehler bei Krankmeldung')
    } finally {
      setSaving(false)
    }
  }

  const fetchAllVacationRequests = async () => {
    try {
      const response = await fetch('/api/employees/vacation/list')
      if (response.ok) {
        const data = await response.json()
        setAllVacationRequests(data.requests || [])
      }
    } catch (error) {
      console.error('Fehler beim Laden der Urlaubsanträge:', error)
    }
  }

  const fetchSickEmployees = async () => {
    try {
      const response = await fetch('/api/employees/sick')
      if (response.ok) {
        const data = await response.json()
        setSickEmployees(data.sickEmployees || [])
      }
    } catch (error) {
      console.error('Fehler beim Laden der Krankmeldungen:', error)
    }
  }

  const handleApproveVacation = async (requestId: string, action: 'approve' | 'deny') => {
    setSaving(true)
    try {
      const response = await fetch('/api/employees/vacation/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      })

      if (!response.ok) throw new Error('Fehler')
      await fetchAllVacationRequests()
      if (!isAdmin || employee?.id) {
        await fetchProfile()
      }
      alert(`Urlaubsantrag erfolgreich ${action === 'approve' ? 'genehmigt' : 'abgelehnt'}`)
    } catch (error) {
      console.error('Fehler:', error)
      alert('Fehler beim Genehmigen/Ablehnen')
    } finally {
      setSaving(false)
    }
  }

  const handleConfirmSick = async (employeeId: string, action: 'confirm' | 'recover') => {
    setSaving(true)
    try {
      const response = await fetch('/api/employees/sick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, employeeId }),
      })

      if (!response.ok) throw new Error('Fehler')
      await fetchSickEmployees()
      alert(
        action === 'confirm'
          ? 'Krankmeldung erfolgreich bestätigt'
          : 'Mitarbeiter als gesund markiert'
      )
    } catch (error) {
      console.error('Fehler:', error)
      alert('Fehler')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Lade Profil...</p>
        </div>
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Profil nicht gefunden</p>
          <Link href="/dashboard" className="mt-4 text-indigo-600 hover:text-indigo-700">
            Zurück zum Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const remainingVacationDays =
    (employee.vacationDaysTotal || 25) - (employee.vacationDaysUsed || 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mein Profil</h1>
          <p className="mt-2 text-sm text-gray-500">
            Verwalten Sie Ihr Profil, Arbeitszeiten, Urlaub und Krankmeldungen
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'profile', label: 'Profil' },
              { id: 'times', label: 'Arbeitszeiten' },
              { id: 'vacation', label: 'Urlaub' },
              { id: 'sick', label: 'Krankheit' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && (
          <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Profil</h2>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                >
                  Bearbeiten
                </button>
              )}
            </div>

            <div className="space-y-6">
              {/* Avatar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profilbild
                </label>
                {employee.avatarUrl ? (
                  <img
                    src={employee.avatarUrl}
                    alt="Profilbild"
                    className="h-24 w-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-2xl text-gray-400">
                      {employee.user.name?.[0]?.toUpperCase() || employee.user.email[0].toUpperCase()}
                    </span>
                  </div>
                )}
                {editing && (
                  <input
                    type="text"
                    value={formData.avatarUrl}
                    onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                    placeholder="URL zum Profilbild"
                    className={`mt-2 ${inputBase}`}
                  />
                )}
              </div>

              {/* Name (nur Anzeige, Admin kann über User-Management ändern) */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="mt-1 text-sm text-gray-900">{employee.user.name || employee.user.email}</p>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-sm text-gray-900">{employee.user.email}</p>
              </div>

              {/* Position */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Position</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className={`mt-1 ${inputBase}`}
                    placeholder="z.B. Friseurin, Nageldesignerin"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{employee.position || '-'}</p>
                )}
              </div>

              {/* Telefon */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Telefonnummer</label>
                {editing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`mt-1 ${inputBase}`}
                    placeholder="+49 123 456789"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{employee.phone || '-'}</p>
                )}
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Kurzbeschreibung</label>
                {editing ? (
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={4}
                    className={`mt-1 ${textareaBase}`}
                    placeholder="Kurze Beschreibung über Sie..."
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                    {employee.bio || '-'}
                  </p>
                )}
              </div>

              {editing && (
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => {
                      setEditing(false)
                      fetchProfile()
                    }}
                    className="rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                  >
                    {saving ? 'Speichern...' : 'Speichern'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'times' && (
          <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Arbeitszeiten</h2>
              {!isAdmin && (
                <p className="mt-2 text-sm text-gray-500">
                  Nur Administratoren können Arbeitszeiten ändern.
                </p>
              )}
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Arbeitsbeginn</label>
                  <input
                    type="time"
                    value={timesFormData.workStart}
                    onChange={(e) => setTimesFormData({ ...timesFormData, workStart: e.target.value })}
                    className={`mt-1 ${inputBase}`}
                    disabled={!isAdmin}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Arbeitsende</label>
                  <input
                    type="time"
                    value={timesFormData.workEnd}
                    onChange={(e) => setTimesFormData({ ...timesFormData, workEnd: e.target.value })}
                    className={`mt-1 ${inputBase}`}
                    disabled={!isAdmin}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Pausenbeginn</label>
                  <input
                    type="time"
                    value={timesFormData.breakStart}
                    onChange={(e) => setTimesFormData({ ...timesFormData, breakStart: e.target.value })}
                    className={`mt-1 ${inputBase}`}
                    disabled={!isAdmin}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Pausenende</label>
                  <input
                    type="time"
                    value={timesFormData.breakEnd}
                    onChange={(e) => setTimesFormData({ ...timesFormData, breakEnd: e.target.value })}
                    className={`mt-1 ${inputBase}`}
                    disabled={!isAdmin}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Freie Tage</label>
                <div className="grid grid-cols-2 gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <label key={day.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={timesFormData.daysOff.includes(day.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTimesFormData({
                              ...timesFormData,
                              daysOff: [...timesFormData.daysOff, day.value],
                            })
                          } else {
                            setTimesFormData({
                              ...timesFormData,
                              daysOff: timesFormData.daysOff.filter((d) => d !== day.value),
                            })
                          }
                        }}
                        disabled={!isAdmin}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{day.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {isAdmin && (
                <div className="pt-4">
                  <button
                    onClick={handleSaveTimes}
                    disabled={saving}
                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                  >
                    {saving ? 'Speichern...' : 'Speichern'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'vacation' && (
          <div className="space-y-6">
            {/* Urlaubsübersicht */}
            <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Urlaubsübersicht</h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Gesamturlaub</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {employee.vacationDaysTotal || 25} Tage
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Verbraucht</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {employee.vacationDaysUsed || 0} Tage
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Verbleibend</p>
                  <p className="text-2xl font-bold text-indigo-600">{remainingVacationDays} Tage</p>
                </div>
              </div>
            </div>

            {/* Urlaub beantragen */}
            <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Urlaub beantragen</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Von</label>
                  <input
                    type="date"
                    value={vacationFormData.startDate}
                    onChange={(e) =>
                      setVacationFormData({ ...vacationFormData, startDate: e.target.value })
                    }
                    className={`mt-1 ${inputBase}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bis</label>
                  <input
                    type="date"
                    value={vacationFormData.endDate}
                    onChange={(e) =>
                      setVacationFormData({ ...vacationFormData, endDate: e.target.value })
                    }
                    className={`mt-1 ${inputBase}`}
                  />
                </div>
              </div>
              <button
                onClick={handleVacationRequest}
                disabled={saving || !vacationFormData.startDate || !vacationFormData.endDate}
                className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {saving ? 'Wird gesendet...' : 'Urlaub beantragen'}
              </button>
            </div>

            {/* Urlaubsanträge */}
            <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Meine Urlaubsanträge</h2>
              {employee.vacationRequests.length === 0 ? (
                <p className="text-sm text-gray-500">Keine Urlaubsanträge</p>
              ) : (
                <div className="space-y-3">
                  {employee.vacationRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {format(new Date(request.startDate), 'dd.MM.yyyy', { locale: de })} -{' '}
                          {format(new Date(request.endDate), 'dd.MM.yyyy', { locale: de })}
                        </p>
                        <p className="text-sm text-gray-500">
                          {request.days} Tage • {(request as any).leaveReason || 'Urlaub'}
                        </p>
                      </div>
                      <span
                        className={`rounded px-3 py-1 text-xs font-medium ${
                          request.status === 'APPROVED'
                            ? 'bg-green-100 text-green-800'
                            : request.status === 'DENIED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {request.status === 'APPROVED'
                          ? 'Genehmigt'
                          : request.status === 'DENIED'
                            ? 'Abgelehnt'
                            : 'Ausstehend'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Admin: Alle Urlaubsanträge */}
            {isAdmin && (
              <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Alle Urlaubsanträge (Admin)
                </h2>
                {allVacationRequests.length === 0 ? (
                  <p className="text-sm text-gray-500">Keine Urlaubsanträge</p>
                ) : (
                  <div className="space-y-3">
                    {allVacationRequests.map((request: any) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {request.employee.user.name || request.employee.user.email}
                          </p>
                          <p className="text-sm text-gray-600">
                            {format(new Date(request.startDate), 'dd.MM.yyyy', { locale: de })} -{' '}
                            {format(new Date(request.endDate), 'dd.MM.yyyy', { locale: de })}
                          </p>
                          <p className="text-sm text-gray-500">
                            {request.days} Tage • {request.leaveReason || 'Urlaub'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded px-3 py-1 text-xs font-medium ${
                              request.status === 'APPROVED'
                                ? 'bg-green-100 text-green-800'
                                : request.status === 'DENIED'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {request.status === 'APPROVED'
                              ? 'Genehmigt'
                              : request.status === 'DENIED'
                                ? 'Abgelehnt'
                                : 'Ausstehend'}
                          </span>
                          {request.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleApproveVacation(request.id, 'approve')}
                                disabled={saving}
                                className="rounded-md bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-500 disabled:opacity-50"
                              >
                                Genehmigen
                              </button>
                              <button
                                onClick={() => handleApproveVacation(request.id, 'deny')}
                                disabled={saving}
                                className="rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50"
                              >
                                Ablehnen
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'sick' && (
          <div className="space-y-6">
            {/* Status */}
            <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Krankmeldung</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p
                    className={`text-lg font-semibold ${
                      employee.isSick ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {employee.isSick ? 'Krank gemeldet' : 'Gesund'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Krankheitstage (gesamt)</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {employee.sickDays || 0} Tage
                  </p>
                </div>
                {!employee.isSick && (
                  <button
                    onClick={handleSickReport}
                    className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
                  >
                    Ich bin krank melden
                  </button>
                )}
                {employee.isSick && (
                  <p className="text-sm text-gray-500">
                    Ihre Krankmeldung wurde übermittelt. Warten Sie auf Bestätigung durch den
                    Administrator.
                  </p>
                )}
              </div>
            </div>

            {/* Admin: Alle Krankmeldungen */}
            {isAdmin && (
              <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Alle Krankmeldungen (Admin)
                </h2>
                {sickEmployees.length === 0 ? (
                  <p className="text-sm text-gray-500">Keine Krankmeldungen</p>
                ) : (
                  <div className="space-y-3">
                    {sickEmployees.map((sickEmployee: any) => (
                      <div
                        key={sickEmployee.id}
                        className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {sickEmployee.user.name || sickEmployee.user.email}
                          </p>
                          <p className="text-sm text-gray-500">
                            {sickEmployee.sickDays || 0} Krankheitstage insgesamt
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleConfirmSick(sickEmployee.id, 'confirm')}
                            disabled={saving}
                            className="rounded-md bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-500 disabled:opacity-50"
                          >
                            Bestätigen
                          </button>
                          <button
                            onClick={() => handleConfirmSick(sickEmployee.id, 'recover')}
                            disabled={saving}
                            className="rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                          >
                            Als gesund markieren
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

