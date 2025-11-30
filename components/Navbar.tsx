/**
 * Navigationsleiste
 * Zeigt Navigation und Logout-Button
 */
'use client'

import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()

  if (!session) return null

  const isAdmin = session.user.role === 'ADMIN'
  
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', adminOnly: false },
    { name: 'Kalender', href: '/dashboard/calendar', adminOnly: false },
    { name: 'Kunden', href: '/dashboard/customers', adminOnly: false },
    { name: 'Termine', href: '/dashboard/appointments', adminOnly: false },
    { name: 'Aufgaben', href: '/dashboard/tasks', adminOnly: false },
    // Admin-only Links
    { name: 'Admin', href: '/dashboard/admin', adminOnly: true },
    { name: 'Mitarbeiter', href: '/dashboard/employees', adminOnly: true },
    { name: 'Umsatz', href: '/dashboard/revenue', adminOnly: true },
    { name: 'Ausgaben', href: '/dashboard/expenses', adminOnly: true },
    { name: 'Daueraufträge', href: '/dashboard/recurring-expenses', adminOnly: true },
    { name: 'Finanzen', href: '/dashboard/finance', adminOnly: true },
  ].filter(item => !item.adminOnly || isAdmin)

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

