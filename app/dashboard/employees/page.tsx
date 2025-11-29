/**
 * Mitarbeiterverwaltung
 * Features: Liste, Arbeitszeiten, Farbe, Aktiv/Inaktiv
 */
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Employee {
  id: string
  position: string | null
  color: string | null
  isActive: boolean
  workHours: Record<string, { start: string; end: string }> | null
  user: {
    id: string
    name: string | null
    email: string
    role: string
  }
  createdAt: string
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/employees')
      if (!response.ok) throw new Error('Fehler beim Laden der Mitarbeiter')
      const data = await response.json()
      setEmployees(data.employees || [])
    } catch (error) {
      console.error('Fehler:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      })
      if (!response.ok) throw new Error('Fehler beim Aktualisieren')
      fetchEmployees()
    } catch (error) {
      console.error('Fehler:', error)
      alert('Fehler beim Aktualisieren')
    }
  }

  const getDefaultColor = (index: number) => {
    const colors = [
      '#3B82F6', // Blau
      '#10B981', // Grün
      '#F59E0B', // Orange
      '#EF4444', // Rot
      '#8B5CF6', // Lila
      '#EC4899', // Pink
    ]
    return colors[index % colors.length]
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mitarbeiterverwaltung</h1>
            <p className="mt-2 text-gray-600">Verwalten Sie Ihre Mitarbeiter und Arbeitszeiten</p>
          </div>
          <Link
            href="/dashboard/employees/new"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            + Neuer Mitarbeiter
          </Link>
        </div>

        {/* Mitarbeiter Liste */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Lade Mitarbeiter...</p>
          </div>
        ) : employees.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center shadow">
            <p className="text-gray-500">Keine Mitarbeiter gefunden</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {employees.map((employee, index) => (
              <div
                key={employee.id}
                className="rounded-lg bg-white p-6 shadow hover:shadow-md transition-shadow"
              >
                {/* Header mit Farbe */}
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                      style={{
                        backgroundColor: employee.color || getDefaultColor(index),
                      }}
                    >
                      {employee.user.name?.[0]?.toUpperCase() || employee.user.email[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {employee.user.name || employee.user.email}
                      </h3>
                      <p className="text-sm text-gray-600">{employee.user.email}</p>
                      {employee.position && (
                        <p className="text-sm text-gray-500">{employee.position}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block rounded px-2 py-1 text-xs font-medium ${
                        employee.user.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {employee.user.role}
                    </span>
                    <span
                      className={`inline-block rounded px-2 py-1 text-xs font-medium ${
                        employee.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {employee.isActive ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </div>
                </div>

                {/* Kalender-Farbe */}
                <div className="mb-4 border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kalender-Farbe
                  </label>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-8 w-8 rounded border-2 border-gray-300"
                      style={{ backgroundColor: employee.color || getDefaultColor(index) }}
                    />
                    <input
                      type="color"
                      value={employee.color || getDefaultColor(index)}
                      onChange={async (e) => {
                        try {
                          const response = await fetch(`/api/employees/${employee.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ color: e.target.value }),
                          })
                          if (response.ok) fetchEmployees()
                        } catch (error) {
                          console.error('Fehler:', error)
                        }
                      }}
                      className="h-8 w-16 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Arbeitszeiten Vorschau */}
                {employee.workHours && (
                  <div className="mb-4 border-t pt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Arbeitszeiten</p>
                    <p className="text-xs text-gray-600">
                      {Object.keys(employee.workHours).length} Tage konfiguriert
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 border-t pt-4">
                  <Link
                    href={`/dashboard/employees/${employee.id}`}
                    className="flex-1 rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-indigo-500"
                  >
                    Bearbeiten
                  </Link>
                  <button
                    onClick={() => handleToggleActive(employee.id, employee.isActive)}
                    className={`rounded-md px-3 py-2 text-sm font-semibold ${
                      employee.isActive
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {employee.isActive ? 'Deaktivieren' : 'Aktivieren'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

