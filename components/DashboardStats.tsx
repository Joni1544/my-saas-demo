/**
 * Dashboard Statistik-Karten
 * Zeigt Übersicht über Kunden, Termine und Aufgaben
 */
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

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

          // Berechne Umsatz aus abgeschlossenen Terminen (COMPLETED oder DONE) für DIESEN MONAT
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
          
          const completed = appointmentsData.appointments?.filter(
            (apt: { status: string; price: number | null; startTime: string }) => {
              const aptDate = new Date(apt.startTime)
              return (apt.status === 'COMPLETED' || apt.status === 'DONE') && 
                     apt.price && 
                     aptDate >= monthStart && 
                     aptDate <= monthEnd
            }
          ) || []
          const totalRevenue = completed.reduce(
            (sum: number, apt: { price: number }) => {
              const price = typeof apt.price === 'number' ? apt.price : parseFloat(apt.price?.toString() || '0')
              return sum + price
            },
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
      href: '/dashboard/customers',
    },
    {
      title: 'Termine',
      value: stats.appointments,
      icon: '📅',
      color: 'bg-green-500',
      href: '/dashboard/appointments',
    },
    {
      title: 'Abgeschlossene Termine',
      value: stats.completedAppointments || 0,
      icon: '✅',
      color: 'bg-emerald-500',
      href: '/dashboard/appointments?status=COMPLETED',
    },
    {
      title: 'Umsatz',
      value: formatCurrency(stats.totalRevenue || 0),
      icon: '💰',
      color: 'bg-indigo-500',
      href: '/dashboard/revenue',
    },
    {
      title: 'Anstehende Termine',
      value: stats.upcomingAppointments,
      icon: '⏰',
      color: 'bg-yellow-500',
      href: '/dashboard/appointments?status=upcoming',
    },
    {
      title: 'Aufgaben',
      value: stats.tasks,
      icon: '📋',
      color: 'bg-purple-500',
      href: '/dashboard/tasks',
    },
  ] : [
    {
      title: 'Meine Termine',
      value: stats.appointments,
      icon: '📅',
      color: 'bg-green-500',
      href: '/dashboard/appointments',
    },
    {
      title: 'Abgeschlossene Termine',
      value: stats.completedAppointments || 0,
      icon: '✅',
      color: 'bg-emerald-500',
      href: '/dashboard/appointments?status=COMPLETED',
    },
    {
      title: 'Mein Umsatz',
      value: formatCurrency(stats.totalRevenue || 0),
      icon: '💰',
      color: 'bg-indigo-500',
      href: '/dashboard/revenue',
    },
    {
      title: 'Meine Aufgaben',
      value: stats.tasks,
      icon: '📋',
      color: 'bg-purple-500',
      href: '/dashboard/tasks',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <Link
          key={card.title}
          href={card.href}
          className="group relative overflow-hidden rounded-2xl bg-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          tabIndex={0}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative p-6">
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className={`${card.color} rounded-xl p-3 shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                  <span className="text-2xl block">{card.icon}</span>
                </div>
              </div>
              <div className="flex-1">
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  {card.title}
                </dt>
                <dd className="text-2xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors duration-300">
                  {card.value}
                </dd>
              </div>
            </div>
          </div>
          <div className={`absolute bottom-0 left-0 right-0 h-1 ${card.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`} />
        </Link>
      ))}
    </div>
  )
}

