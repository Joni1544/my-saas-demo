/**
 * Dashboard Statistik-Karten
 * Zeigt Übersicht über Kunden, Termine und Aufgaben
 */
'use client'

import { useEffect, useState } from 'react'

interface Stats {
  customers: number
  appointments: number
  tasks: number
  upcomingAppointments: number
}

export default function DashboardStats() {
  const [stats, setStats] = useState<Stats>({
    customers: 0,
    appointments: 0,
    tasks: 0,
    upcomingAppointments: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const [customersRes, appointmentsRes, tasksRes] = await Promise.all([
          fetch('/api/customers'),
          fetch('/api/appointments'),
          fetch('/api/tasks'),
        ])

        const customersData = await customersRes.json()
        const appointmentsData = await appointmentsRes.json()
        const tasksData = await tasksRes.json()

        const now = new Date()
        const upcoming = appointmentsData.appointments?.filter(
          (apt: { startTime: string }) => new Date(apt.startTime) >= now
        ).length || 0

        setStats({
          customers: customersData.customers?.length || 0,
          appointments: appointmentsData.appointments?.length || 0,
          tasks: tasksData.tasks?.length || 0,
          upcomingAppointments: upcoming,
        })
      } catch (error) {
        console.error('Fehler beim Laden der Statistiken:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-lg bg-gray-200 p-6 h-24"
          />
        ))}
      </div>
    )
  }

  const cards = [
    {
      title: 'Kunden',
      value: stats.customers,
      icon: '👥',
      color: 'bg-blue-500',
    },
    {
      title: 'Termine',
      value: stats.appointments,
      icon: '📅',
      color: 'bg-green-500',
    },
    {
      title: 'Anstehende Termine',
      value: stats.upcomingAppointments,
      icon: '⏰',
      color: 'bg-yellow-500',
    },
    {
      title: 'Aufgaben',
      value: stats.tasks,
      icon: '✅',
      color: 'bg-purple-500',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="overflow-hidden rounded-lg bg-white shadow"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-3xl">{card.icon}</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {card.title}
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {card.value}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

