/**
 * View Mode Toggle Component
 * Ermöglicht Admins zwischen Admin- und Mitarbeiter-Ansicht zu wechseln
 */
'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

export default function ViewModeToggle() {
  const { data: session } = useSession()
  // Lade initialen View-Mode aus localStorage (nur client-side)
  const getInitialViewMode = (): 'admin' | 'employee' => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('viewMode') as 'admin' | 'employee' | null
      return savedMode || 'admin'
    }
    return 'admin'
  }
  const [viewMode, setViewMode] = useState<'admin' | 'employee'>(getInitialViewMode)

  // Nur für Admins anzeigen
  if (session?.user?.role !== 'ADMIN') {
    return null
  }

  const handleToggle = (mode: 'admin' | 'employee') => {
    setViewMode(mode)
    localStorage.setItem('viewMode', mode)
    // Seite neu laden, damit alle Komponenten den neuen Modus verwenden
    window.location.reload()
  }

  return (
    <div className="mb-4 rounded-lg bg-yellow-50 border border-yellow-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-yellow-900">Ansichtsmodus</h3>
          <p className="text-xs text-yellow-700 mt-1">
            {viewMode === 'admin' 
              ? 'Sie sehen die Admin-Ansicht mit allen Funktionen'
              : 'Sie sehen die Mitarbeiter-Ansicht (eingeschränkt)'}
          </p>
        </div>
        <div className="flex rounded-md shadow-sm">
          <button
            type="button"
            onClick={() => handleToggle('admin')}
            className={`relative inline-flex items-center rounded-l-md px-4 py-2 text-sm font-semibold ${
              viewMode === 'admin'
                ? 'bg-indigo-600 text-white z-10'
                : 'bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
            }`}
          >
            👑 Admin
          </button>
          <button
            type="button"
            onClick={() => handleToggle('employee')}
            className={`relative -ml-px inline-flex items-center rounded-r-md px-4 py-2 text-sm font-semibold ${
              viewMode === 'employee'
                ? 'bg-indigo-600 text-white z-10'
                : 'bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
            }`}
          >
            👤 Mitarbeiter
          </button>
        </div>
      </div>
    </div>
  )
}

