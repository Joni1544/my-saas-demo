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
      <div className="rounded-2xl bg-white p-8 shadow-lg border border-gray-100">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="ml-3 text-gray-500">Lade Termine...</p>
        </div>
      </div>
    )
  }

  if (appointments.length === 0) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-gray-50 to-white p-8 shadow-lg border border-gray-100">
        <div className="text-center py-8">
          <div className="text-5xl mb-4">📅</div>
          <p className="text-gray-500 font-medium">Keine anstehenden Termine</p>
        </div>
      </div>
    )
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200'
      case 'CANCELLED':
        return 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200'
      case 'COMPLETED':
        return 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border border-gray-200'
      default:
        return 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200'
    }
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-lg border border-gray-100">
      <div className="space-y-3">
        {appointments.map((appointment) => (
          <Link
            key={appointment.id}
            href={`/dashboard/appointments/${appointment.id}`}
            className="group block rounded-xl border border-gray-200 bg-gradient-to-r from-white to-gray-50 p-5 hover:shadow-lg hover:border-indigo-300 transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-1 h-8 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full" />
                  <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{appointment.title}</h3>
                </div>
                <div className="ml-4 space-y-2 text-sm">
                  <p className="text-gray-600 font-medium">
                    <span className="text-indigo-600">🕐</span>{' '}
                    {format(new Date(appointment.startTime), 'EEEE, d. MMMM yyyy, HH:mm')} -{' '}
                    {format(new Date(appointment.endTime), 'HH:mm')}
                  </p>
                  {appointment.customer && (
                    <p className="text-gray-600">
                      <span className="font-semibold text-gray-700">👤 Kunde:</span> {appointment.customer.firstName}{' '}
                      {appointment.customer.lastName}
                    </p>
                  )}
                  {appointment.employee && (
                    <p className="text-gray-600">
                      <span className="font-semibold text-gray-700">👨‍💼 Mitarbeiter:</span>{' '}
                      {appointment.employee.user.name || appointment.employee.user.email}
                    </p>
                  )}
                </div>
              </div>
              <span
                className={`ml-4 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm ${getStatusStyle(appointment.status)}`}
              >
                {appointment.status}
              </span>
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-6 text-center">
        <Link
          href="/dashboard/appointments"
          className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors group"
        >
          Alle Termine anzeigen
          <span className="ml-2 transform group-hover:translate-x-1 transition-transform">→</span>
        </Link>
      </div>
    </div>
  )
}

