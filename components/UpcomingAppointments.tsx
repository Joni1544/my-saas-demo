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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchUpcomingAppointments = async () => {
    try {
      const now = new Date()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 7) // Nächste 7 Tage

      // API filtert automatisch basierend auf echter Rolle, nicht View-Mode
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
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
        <p className="ml-3 text-sm text-gray-500">Lade Termine...</p>
      </div>
    )
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-400">Keine anstehenden Termine</p>
      </div>
    )
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return 'bg-green-50 text-green-700 border border-green-200'
      case 'CANCELLED':
        return 'bg-red-50 text-red-700 border border-red-200'
      case 'COMPLETED':
        return 'bg-gray-50 text-gray-700 border border-gray-200'
      case 'NEEDS_REASSIGNMENT':
        return 'bg-yellow-50 text-yellow-700 border border-yellow-200'
      default:
        return 'bg-blue-50 text-blue-700 border border-blue-200'
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      OPEN: 'Offen',
      ACCEPTED: 'Angenommen',
      CANCELLED: 'Storniert',
      RESCHEDULED: 'Verschoben',
      COMPLETED: 'Abgeschlossen',
      NEEDS_REASSIGNMENT: 'Neu zuzuweisen',
    }
    return labels[status] || status
  }

  return (
    <div className="space-y-2">
      {appointments.map((appointment) => (
        <Link
          key={appointment.id}
          href={`/dashboard/appointments/${appointment.id}`}
          className="group block rounded-lg border border-gray-200 bg-white p-4 hover:border-indigo-300 hover:shadow-sm transition-all duration-200"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
                {appointment.title}
              </h4>
              <p className="text-xs text-gray-500 mt-1">
                {format(new Date(appointment.startTime), 'dd.MM.yyyy HH:mm')}
              </p>
              {appointment.customer && (
                <p className="text-xs text-gray-400 mt-1 truncate">
                  {appointment.customer.firstName} {appointment.customer.lastName}
                </p>
              )}
            </div>
            <span
              className={`ml-3 rounded px-2 py-1 text-xs font-medium ${getStatusStyle(appointment.status)}`}
            >
              {getStatusLabel(appointment.status)}
            </span>
          </div>
        </Link>
      ))}
      <div className="pt-2">
        <Link
          href="/dashboard/appointments"
          className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Alle Termine →
        </Link>
      </div>
    </div>
  )
}

