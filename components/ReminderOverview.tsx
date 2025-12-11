/**
 * Reminder Overview Widget
 * Zeigt überfällige Rechnungen, Level-Verteilung
 */
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface ReminderStats {
  overdueCount: number
  levelDistribution: Record<string, number>
  totalOverdueAmount: number
}

export default function ReminderOverview() {
  const [stats, setStats] = useState<ReminderStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/invoices/reminders/stats')
      if (!response.ok) throw new Error('Fehler beim Laden')
      
      const data = await response.json()
      
      setStats({
        overdueCount: data.overdueCount || 0,
        levelDistribution: data.levelDistribution || {},
        totalOverdueAmount: data.totalOverdueAmount || 0,
      })
    } catch (error) {
      console.error('Fehler:', error)
      setStats({
        overdueCount: 0,
        levelDistribution: {},
        totalOverdueAmount: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  const levelLabels: Record<string, string> = {
    '1': '1. Mahnung',
    '2': '2. Mahnung',
    '3': '3. Mahnung',
  }

  return (
    <Link href="/dashboard/reminders" className="block">
      <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200 hover:shadow-md transition">
        <div className="flex items-center justify-between mb-4">
          <div className="text-2xl">📬</div>
          <span className="text-sm text-gray-500">Mahnungen</span>
        </div>
        <div className="space-y-2">
          <div>
            <div className="text-sm text-gray-600">Überfällige Rechnungen</div>
            <div className={`text-2xl font-bold ${(stats?.overdueCount || 0) > 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {stats?.overdueCount || 0}
            </div>
          </div>
          {(stats?.overdueCount || 0) > 0 && (
            <>
              <div>
                <div className="text-sm text-gray-600">Überfälliger Betrag</div>
                <div className="text-lg font-medium text-red-600">
                  {formatCurrency(stats?.totalOverdueAmount || 0)}
                </div>
              </div>
              {stats && Object.keys(stats.levelDistribution || {}).length > 0 && (
                <div className="pt-2 border-t border-gray-200">
                  <div className="text-xs text-gray-600 mb-1">Level-Verteilung</div>
                  <div className="space-y-1">
                    {Object.entries(stats.levelDistribution).map(([level, count]) => (
                      <div key={level} className="flex justify-between text-xs">
                        <span className="text-gray-600">{levelLabels[level] || `Level ${level}`}</span>
                        <span className="font-medium text-gray-900">{count as number}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <span className="text-xs text-indigo-600 hover:text-indigo-800">
            → Zu allen Mahnungen
          </span>
        </div>
      </div>
    </Link>
  )
}

