/**
 * Navigationsleiste
 * Zeigt Navigation und Logout-Button
 */
'use client'

import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getEffectiveRole } from '@/lib/view-mode'

export default function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [viewMode, setViewMode] = useState<'admin' | 'employee'>('admin')

  useEffect(() => {
    // Lade View-Mode aus localStorage
    const savedMode = localStorage.getItem('viewMode') as 'admin' | 'employee' | null
    if (savedMode) {
      setViewMode(savedMode)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!session) return null

  const effectiveRole = getEffectiveRole(session.user.role, viewMode)
  const isAdmin = effectiveRole === 'ADMIN'
  
  // Admin Navigation (neue Reihenfolge)
  const adminNavigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Finanzen', href: '/dashboard/finance' },
    { name: 'Mitarbeiter', href: '/dashboard/employees' },
    { name: 'Inventar', href: '/dashboard/inventory' },
    { name: 'Termine', href: '/dashboard/appointments' },
    { name: 'Kalender', href: '/dashboard/calendar' },
    { name: 'Kunden', href: '/dashboard/customers' },
    { name: 'Aufgaben', href: '/dashboard/tasks' },
    { name: 'Chat', href: '/dashboard/chat' },
    { name: 'Admin', href: '/dashboard/admin' },
    { name: 'Profil', href: '/dashboard/profile' },
  ]
  
  // Mitarbeiter Navigation (abgespeckte Version)
  const employeeNavigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Kalender', href: '/dashboard/calendar' },
    { name: 'Termine', href: '/dashboard/appointments' },
    { name: 'Kunden', href: '/dashboard/customers' },
    { name: 'Aufgaben', href: '/dashboard/tasks' },
    { name: 'Chat', href: '/dashboard/chat' },
    { name: 'Mein Profil', href: '/dashboard/profile' },
  ]
  
  const navigation = isAdmin ? adminNavigation : employeeNavigation

  return (
    <nav className="bg-white shadow">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex space-x-8">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium
                      ${
                        isActive
                          ? 'border-indigo-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }
                    `}
                  >
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>
          <div className="flex items-center">
            <span className="text-sm text-gray-700 mr-4">
              {session.user.email}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              Abmelden
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

