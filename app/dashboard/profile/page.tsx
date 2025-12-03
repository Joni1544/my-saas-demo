/**
 * Mitarbeiter-Profil Seite
 * Zeigt Profil, Arbeitszeiten, Urlaub und Krankmeldungen
 */
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
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
  workHours: Record<string, {
    active: boolean
    start: string
    end: string
    breakStart: string
    breakEnd: string
  }> | null
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
  leaveReason?: string
  createdAt: string
  employee?: {
    user: {
      name: string | null
      email: string
    }
  }
}

interface SickEmployee {
  id: string
  user: {
    name: string | null
    email: string
  }
  isSick: boolean
  sickDays: number | null
}

type Tab = 'profile' | 'times' | 'vacation' | 'sick'

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Montag' },
  { value: 'tuesday', label: 'Dienstag' },
  { value: 'wednesday', label: 'Mittwoch' },
  { value: 'thursday', label: 'Donnerstag' },
  { value: 'friday', label: 'Freitag' },
  { value: 'saturday', label: 'Samstag' },
  { value: 'sunday', label: 'Sonntag' },
]

const DEFAULT_WORK_SCHEDULE = {
  monday: { active: true, start: '09:00', end: '18:00', breakStart: '12:00', breakEnd: '12:30' },
  tuesday: { active: true, start: '09:00', end: '18:00', breakStart: '12:00', breakEnd: '12:30' },
  wednesday: { active: true, start: '09:00', end: '18:00', breakStart: '12:00', breakEnd: '12:30' },
  thursday: { active: true, start: '09:00', end: '18:00', breakStart: '12:00', breakEnd: '12:30' },
  friday: { active: true, start: '09:00', end: '18:00', breakStart: '12:00', breakEnd: '12:30' },
  saturday: { active: false, start: '09:00', end: '18:00', breakStart: '12:00', breakEnd: '12:30' },
  sunday: { active: false, start: '09:00', end: '18:00', breakStart: '12:00', breakEnd: '12:30' },
}

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
  const [workSchedule, setWorkSchedule] = useState<Record<string, {
    active: boolean
    start: string
    end: string
    breakStart: string
    breakEnd: string
  }>>(DEFAULT_WORK_SCHEDULE)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [vacationFormData, setVacationFormData] = useState({
    startDate: '',
    endDate: '',
    leaveReason: 'Urlaub',
  })
  const [saving, setSaving] = useState(false)
  const [allVacationRequests, setAllVacationRequests] = useState<VacationRequest[]>([])
  const [sickEmployees, setSickEmployees] = useState<SickEmployee[]>([])
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

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
      // Lade workSchedule aus workHours oder migriere von Legacy-Feldern
      if (data.employee.workHours && typeof data.employee.workHours === 'object') {
        setWorkSchedule(data.employee.workHours as Record<string, {
          active: boolean
          start: string
          end: string
          breakStart: string
          breakEnd: string
        }>)
      } else if (data.employee.workStart && data.employee.workEnd) {
        // Migriere von Legacy-Feldern
        const migratedSchedule: Record<string, {
          active: boolean
          start: string
          end: string
          breakStart: string
          breakEnd: string
        }> = {}
        DAYS_OF_WEEK.forEach((day) => {
          const dayName = day.value.charAt(0).toUpperCase() + day.value.slice(1)
          const isDayOff = data.employee.daysOff?.includes(dayName) || false
          migratedSchedule[day.value] = {
            active: !isDayOff,
            start: data.employee.workStart || '09:00',
            end: data.employee.workEnd || '18:00',
            breakStart: data.employee.breakStart || '12:00',
            breakEnd: data.employee.breakEnd || '12:30',
          }
        })
        setWorkSchedule(migratedSchedule)
      } else {
        setWorkSchedule(DEFAULT_WORK_SCHEDULE)
      }
      setAvatarPreview(null) // Reset preview when profile is fetched
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
    if (!isAdmin || !employee) return

    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)

    try {
      // Validierung
      for (const day of DAYS_OF_WEEK) {
        const daySchedule = workSchedule[day.value]
        if (daySchedule && daySchedule.active) {
          if (daySchedule.start >= daySchedule.end) {
            setSaveError(`${day.label}: Arbeitsbeginn muss vor Arbeitsende liegen`)
            setSaving(false)
            return
          }
          if (daySchedule.breakStart && daySchedule.breakEnd) {
            if (daySchedule.breakStart < daySchedule.start || daySchedule.breakEnd > daySchedule.end) {
              setSaveError(`${day.label}: Pausenzeit muss innerhalb der Arbeitszeit liegen`)
              setSaving(false)
              return
            }
            if (daySchedule.breakStart >= daySchedule.breakEnd) {
              setSaveError(`${day.label}: Pausenbeginn muss vor Pausenende liegen`)
              setSaving(false)
              return
            }
          }
        }
      }

      const response = await fetch('/api/employees/times', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: employee.id,
          workSchedule,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Fehler beim Speichern')
      }

      await fetchProfile()
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error('Fehler:', error)
      setSaveError(error instanceof Error ? error.message : 'Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  const handleApplyToAllDays = (sourceDay: string) => {
    const sourceSchedule = workSchedule[sourceDay]
    if (!sourceSchedule) return

    const updatedSchedule = { ...workSchedule }
    DAYS_OF_WEEK.forEach((day) => {
      if (day.value !== sourceDay) {
        updatedSchedule[day.value] = {
          ...sourceSchedule,
          active: updatedSchedule[day.value].active, // Behalte active-Status
        }
      }
    })
    setWorkSchedule(updatedSchedule)
  }

  const handleResetToDefault = () => {
    if (confirm('Möchten Sie wirklich alle Arbeitszeiten auf Standardwerte zurücksetzen?')) {
      setWorkSchedule(DEFAULT_WORK_SCHEDULE)
    }
  }

  const updateDaySchedule = (day: string, field: string, value: string | boolean) => {
    setWorkSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }))
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validiere Dateityp
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('Nur Bildformate erlaubt (PNG, JPG, JPEG, WEBP)')
      return
    }

    // Validiere Dateigröße (5 MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Datei zu groß. Maximal 5 MB erlaubt.')
      return
    }

    // Zeige Vorschau
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload
    setUploadingAvatar(true)
    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)

      const response = await fetch('/api/employees/profile/avatar', {
        method: 'POST',
        body: uploadFormData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Fehler beim Hochladen')
      }

      const data = await response.json()
      setFormData((prev) => ({ ...prev, avatarUrl: data.avatarUrl }))
      await fetchProfile()
      alert('Profilbild erfolgreich hochgeladen!')
    } catch (error) {
      console.error('Fehler:', error)
      alert(error instanceof Error ? error.message : 'Fehler beim Hochladen des Profilbilds')
      setAvatarPreview(null)
    } finally {
      setUploadingAvatar(false)
      // Reset file input
      e.target.value = ''
    }
  }

  const handleRemoveAvatar = async () => {
    if (!confirm('Möchten Sie das Profilbild wirklich entfernen?')) return

    setUploadingAvatar(true)
    try {
      const response = await fetch('/api/employees/profile/avatar', {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Fehler beim Entfernen')
      }

      setAvatarPreview(null)
      setFormData((prev) => ({ ...prev, avatarUrl: '' }))
      await fetchProfile()
      alert('Profilbild erfolgreich entfernt!')
    } catch (error) {
      console.error('Fehler:', error)
      alert(error instanceof Error ? error.message : 'Fehler beim Entfernen des Profilbilds')
    } finally {
      setUploadingAvatar(false)
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
                <div className="flex items-start gap-4">
                  {/* Avatar Vorschau */}
                  <div className="relative">
                    {(avatarPreview || employee.avatarUrl) ? (
                      <Image
                        src={avatarPreview || employee.avatarUrl || ''}
                        alt="Profilbild"
                        width={96}
                        height={96}
                        className="h-24 w-24 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-200">
                        <span className="text-2xl text-gray-400">
                          {employee.user.name?.[0]?.toUpperCase() || employee.user.email[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Upload Controls */}
                  {editing && (
                    <div className="flex flex-col gap-2">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          onChange={handleAvatarUpload}
                          disabled={uploadingAvatar}
                          className="hidden"
                        />
                        <span className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                          {uploadingAvatar ? 'Wird hochgeladen...' : '📷 Bild hochladen'}
                        </span>
                      </label>
                      {(avatarPreview || employee.avatarUrl) && (
                        <button
                          onClick={handleRemoveAvatar}
                          disabled={uploadingAvatar}
                          className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          🗑️ Entfernen
                        </button>
                      )}
                      <p className="text-xs text-gray-500">
                        PNG, JPG, WEBP • Max. 5 MB
                      </p>
                    </div>
                  )}
                </div>
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

            {/* Success/Error Messages */}
            {saveSuccess && (
              <div className="mb-4 rounded-md bg-green-50 border border-green-200 p-4">
                <p className="text-sm font-medium text-green-800">✓ Arbeitszeiten erfolgreich gespeichert!</p>
              </div>
            )}
            {saveError && (
              <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-4">
                <p className="text-sm font-medium text-red-800">✗ {saveError}</p>
              </div>
            )}

            {/* Header Row */}
            <div className="mb-4 grid grid-cols-6 gap-4 items-center border-b border-gray-200 pb-3">
              <div className="font-semibold text-gray-900">Tag</div>
              <div className="font-semibold text-gray-900 text-center">Arbeitet?</div>
              <div className="font-semibold text-gray-900">Beginn</div>
              <div className="font-semibold text-gray-900">Ende</div>
              <div className="font-semibold text-gray-900">Pause Start</div>
              <div className="font-semibold text-gray-900">Pause Ende</div>
            </div>

            {/* Week Schedule Rows */}
            <div className="space-y-3">
              {DAYS_OF_WEEK.map((day) => {
                const daySchedule = workSchedule[day.value] || DEFAULT_WORK_SCHEDULE[day.value as keyof typeof DEFAULT_WORK_SCHEDULE]
                const isActive = daySchedule.active

                return (
                  <div
                    key={day.value}
                    className="grid grid-cols-6 gap-4 items-center py-3 border-b border-gray-100 last:border-b-0"
                  >
                    {/* Tag */}
                    <div className="font-semibold text-gray-900">{day.label}</div>

                    {/* Checkbox */}
                    <div className="flex justify-center">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => updateDaySchedule(day.value, 'active', e.target.checked)}
                        disabled={!isAdmin}
                        className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-400"
                      />
                    </div>

                    {/* Beginn */}
                    <div>
                      <input
                        type="time"
                        value={daySchedule.start}
                        onChange={(e) => updateDaySchedule(day.value, 'start', e.target.value)}
                        disabled={!isAdmin || !isActive}
                        className={`w-full ${inputBase} disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed`}
                      />
                    </div>

                    {/* Ende */}
                    <div>
                      <input
                        type="time"
                        value={daySchedule.end}
                        onChange={(e) => updateDaySchedule(day.value, 'end', e.target.value)}
                        disabled={!isAdmin || !isActive}
                        className={`w-full ${inputBase} disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed`}
                      />
                    </div>

                    {/* Pause Start */}
                    <div>
                      <input
                        type="time"
                        value={daySchedule.breakStart}
                        onChange={(e) => updateDaySchedule(day.value, 'breakStart', e.target.value)}
                        disabled={!isAdmin || !isActive}
                        className={`w-full ${inputBase} disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed`}
                      />
                    </div>

                    {/* Pause Ende */}
                    <div>
                      <input
                        type="time"
                        value={daySchedule.breakEnd}
                        onChange={(e) => updateDaySchedule(day.value, 'breakEnd', e.target.value)}
                        disabled={!isAdmin || !isActive}
                        className={`w-full ${inputBase} disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed`}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Action Buttons */}
            {isAdmin && (
              <div className="mt-6 pt-6 border-t border-gray-200 flex flex-wrap gap-3">
                <button
                  onClick={handleSaveTimes}
                  disabled={saving}
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {saving ? 'Speichern...' : 'Speichern'}
                </button>
                <button
                  onClick={() => {
                    const activeDay = DAYS_OF_WEEK.find((d) => workSchedule[d.value]?.active)
                    if (activeDay) {
                      handleApplyToAllDays(activeDay.value)
                    } else {
                      alert('Bitte aktivieren Sie zuerst einen Tag, um dessen Zeiten zu übernehmen.')
                    }
                  }}
                  disabled={saving}
                  className="rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                >
                  Für alle Tage übernehmen
                </button>
                <button
                  onClick={handleResetToDefault}
                  disabled={saving}
                  className="rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                >
                  Reset auf Standardzeiten
                </button>
              </div>
            )}
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
                          {request.days} Tage • {request.leaveReason || 'Urlaub'}
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
                    {allVacationRequests.map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {request.employee?.user.name || request.employee?.user.email || 'Unbekannt'}
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
                    {sickEmployees.map((sickEmployee) => (
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

