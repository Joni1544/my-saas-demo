/**
 * Breadcrumbs Component
 * Zeigt Navigationspfad für bessere Navigation
 */
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface BreadcrumbSegment {
  name: string
  href: string
}

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  payments: 'Zahlungen',
  invoices: 'Rechnungen',
  reminders: 'Mahnungen',
  'ai-usage': 'KI-Usage',
  automation: 'Automation',
  employees: 'Mitarbeiter',
  customers: 'Kunden',
  appointments: 'Termine',
  tasks: 'Aufgaben',
  chat: 'Chat',
  admin: 'Admin',
  finance: 'Finanzen',
  inventory: 'Inventar',
  reports: 'Berichte',
  templates: 'Templates',
  new: 'Neu',
  pos: 'POS',
  billing: 'Abrechnung',
}

export default function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  // Erstelle Breadcrumb-Segmente
  const breadcrumbs: BreadcrumbSegment[] = []
  
  // Starte immer mit Dashboard
  if (segments.length > 0 && segments[0] === 'dashboard') {
    breadcrumbs.push({ name: 'Dashboard', href: '/dashboard' })
    
    // Füge weitere Segmente hinzu
    let currentPath = '/dashboard'
    for (let i = 1; i < segments.length; i++) {
      const segment = segments[i]
      currentPath += `/${segment}`
      
      // Überspringe dynamische Segmente (IDs)
      if (segment.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        // Versuche einen Namen aus dem Kontext zu holen (z.B. aus URL-Parametern)
        // Für jetzt zeigen wir einfach "Details"
        breadcrumbs.push({ name: 'Details', href: currentPath })
      } else {
        const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
        breadcrumbs.push({ name: label, href: currentPath })
      }
    }
  }

  // Zeige Breadcrumbs nur wenn mehr als ein Segment vorhanden ist
  if (breadcrumbs.length <= 1) {
    return null
  }

  return (
    <nav className="mb-4" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2 text-sm">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1
          
          return (
            <li key={crumb.href} className="flex items-center">
              {index > 0 && (
                <svg
                  className="h-4 w-4 text-gray-400 mx-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              {isLast ? (
                <span className="font-medium text-gray-900" aria-current="page">
                  {crumb.name}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {crumb.name}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

