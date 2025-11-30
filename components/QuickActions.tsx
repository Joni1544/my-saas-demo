/**
 * Quick Actions Komponente
 * Schnellzugriff auf häufig genutzte Funktionen
 */
'use client'

import Link from 'next/link'

interface QuickActionsProps {
  role: string
}

export default function QuickActions({ role }: QuickActionsProps) {
  const actions = [
    {
      title: 'Neuer Termin',
      href: '/dashboard/appointments/new',
      icon: '📅',
      color: 'bg-indigo-600 hover:bg-indigo-700',
    },
    {
      title: 'Neuer Kunde',
      href: '/dashboard/customers/new',
      icon: '👤',
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      title: 'Neue Aufgabe',
      href: '/dashboard/tasks/new',
      icon: '✅',
      color: 'bg-green-600 hover:bg-green-700',
    },
    {
      title: 'Kalender',
      href: '/dashboard/calendar',
      icon: '📆',
      color: 'bg-purple-600 hover:bg-purple-700',
    },
  ]

  const adminActions = [
    {
      title: 'Neuer Mitarbeiter',
      href: '/dashboard/employees/new',
      icon: '👥',
      color: 'bg-orange-600 hover:bg-orange-700',
    },
    {
      title: 'Umsatz-Dashboard',
      href: '/dashboard/revenue',
      icon: '💰',
      color: 'bg-yellow-600 hover:bg-yellow-700',
    },
  ]

  const allActions = role === 'ADMIN' ? [...actions, ...adminActions] : actions

  const colorMap: Record<string, string> = {
    'bg-indigo-600 hover:bg-indigo-700': 'from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700',
    'bg-blue-600 hover:bg-blue-700': 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
    'bg-green-600 hover:bg-green-700': 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
    'bg-purple-600 hover:bg-purple-700': 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
    'bg-orange-600 hover:bg-orange-700': 'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700',
    'bg-yellow-600 hover:bg-yellow-700': 'from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700',
  }

  return (
    <div className="rounded-2xl bg-white p-8 shadow-lg border border-gray-100">
      <h2 className="mb-6 text-xl font-bold text-gray-900">Schnellzugriff</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {allActions.map((action) => {
          const gradient = colorMap[action.color] || 'from-indigo-500 to-indigo-600'
          return (
            <Link
              key={action.title}
              href={action.href}
              className={`group relative flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} p-6 text-white transition-all duration-300 transform hover:scale-105 hover:shadow-2xl overflow-hidden`}
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              <span className="text-4xl mb-3 relative z-10 transform group-hover:scale-110 transition-transform duration-300">{action.icon}</span>
              <span className="text-sm font-semibold text-center relative z-10">{action.title}</span>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}

