/**
 * Dashboard KPI-Komponente
 * Zeigt 6 wichtige KPIs: Kunden, Termine, Umsatz diesen Monat, Ausgaben diesen Monat, Offene Aufgaben, Anstehende Termine
 */
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface KPIs {
  customers: number
  appointments: number
  monthlyRevenue: number
  monthlyExpenses: number
  openTasks: number
  upcomingAppointments: number
}

export default function DashboardKPIs() {
  const [kpis, setKpis] = useState<KPIs>({
    customers: 0,
    appointments: 0,
    monthlyRevenue: 0,
    monthlyExpenses: 0,
    openTasks: 0,
    upcomingAppointments: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchKPIs() {
      try {
        const now = new Date()
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

        // Parallele Requests
        const [customersRes, appointmentsRes, tasksRes, expensesRes] = await Promise.all([
          fetch('/api/customers'),
          fetch('/api/appointments'),
          fetch('/api/tasks'),
          fetch(`/api/expenses?startDate=${monthStart.toISOString()}&endDate=${monthEnd.toISOString()}`),
        ])

        const customersData = await customersRes.json()
        const appointmentsData = await appointmentsRes.json()
        const tasksData = await tasksRes.json()
        const expensesData = await expensesRes.json()

        // Berechne Umsatz diesen Monat (nur COMPLETED/DONE)
        const monthlyRevenue = appointmentsData.appointments
          ?.filter(
            (apt: { status: string; price: number | null; startTime: string }) => {
              const aptDate = new Date(apt.startTime)
              return (
                (apt.status === 'COMPLETED' || apt.status === 'DONE') &&
                apt.price !== null &&
                apt.price !== undefined &&
                aptDate >= monthStart &&
                aptDate <= monthEnd
              )
            }
          )
          .reduce((sum: number, apt: { price: number | null }) => {
            const price = apt.price || 0
            return sum + (typeof price === 'number' ? price : parseFloat(String(price)))
          }, 0) || 0

        // Berechne Ausgaben diesen Monat
        const monthlyExpenses =
          expensesData.expenses?.reduce(
            (sum: number, exp: { amount: number }) => sum + parseFloat(exp.amount.toString()),
            0
          ) || 0

        // Offene Aufgaben (nicht DONE)
        const openTasks = tasksData.tasks?.filter(
          (task: { status: string }) => task.status !== 'DONE' && task.status !== 'CANCELLED'
        ).length || 0

        // Anstehende Termine
        const upcomingAppointments = appointmentsData.appointments?.filter(
          (apt: { startTime: string }) => new Date(apt.startTime) >= now
        ).length || 0

        setKpis({
          customers: customersData.customers?.length || 0,
          appointments: appointmentsData.appointments?.length || 0,
          monthlyRevenue,
          monthlyExpenses,
          openTasks,
          upcomingAppointments,
        })
      } catch (error) {
        console.error('Fehler beim Laden der KPIs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchKPIs()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const cards = [
    {
      title: 'Kunden',
      value: kpis.customers,
      icon: '👥',
      color: 'bg-blue-50 text-blue-600',
      iconBg: 'bg-blue-100',
      href: '/dashboard/customers',
    },
    {
      title: 'Termine',
      value: kpis.appointments,
      icon: '📅',
      color: 'bg-green-50 text-green-600',
      iconBg: 'bg-green-100',
      href: '/dashboard/appointments',
    },
    {
      title: 'Umsatz diesen Monat',
      value: formatCurrency(kpis.monthlyRevenue),
      icon: '💰',
      color: 'bg-yellow-50 text-yellow-600',
      iconBg: 'bg-yellow-100',
      href: '/dashboard/revenue',
    },
    {
      title: 'Ausgaben diesen Monat',
      value: formatCurrency(kpis.monthlyExpenses),
      icon: '💸',
      color: 'bg-red-50 text-red-600',
      iconBg: 'bg-red-100',
      href: '/dashboard/expenses',
    },
    {
      title: 'Offene Aufgaben',
      value: kpis.openTasks,
      icon: '📋',
      color: 'bg-purple-50 text-purple-600',
      iconBg: 'bg-purple-100',
      href: '/dashboard/tasks',
    },
    {
      title: 'Anstehende Termine',
      value: kpis.upcomingAppointments,
      icon: '⏰',
      color: 'bg-orange-50 text-orange-600',
      iconBg: 'bg-orange-100',
      href: '/dashboard/appointments?status=upcoming',
    },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="animate-pulse rounded-lg bg-gray-100 h-24" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <Link
          key={card.title}
          href={card.href}
          className="group rounded-lg bg-white p-5 shadow-sm border border-gray-200 hover:shadow-md hover:border-indigo-300 transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 mb-1">{card.title}</p>
              <p className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                {card.value}
              </p>
            </div>
            <div className={`${card.iconBg} rounded-lg p-3`}>
              <span className="text-xl">{card.icon}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

