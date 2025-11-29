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

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Schnellzugriff</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {allActions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className={`flex flex-col items-center justify-center rounded-lg ${action.color} p-4 text-white transition-colors`}
          >
            <span className="text-3xl mb-2">{action.icon}</span>
            <span className="text-sm font-medium text-center">{action.title}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

