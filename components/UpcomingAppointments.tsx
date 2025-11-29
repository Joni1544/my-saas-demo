/**
 * Nächste Termine Komponente
 * Zeigt die nächsten 5 Termine
 */
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'

interface Appointment {
  id: string
  title: string
  startTime: string
  endTime: string
  status: string
  customer: {
    firstName: string
    lastName: string
  } | null
  employee: {
    user: {
      name: string | null
      email: string
    }
  } | null
}

export default function UpcomingAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUpcomingAppointments()
  }, [])

  const fetchUpcomingAppointments = async () => {
    try {
      const now = new Date()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 7) // Nächste 7 Tage

      const response = await fetch(
        `/api/appointments?startDate=${now.toISOString()}&endDate=${endDate.toISOString()}`
      )
      if (!response.ok) throw new Error('Fehler beim Laden der Termine')
      const data = await response.json()

      // Sortiere nach Startzeit und nimm die ersten 5
      const sorted = (data.appointments || [])
        .filter((apt: Appointment) => new Date(apt.startTime) >= now)
        .sort((a: Appointment, b: Appointment) => 
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        )
        .slice(0, 5)

      setAppointments(sorted)
    } catch (error) {
      console.error('Fehler:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <p className="text-gray-500">Lade Termine...</p>
      </div>
    )
  }

  if (appointments.length === 0) {
    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <p className="text-sm text-gray-500">Keine anstehenden Termine</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="space-y-3">
        {appointments.map((appointment) => (
          <Link
            key={appointment.id}
            href={`/dashboard/appointments/${appointment.id}`}
            className="block rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{appointment.title}</h3>
                <div className="mt-1 space-y-1 text-sm text-gray-600">
                  <p>
                    {format(new Date(appointment.startTime), 'EEEE, d. MMMM yyyy, HH:mm')} -{' '}
                    {format(new Date(appointment.endTime), 'HH:mm')}
                  </p>
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
              </div>
              <span
                className={`ml-4 rounded px-2 py-1 text-xs font-medium ${
                  appointment.status === 'ACCEPTED'
                    ? 'bg-green-100 text-green-800'
                    : appointment.status === 'CANCELLED'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {appointment.status}
              </span>
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-4 text-center">
        <Link
          href="/dashboard/appointments"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Alle Termine anzeigen →
        </Link>
      </div>
    </div>
  )
}

