/**
 * Admin Reassignments Page
 * Zeigt alle Termine die neu zugewiesen werden müssen
 */
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { selectBase } from '@/lib/inputStyles'

interface Appointment {
  id: string
  title: string
  startTime: string
  endTime: string
  customer: {
    firstName: string
    lastName: string
  } | null
  employee: {
    id: string
    user: {
      name: string | null
      email: string
    }
  } | null
}

interface Employee {
  id: string
  user: {
    name: string | null
    email: string
  }
}

export default function ReassignmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [reassigning, setReassigning] = useState<string | null>(null)
  const [selectedEmployees, setSelectedEmployees] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [appointmentsRes, employeesRes] = await Promise.all([
        fetch('/api/admin/reassignments'),
        fetch('/api/employees'),
      ])

      if (appointmentsRes.ok) {
        const appointmentsData = await appointmentsRes.json()
        setAppointments(appointmentsData.appointments || [])
      }

      if (employeesRes.ok) {
        const employeesData = await employeesRes.json()
        setEmployees(employeesData.employees || [])
      }
    } catch (error) {
      console.error('Fehler beim Laden:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReassign = async (appointmentId: string) => {
    const newEmployeeId = selectedEmployees[appointmentId]
    if (!newEmployeeId) {
      alert('Bitte wählen Sie einen Mitarbeiter aus')
      return
    }

    setReassigning(appointmentId)
    try {
      const response = await fetch(`/api/appointments/${appointmentId}/reassign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: newEmployeeId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Fehler beim Neuzuweisen')
      }

      await fetchData()
      alert('Termin erfolgreich neu zugewiesen')
    } catch (error) {
      console.error('Fehler:', error)
      alert(error instanceof Error ? error.message : 'Fehler beim Neuzuweisen')
    } finally {
      setReassigning(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Lade Termine...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/dashboard/admin"
            className="text-sm text-indigo-600 hover:text-indigo-500 mb-4 inline-block"
          >
            ← Zurück zum Admin Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Termine neu zuweisen</h1>
          <p className="mt-2 text-sm text-gray-500">
            Diese Termine müssen neu zugewiesen werden (Mitarbeiter krank oder im Urlaub)
          </p>
        </div>

        {appointments.length === 0 ? (
          <div className="rounded-lg bg-white p-12 shadow-sm border border-gray-200 text-center">
            <p className="text-gray-500">Keine Termine müssen neu zugewiesen werden</p>
            <Link
              href="/dashboard/admin"
              className="mt-4 inline-block text-indigo-600 hover:text-indigo-700"
            >
              Zurück zum Dashboard
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="rounded-lg bg-white p-6 shadow-sm border border-red-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{appointment.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {format(new Date(appointment.startTime), 'EEEE, d. MMMM yyyy, HH:mm', {
                        locale: de,
                      })}{' '}
                      - {format(new Date(appointment.endTime), 'HH:mm', { locale: de })}
                    </p>
                    {appointment.customer && (
                      <p className="text-sm text-gray-500 mt-1">
                        Kunde: {appointment.customer.firstName} {appointment.customer.lastName}
                      </p>
                    )}
                    {appointment.employee && (
                      <p className="text-sm text-red-600 mt-1">
                        Aktueller Mitarbeiter: {appointment.employee.user.name || appointment.employee.user.email}{' '}
                        (krank/Urlaub)
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-end gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Neu zuweisen an:
                    </label>
                    <select
                      value={selectedEmployees[appointment.id] || ''}
                      onChange={(e) =>
                        setSelectedEmployees({
                          ...selectedEmployees,
                          [appointment.id]: e.target.value,
                        })
                      }
                      className={selectBase}
                    >
                      <option value="">Mitarbeiter wählen...</option>
                      {employees
                        .filter((emp) => emp.id !== appointment.employee?.id)
                        .map((employee) => (
                          <option key={employee.id} value={employee.id}>
                            {employee.user.name || employee.user.email}
                          </option>
                        ))}
                    </select>
                  </div>
                  <button
                    onClick={() => handleReassign(appointment.id)}
                    disabled={reassigning === appointment.id || !selectedEmployees[appointment.id]}
                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                  >
                    {reassigning === appointment.id ? 'Wird zugewiesen...' : 'Zuweisen'}
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

