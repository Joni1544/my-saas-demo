/**
 * Mitarbeiter-Detail Seite
 * Arbeitszeiten, Farbe, Status verwalten
 */
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { inputBase, selectBase } from '@/lib/inputStyles'

interface Employee {
  id: string
  position: string | null
  color: string | null
  isActive: boolean
  active: boolean
  workHours: Record<string, { start: string; end: string }> | null
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'MINI_JOB' | 'FREELANCER'
  salaryType: 'FIXED' | 'HOURLY' | 'COMMISSION' | 'MIXED'
  baseSalary: number | null
  hourlyRate: number | null
  commissionRate: number | null
  user: {
    id: string
    name: string | null
    email: string
    role: string
    hasPassword?: boolean
  }
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAY_NAMES: Record<string, string> = {
  monday: 'Montag',
  tuesday: 'Dienstag',
  wednesday: 'Mittwoch',
  thursday: 'Donnerstag',
  friday: 'Freitag',
  saturday: 'Samstag',
  sunday: 'Sonntag',
}

export default function EmployeeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const employeeId = params.id as string
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [generatingLink, setGeneratingLink] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: '',
  })
  const [changingPassword, setChangingPassword] = useState(false)
  const [deletingEmployee, setDeletingEmployee] = useState(false)
  const [formData, setFormData] = useState({
    position: '',
    color: '#3B82F6',
    isActive: true,
    active: true,
    workHours: {} as Record<string, { start: string; end: string }>,
    employmentType: 'FULL_TIME' as 'FULL_TIME' | 'PART_TIME' | 'MINI_JOB' | 'FREELANCER',
    salaryType: 'FIXED' as 'FIXED' | 'HOURLY' | 'COMMISSION' | 'MIXED',
    baseSalary: null as number | null,
    salary: null as number | null,
    hourlyRate: null as number | null,
    commissionRate: null as number | null,
    payoutDay: null as number | null,
  })

  useEffect(() => {
    if (employeeId) {
      fetchEmployee()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId])

  const fetchEmployee = async () => {
    try {
      const response = await fetch(`/api/employees/${employeeId}`)
      if (!response.ok) throw new Error('Mitarbeiter nicht gefunden')
      const data = await response.json()
      setEmployee(data.employee)
      
      // Prüfe ob User bereits Passwort hat (aus User-Objekt)
      // Das wird vom API-Endpunkt zurückgegeben
      setFormData({
        position: data.employee.position || '',
        color: data.employee.color || '#3B82F6',
        isActive: data.employee.isActive ?? data.employee.active ?? true,
        active: data.employee.active ?? data.employee.isActive ?? true,
        workHours: data.employee.workHours || {},
        employmentType: data.employee.employmentType || 'FULL_TIME',
        salaryType: data.employee.salaryType || 'FIXED',
        baseSalary: data.employee.baseSalary ? parseFloat(data.employee.baseSalary.toString()) : null,
        salary: data.employee.salary ? parseFloat(data.employee.salary.toString()) : null,
        hourlyRate: data.employee.hourlyRate ? parseFloat(data.employee.hourlyRate.toString()) : null,
        commissionRate: data.employee.commissionRate ? parseFloat(data.employee.commissionRate.toString()) : null,
        payoutDay: data.employee.payoutDay || null,
      })
    } catch (error) {
      console.error('Fehler:', error)
      router.push('/dashboard/employees')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!response.ok) throw new Error('Fehler beim Speichern')
      alert('Erfolgreich gespeichert!')
      fetchEmployee()
    } catch (error) {
      console.error('Fehler:', error)
      alert('Fehler beim Speichern')
    }
  }

  const toggleDay = (day: string) => {
    setFormData((prev) => {
      const newWorkHours = { ...prev.workHours }
      if (newWorkHours[day]) {
        delete newWorkHours[day]
      } else {
        newWorkHours[day] = { start: '09:00', end: '17:00' }
      }
      return { ...prev, workHours: newWorkHours }
    })
  }

  const updateWorkHours = (day: string, field: 'start' | 'end', value: string) => {
    setFormData((prev) => ({
      ...prev,
      workHours: {
        ...prev.workHours,
        [day]: {
          ...prev.workHours[day],
          [field]: value,
        },
      },
    }))
  }

  const generateInviteLink = async () => {
    if (!employee) return
    
    setGeneratingLink(true)
    try {
      const response = await fetch('/api/employees/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: employee.id,
          email: employee.user.email,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Fehler beim Erstellen des Links')
        return
      }

      setInviteLink(data.inviteLink)
    } catch (error) {
      console.error('Fehler:', error)
      alert('Fehler beim Erstellen des Links')
    } finally {
      setGeneratingLink(false)
    }
  }

  const handleSetPassword = async () => {
    if (!passwordData.password || passwordData.password.length < 8) {
      alert('Passwort muss mindestens 8 Zeichen lang sein')
      return
    }

    if (passwordData.password !== passwordData.confirmPassword) {
      alert('Passwörter stimmen nicht überein')
      return
    }

    setChangingPassword(true)
    try {
      const response = await fetch(`/api/employees/${employeeId}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordData.password }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Fehler beim Setzen des Passworts')
        return
      }

      alert('Passwort wurde erfolgreich gesetzt!')
      setShowPasswordModal(false)
      setPasswordData({ password: '', confirmPassword: '' })
      fetchEmployee()
    } catch (error) {
      console.error('Fehler:', error)
      alert('Fehler beim Setzen des Passworts')
    } finally {
      setChangingPassword(false)
    }
  }

  const handleDeletePassword = async () => {
    if (!confirm('Möchten Sie wirklich den Zugang dieses Mitarbeiters deaktivieren? Das Passwort wird gelöscht und der Mitarbeiter kann sich nicht mehr einloggen.')) {
      return
    }

    setDeletingEmployee(true)
    try {
      const response = await fetch(`/api/employees/${employeeId}/password`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Fehler beim Deaktivieren des Zugangs')
        return
      }

      alert('Zugang wurde deaktiviert. Passwort wurde gelöscht.')
      fetchEmployee()
    } catch (error) {
      console.error('Fehler:', error)
      alert('Fehler beim Deaktivieren des Zugangs')
    } finally {
      setDeletingEmployee(false)
    }
  }

  const handleDeleteEmployee = async () => {
    if (!confirm('Möchten Sie diesen Mitarbeiter wirklich löschen? Der Mitarbeiter wird deaktiviert.')) {
      return
    }

    setDeletingEmployee(true)
    try {
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        alert(data.error || 'Fehler beim Löschen des Mitarbeiters')
        return
      }

      alert('Mitarbeiter wurde erfolgreich deaktiviert.')
      router.push('/dashboard/employees')
    } catch (error) {
      console.error('Fehler:', error)
      alert('Fehler beim Löschen des Mitarbeiters')
    } finally {
      setDeletingEmployee(false)
    }
  }

  const handleInviteWithPassword = async () => {
    if (!passwordData.password || passwordData.password.length < 8) {
      alert('Bitte geben Sie ein Passwort ein (mindestens 8 Zeichen)')
      return
    }

    if (passwordData.password !== passwordData.confirmPassword) {
      alert('Passwörter stimmen nicht überein')
      return
    }

    setGeneratingLink(true)
    try {
      const response = await fetch('/api/employees/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: employee?.id,
          email: employee?.user.email,
          password: passwordData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Fehler beim Erstellen der Einladung')
        return
      }

      alert(`Passwort wurde gesetzt!\n\nDer Mitarbeiter kann sich jetzt mit folgenden Daten einloggen:\nEmail: ${data.email}\nPasswort: ${passwordData.password}\n\nLogin-URL: ${data.loginUrl}`)
      setShowPasswordModal(false)
      setPasswordData({ password: '', confirmPassword: '' })
      fetchEmployee()
    } catch (error) {
      console.error('Fehler:', error)
      alert('Fehler beim Erstellen der Einladung')
    } finally {
      setGeneratingLink(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Lade Mitarbeiter...</p>
      </div>
    )
  }

  if (!employee) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/employees"
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            ← Zurück zur Übersicht
          </Link>
          <div className="mt-2 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">
              {employee.user.name || employee.user.email}
            </h1>
            <div className="flex items-center gap-2">
              {!employee.user.hasPassword ? (
                <>
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500"
                  >
                    Passwort setzen
                  </button>
                  <button
                    onClick={generateInviteLink}
                    disabled={generatingLink}
                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                  >
                    {generatingLink ? 'Wird erstellt...' : 'Onboarding-Link erstellen'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                  >
                    Passwort ändern
                  </button>
                  <button
                    onClick={handleDeletePassword}
                    disabled={deletingEmployee}
                    className="rounded-md bg-yellow-600 px-4 py-2 text-sm font-semibold text-white hover:bg-yellow-500 disabled:opacity-50"
                  >
                    {deletingEmployee ? 'Wird deaktiviert...' : 'Zugang deaktivieren'}
                  </button>
                </>
              )}
              <button
                onClick={handleDeleteEmployee}
                disabled={deletingEmployee}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
              >
                {deletingEmployee ? 'Wird gelöscht...' : 'Mitarbeiter löschen'}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Grundinformationen */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Grundinformationen</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Position</label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="z.B. Friseur, Masseur..."
                  className={`mt-1 ${inputBase}`}
                />
              </div>
              
              {/* Gehalt-Anzeige */}
              {(formData.salary !== null && formData.salary > 0) || formData.payoutDay !== null ? (
                <div className="rounded-md bg-gray-50 p-4 border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Gehalt</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {formData.salary !== null && formData.salary > 0 ? (
                      <div>
                        <span className="text-xs text-gray-500">Monatliches Gehalt</span>
                        <p className="text-lg font-semibold text-gray-900">
                          {new Intl.NumberFormat('de-DE', {
                            style: 'currency',
                            currency: 'EUR',
                          }).format(formData.salary)}
                        </p>
                      </div>
                    ) : null}
                    {formData.payoutDay !== null ? (
                      <div>
                        <span className="text-xs text-gray-500">Auszahlungstag</span>
                        <p className="text-lg font-semibold text-gray-900">{formData.payoutDay}. des Monats</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
              <div>
                <label className="block text-sm font-medium text-gray-700">Kalender-Farbe</label>
                <div className="mt-1 flex items-center gap-3">
                  <div
                    className="h-12 w-12 rounded border-2 border-gray-300"
                    style={{ backgroundColor: formData.color }}
                  />
                  <input
                    type="color"
                    id="colorPicker"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="h-12 w-24 cursor-pointer"
                    aria-label="Farbe auswählen"
                  />
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                  Mitarbeiter ist aktiv
                </label>
              </div>
            </div>
          </div>

          {/* Arbeitszeiten */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Arbeitszeiten</h2>
            <div className="space-y-3">
              {DAYS.map((day) => {
                const isActive = !!formData.workHours[day]
                return (
                  <div key={day} className="flex items-center gap-4">
                    <div className="w-32">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={() => toggleDay(day)}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          {DAY_NAMES[day]}
                        </span>
                      </label>
                    </div>
                    {isActive && (
                      <div className="flex items-center gap-2">
                        <label htmlFor={`${day}-start`} className="sr-only">
                          Startzeit {DAY_NAMES[day]}
                        </label>
                        <input
                          id={`${day}-start`}
                          type="time"
                          value={formData.workHours[day].start}
                          onChange={(e) => updateWorkHours(day, 'start', e.target.value)}
                          className={inputBase}
                          aria-label={`Startzeit ${DAY_NAMES[day]}`}
                        />
                        <span className="text-gray-500">bis</span>
                        <label htmlFor={`${day}-end`} className="sr-only">
                          Endzeit {DAY_NAMES[day]}
                        </label>
                        <input
                          id={`${day}-end`}
                          type="time"
                          value={formData.workHours[day].end}
                          onChange={(e) => updateWorkHours(day, 'end', e.target.value)}
                          className={inputBase}
                          aria-label={`Endzeit ${DAY_NAMES[day]}`}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Beschäftigungsart & Gehalt */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Beschäftigung & Gehalt</h2>
            
            <div className="space-y-4">
              {/* Beschäftigungsart */}
              <div>
                <label htmlFor="employmentType" className="block text-sm font-medium text-gray-700">
                  Beschäftigungsart
                </label>
                <select
                  id="employmentType"
                  value={formData.employmentType}
                  onChange={(e) => setFormData({ ...formData, employmentType: e.target.value as 'FULL_TIME' | 'PART_TIME' | 'MINI_JOB' | 'FREELANCER' })}
                  className={`mt-1 ${selectBase}`}
                >
                  <option value="FULL_TIME">Vollzeit</option>
                  <option value="PART_TIME">Teilzeit</option>
                  <option value="MINI_JOB">Minijob</option>
                  <option value="FREELANCER">Freelancer</option>
                </select>
              </div>

              {/* Gehaltsart */}
              <div>
                <label htmlFor="salaryType" className="block text-sm font-medium text-gray-700">
                  Gehaltsart
                </label>
                <select
                  id="salaryType"
                  value={formData.salaryType}
                  onChange={(e) => setFormData({ ...formData, salaryType: e.target.value as 'FIXED' | 'HOURLY' | 'COMMISSION' | 'MIXED' })}
                  className={`mt-1 ${selectBase}`}
                >
                  <option value="FIXED">Festgehalt</option>
                  <option value="HOURLY">Stundenlohn</option>
                  <option value="COMMISSION">Provision</option>
                  <option value="MIXED">Gemischt (Festgehalt + Provision)</option>
                </select>
              </div>

              {/* Gehaltsfelder */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="salary" className="block text-sm font-medium text-gray-700">
                    Gehalt (€/Monat)
                  </label>
                  <input
                    id="salary"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.salary ?? ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? null : parseFloat(e.target.value)
                      setFormData({ ...formData, salary: value })
                    }}
                    className={`mt-1 ${inputBase} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                    placeholder="Gehalt eingeben"
                  />
                </div>
                <div>
                  <label htmlFor="payoutDay" className="block text-sm font-medium text-gray-700">
                    Auszahlungstag
                  </label>
                  <input
                    id="payoutDay"
                    type="number"
                    min="1"
                    max="31"
                    value={formData.payoutDay ?? ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? null : parseInt(e.target.value)
                      if (value === null || (value >= 1 && value <= 31)) {
                        setFormData({ ...formData, payoutDay: value })
                      }
                    }}
                    className={`mt-1 ${inputBase} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                    placeholder="Auszahlungstag (1–31)"
                  />
                </div>
              </div>
              {/* Gehaltsfelder - abhängig von salaryType (Legacy Support) */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {(formData.salaryType === 'FIXED' || formData.salaryType === 'MIXED') && (
                  <div>
                    <label htmlFor="baseSalary" className="block text-sm font-medium text-gray-700">
                      Grundgehalt (€/Monat) - Legacy
                    </label>
                    <input
                      id="baseSalary"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.baseSalary || ''}
                      onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value ? parseFloat(e.target.value) : null })}
                      className={`mt-1 ${inputBase}`}
                      placeholder="0.00"
                    />
                  </div>
                )}

                {(formData.salaryType === 'HOURLY' || formData.salaryType === 'MIXED') && (
                  <div>
                    <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700">
                      Stundenlohn (€/Stunde)
                    </label>
                    <input
                      id="hourlyRate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.hourlyRate || ''}
                      onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value ? parseFloat(e.target.value) : null })}
                      className={`mt-1 ${inputBase}`}
                      placeholder="0.00"
                    />
                  </div>
                )}

                {(formData.salaryType === 'COMMISSION' || formData.salaryType === 'MIXED') && (
                  <div>
                    <label htmlFor="commissionRate" className="block text-sm font-medium text-gray-700">
                      Provisionssatz (%)
                    </label>
                    <input
                      id="commissionRate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.commissionRate || ''}
                      onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value ? parseFloat(e.target.value) : null })}
                      className={`mt-1 ${inputBase}`}
                      placeholder="0.00"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className="rounded-md bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Speichern
            </button>
          </div>
        </div>
      </div>

      {/* Passwort-Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="rounded-lg bg-white p-6 shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {employee.user.hasPassword ? 'Passwort ändern' : 'Passwort setzen'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Neues Passwort <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={passwordData.password}
                  onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                  placeholder="Mindestens 8 Zeichen"
                  className={`w-full ${inputBase}`}
                  minLength={8}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Passwort bestätigen <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="Passwort wiederholen"
                  className={`w-full ${inputBase}`}
                  minLength={8}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => {
                    setShowPasswordModal(false)
                    setPasswordData({ password: '', confirmPassword: '' })
                  }}
                  className="flex-1 rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300"
                >
                  Abbrechen
                </button>
                {employee.user.hasPassword ? (
                  <button
                    onClick={handleSetPassword}
                    disabled={changingPassword}
                    className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                  >
                    {changingPassword ? 'Wird geändert...' : 'Passwort ändern'}
                  </button>
                ) : (
                  <button
                    onClick={handleInviteWithPassword}
                    disabled={generatingLink}
                    className="flex-1 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-50"
                  >
                    {generatingLink ? 'Wird erstellt...' : 'Passwort setzen'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

