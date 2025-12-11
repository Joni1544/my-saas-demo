/**
 * Navigationsleiste
 * Zeigt Navigation und Logout-Button
 * Responsive Design mit gleichmäßiger Verteilung der Navigation-Items
 */
'use client'

import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { getEffectiveRole } from '@/lib/view-mode'

export default function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [viewMode] = useState<'admin' | 'employee'>(() => {
    // Initialisiere direkt aus localStorage
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('viewMode') as 'admin' | 'employee' | null
      return savedMode || 'admin'
    }
    return 'admin'
  })

  if (!session) return null

  const effectiveRole = getEffectiveRole(session.user.role, viewMode)
  const isAdmin = effectiveRole === 'ADMIN'
  
  // Admin Navigation (ohne Profil, da es rechts angezeigt wird)
  const adminNavigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Berichte', href: '/dashboard/reports' },
    { name: 'Finanzen', href: '/dashboard/finance' },
    { name: 'Zahlungen', href: '/dashboard/payments' },
    { name: 'Rechnungen', href: '/dashboard/invoices' },
    { name: 'Mahnungen', href: '/dashboard/reminders' },
    { name: 'KI-Usage', href: '/dashboard/ai-usage' },
    { name: 'Automation', href: '/dashboard/automation/payments' },
    { name: 'Mitarbeiter', href: '/dashboard/employees' },
    { name: 'Inventar', href: '/dashboard/inventory' },
    { name: 'Termine', href: '/dashboard/appointments' },
    { name: 'Kalender', href: '/dashboard/calendar' },
    { name: 'Kunden', href: '/dashboard/customers' },
    { name: 'Aufgaben', href: '/dashboard/tasks' },
    { name: 'Chat', href: '/dashboard/chat' },
    { name: 'Admin', href: '/dashboard/admin' },
  ]
  
  // Mitarbeiter Navigation (ohne Profil, da es rechts angezeigt wird)
  const employeeNavigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Kalender', href: '/dashboard/calendar' },
    { name: 'Termine', href: '/dashboard/appointments' },
    { name: 'Kunden', href: '/dashboard/customers' },
    { name: 'Aufgaben', href: '/dashboard/tasks' },
    { name: 'Chat', href: '/dashboard/chat' },
  ]
  
  const navigation = isAdmin ? adminNavigation : employeeNavigation
  const isProfileActive = pathname === '/dashboard/profile'

  return (
    <nav className="bg-white shadow">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Linke Seite: Navigation Items */}
          <div className="flex flex-1 items-center min-w-0">
            <div className="flex items-center gap-x-3 lg:gap-x-4 overflow-x-auto scrollbar-hide">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      whitespace-nowrap inline-flex items-center border-b-2 px-2 pt-1 text-sm font-medium transition-colors shrink-0
                      ${
                        isActive
                          ? 'border-indigo-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }
                    `}
                    title={item.name}
                  >
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Rechte Seite: Profil, Email, Abmelden */}
          <div className="flex items-center gap-x-3 lg:gap-x-4 ml-4 shrink-0">
            <Link
              href="/dashboard/profile"
              className={`
                whitespace-nowrap text-sm font-medium border-b-2 px-2 pt-1 transition-colors shrink-0
                ${
                  isProfileActive
                    ? 'border-indigo-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }
              `}
            >
              Profil
            </Link>
            <span className="text-sm text-gray-400" aria-hidden="true">
              |
            </span>
            <span className="hidden sm:inline text-sm text-gray-700 truncate max-w-[150px] lg:max-w-[200px]">
              {session.user.email}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors whitespace-nowrap"
            >
              Abmelden
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

