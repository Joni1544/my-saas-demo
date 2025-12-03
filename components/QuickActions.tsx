/**
 * Quick Actions Komponente
 * Schnellzugriff auf häufig genutzte Funktionen
 */
'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useState } from 'react'
import { getEffectiveRole } from '@/lib/view-mode'

interface QuickActionsProps {
  role?: string
}

export default function QuickActions({ role: propRole }: QuickActionsProps) {
  const { data: session } = useSession()
  const getInitialViewMode = (): 'admin' | 'employee' => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('viewMode') as 'admin' | 'employee' | null
      return savedMode || 'admin'
    }
    return 'admin'
  }
  const [viewMode] = useState<'admin' | 'employee'>(getInitialViewMode)

  // Verwende effektive Rolle (View-Mode oder echte Rolle)
  const effectiveRole = propRole || getEffectiveRole(session?.user?.role || 'MITARBEITER', viewMode)
  const isAdmin = effectiveRole === 'ADMIN'

  const allActions = [
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
    {
      title: 'Neuer Chat',
      href: '/dashboard/chat',
      icon: '💬',
      color: 'bg-pink-600 hover:bg-pink-700',
      adminOnly: false,
    },
  ]

  // Filtere Actions basierend auf Rolle
  const actions = isAdmin 
    ? allActions 
    : allActions.filter(action => !action.adminOnly)

  const colorMap: Record<string, string> = {
    'bg-indigo-600 hover:bg-indigo-700': 'from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700',
    'bg-blue-600 hover:bg-blue-700': 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
    'bg-green-600 hover:bg-green-700': 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
    'bg-purple-600 hover:bg-purple-700': 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
    'bg-pink-600 hover:bg-pink-700': 'from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700',
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Schnellzugriff</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {actions.map((action) => {
          const gradient = colorMap[action.color] || 'from-indigo-500 to-indigo-600'
          return (
            <Link
              key={action.title}
              href={action.href}
              className={`group relative flex flex-col items-center justify-center rounded-lg bg-gradient-to-br ${gradient} p-4 text-white transition-all duration-200 hover:shadow-lg overflow-hidden`}
            >
              <span className="text-2xl mb-2 relative z-10">{action.icon}</span>
              <span className="text-xs font-medium text-center relative z-10 leading-tight">{action.title}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

