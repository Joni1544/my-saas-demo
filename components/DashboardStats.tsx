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
  totalRevenue?: number
  completedAppointments?: number
  role?: 'ADMIN' | 'MITARBEITER'
}

export default function DashboardStats() {
  const [stats, setStats] = useState<Stats>({
    customers: 0,
    appointments: 0,
    tasks: 0,
    upcomingAppointments: 0,
    totalRevenue: 0,
    completedAppointments: 0,
  })
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<'ADMIN' | 'MITARBEITER'>('ADMIN')

  useEffect(() => {
    async function fetchStats() {
      try {
        // Hole Session-Info
        const sessionRes = await fetch('/api/auth/session')
        const session = await sessionRes.json()
        const role = session?.user?.role || 'ADMIN'
        setUserRole(role)

        if (role === 'MITARBEITER') {
          // Mitarbeiter: Nur eigene Statistiken
          const now = new Date()
          const month = now.getMonth()
          const year = now.getFullYear()
          
          const employeeStatsRes = await fetch(`/api/stats/employee?month=${month}&year=${year}`)
          const employeeStats = await employeeStatsRes.json()

          setStats({
            customers: 0, // Mitarbeiter sieht keine Kunden-Statistik
            appointments: employeeStats.appointments || 0,
            tasks: employeeStats.tasks || 0,
            upcomingAppointments: employeeStats.upcomingAppointments || 0,
            totalRevenue: employeeStats.totalRevenue || 0,
            completedAppointments: employeeStats.completedAppointments || 0,
            role: 'MITARBEITER',
          })
        } else {
          // Admin: Alle Statistiken
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

          // Berechne Umsatz aus abgeschlossenen Terminen (COMPLETED oder DONE)
          const completed = appointmentsData.appointments?.filter(
            (apt: { status: string; price: number | null }) => 
              (apt.status === 'COMPLETED' || apt.status === 'DONE') && apt.price
          ) || []
          const totalRevenue = completed.reduce(
            (sum: number, apt: { price: number }) => sum + (apt.price || 0),
            0
          )

          setStats({
            customers: customersData.customers?.length || 0,
            appointments: appointmentsData.appointments?.length || 0,
            tasks: tasksData.tasks?.length || 0,
            upcomingAppointments: upcoming,
            totalRevenue,
            completedAppointments: completed.length,
            role: 'ADMIN',
          })
        }
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const cards = userRole === 'ADMIN' ? [
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
      title: 'Abgeschlossene Termine',
      value: stats.completedAppointments || 0,
      icon: '✅',
      color: 'bg-emerald-500',
    },
    {
      title: 'Umsatz',
      value: formatCurrency(stats.totalRevenue || 0),
      icon: '💰',
      color: 'bg-indigo-500',
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
      icon: '📋',
      color: 'bg-purple-500',
    },
  ] : [
    {
      title: 'Meine Termine',
      value: stats.appointments,
      icon: '📅',
      color: 'bg-green-500',
    },
    {
      title: 'Abgeschlossene Termine',
      value: stats.completedAppointments || 0,
      icon: '✅',
      color: 'bg-emerald-500',
    },
    {
      title: 'Mein Umsatz',
      value: formatCurrency(stats.totalRevenue || 0),
      icon: '💰',
      color: 'bg-indigo-500',
    },
    {
      title: 'Meine Aufgaben',
      value: stats.tasks,
      icon: '📋',
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

