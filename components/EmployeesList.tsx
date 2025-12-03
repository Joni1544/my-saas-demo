/**
 * Employees List Component
 * Zeigt alle Mitarbeiter an (nur Admin)
 */
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import InviteModal from '@/components/InviteModal'

interface Employee {
  id: string
  userId: string
  position: string | null
  color: string | null
  isActive: boolean
  user: {
    id: string
    name: string | null
    email: string
    role: string
  }
}

export default function EmployeesList() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/employees')
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unbekannter Fehler' }))
        console.error('API Fehler:', response.status, errorData)
        alert(`Fehler beim Laden der Mitarbeiter: ${errorData.error || 'Unbekannter Fehler'}`)
        return
      }
      const data = await response.json()
      console.log('Geladene Mitarbeiter:', data.employees?.length || 0)
      setEmployees(data.employees || [])
    } catch (error) {
      console.error('Fehler:', error)
      alert('Fehler beim Laden der Mitarbeiter. Bitte die Browser-Konsole prüfen.')
    } finally {
      setLoading(false)
    }
  }

  const handleInviteSuccess = () => {
    fetchEmployees()
  }

  if (loading) {
    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <p className="text-gray-500">Lade Mitarbeiter...</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Mitarbeiter</h3>
          <button
            onClick={() => setShowInviteModal(true)}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            + Einladen
          </button>
        </div>

        {employees.length === 0 ? (
          <p className="text-gray-500">Keine Mitarbeiter gefunden</p>
        ) : (
          <div className="space-y-3">
            {employees.map((employee) => (
              <div
                key={employee.id}
                className={`flex items-center justify-between rounded-lg border p-4 ${
                  !employee.isActive ? 'border-gray-200 bg-gray-50 opacity-60' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-indigo-500 flex items-center justify-center text-white text-lg font-semibold shadow-md">
                    {(employee.user.name || employee.user.email).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      {employee.user.name || employee.user.email}
                    </p>
                    <p className="text-sm text-gray-500">{employee.user.email}</p>
                    {employee.position && (
                      <p className="text-xs text-gray-400 mt-0.5">{employee.position}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      employee.user.role === 'ADMIN'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {employee.user.role === 'ADMIN' ? 'Admin' : 'Mitarbeiter'}
                  </span>
                  {!employee.isActive && (
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 border border-gray-200">
                      Inaktiv
                    </span>
                  )}
                  <Link
                    href={`/dashboard/employees/${employee.id}`}
                    className="rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Bearbeiten
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={handleInviteSuccess}
      />
    </>
  )
}

