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
  const [formData, setFormData] = useState({
    position: '',
    color: '#3B82F6',
    isActive: true,
    active: true,
    workHours: {} as Record<string, { start: string; end: string }>,
    employmentType: 'FULL_TIME' as 'FULL_TIME' | 'PART_TIME' | 'MINI_JOB' | 'FREELANCER',
    salaryType: 'FIXED' as 'FIXED' | 'HOURLY' | 'COMMISSION' | 'MIXED',
    baseSalary: null as number | null,
    hourlyRate: null as number | null,
    commissionRate: null as number | null,
  })

  useEffect(() => {
    if (employeeId) {
      fetchEmployee()
    }
  }, [employeeId])

  const fetchEmployee = async () => {
    try {
      const response = await fetch(`/api/employees/${employeeId}`)
      if (!response.ok) throw new Error('Mitarbeiter nicht gefunden')
      const data = await response.json()
      setEmployee(data.employee)
      setFormData({
        position: data.employee.position || '',
        color: data.employee.color || '#3B82F6',
        isActive: data.employee.isActive ?? data.employee.active ?? true,
        active: data.employee.active ?? data.employee.isActive ?? true,
        workHours: data.employee.workHours || {},
        employmentType: data.employee.employmentType || 'FULL_TIME',
        salaryType: data.employee.salaryType || 'FIXED',
        baseSalary: data.employee.baseSalary ? parseFloat(data.employee.baseSalary.toString()) : null,
        hourlyRate: data.employee.hourlyRate ? parseFloat(data.employee.hourlyRate.toString()) : null,
        commissionRate: data.employee.commissionRate ? parseFloat(data.employee.commissionRate.toString()) : null,
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
          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            {employee.user.name || employee.user.email}
          </h1>
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
                  onChange={(e) => setFormData({ ...formData, employmentType: e.target.value as any })}
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
                  onChange={(e) => setFormData({ ...formData, salaryType: e.target.value as any })}
                  className={`mt-1 ${selectBase}`}
                >
                  <option value="FIXED">Festgehalt</option>
                  <option value="HOURLY">Stundenlohn</option>
                  <option value="COMMISSION">Provision</option>
                  <option value="MIXED">Gemischt (Festgehalt + Provision)</option>
                </select>
              </div>

              {/* Gehaltsfelder - abhängig von salaryType */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {(formData.salaryType === 'FIXED' || formData.salaryType === 'MIXED') && (
                  <div>
                    <label htmlFor="baseSalary" className="block text-sm font-medium text-gray-700">
                      Grundgehalt (€/Monat)
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
    </div>
  )
}

