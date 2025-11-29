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

  const navigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Kalender', href: '/dashboard/calendar' },
    { name: 'Kunden', href: '/dashboard/customers' },
    { name: 'Mitarbeiter', href: '/dashboard/employees' },
    { name: 'Termine', href: '/dashboard/appointments' },
    { name: 'Umsatz', href: '/dashboard/revenue' },
    { name: 'Aufgaben', href: '/dashboard/tasks' },
  ]

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

