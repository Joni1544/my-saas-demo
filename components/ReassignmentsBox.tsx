/**
 * Reassignments Box Component
 * Zeigt Anzahl der Termine die neu zugewiesen werden müssen
 */
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function ReassignmentsBox() {
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReassignmentsCount()
  }, [])

  const fetchReassignmentsCount = async () => {
    try {
      const response = await fetch('/api/admin/reassignments')
      if (response.ok) {
        const data = await response.json()
        setCount(data.count || 0)
      }
    } catch (error) {
      console.error('Fehler beim Laden der Reassignments:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2"></div>
      </div>
    )
  }

  if (count === 0) {
    return null
  }

  return (
    <Link
      href="/dashboard/admin/reassignments"
      className="block rounded-lg bg-red-50 border-2 border-red-200 p-6 shadow-sm hover:bg-red-100 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-red-900">
            🔴 Termine neu zuzuweisen
          </h3>
          <p className="text-sm text-red-700 mt-1">
            {count} {count === 1 ? 'Termin' : 'Termine'} müssen neu zugewiesen werden
          </p>
        </div>
        <div className="text-3xl font-bold text-red-600">{count}</div>
      </div>
    </Link>
  )
}

