/**
 * AI Usage Overview Widget
 * Zeigt Verbrauch diesen Monat, Kosten, Top Features
 */
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface AIUsageStats {
  usageThisMonth: number
  costThisMonth: number
  topFeature: string
  totalUsage: number
}

export default function AIUsageOverview() {
  const [stats, setStats] = useState<AIUsageStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
      
      const response = await fetch(`/api/ai-usage/monthly?startDate=${monthStart}&endDate=${monthEnd}`)
      if (!response.ok) throw new Error('Fehler beim Laden')
      
      const data = await response.json()
      
      // Berechne Top-Feature
      const featureCounts: Record<string, number> = {}
      if (data.usageByFeature) {
        data.usageByFeature.forEach((item: { feature: string; count: number }) => {
          featureCounts[item.feature] = item.count
        })
      }
      
      const topFeature = Object.entries(featureCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Keine'
      
      setStats({
        usageThisMonth: data.totalUsage || 0,
        costThisMonth: data.totalCost || 0,
        topFeature: topFeature.replace('_', ' '),
        totalUsage: data.totalUsage || 0,
      })
    } catch (error) {
      console.error('Fehler:', error)
      setStats({
        usageThisMonth: 0,
        costThisMonth: 0,
        topFeature: 'Keine',
        totalUsage: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
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

  return (
    <Link href="/dashboard/ai-usage" className="block">
      <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200 hover:shadow-md transition">
        <div className="flex items-center justify-between mb-4">
          <div className="text-2xl">🤖</div>
          <span className="text-sm text-gray-500">KI-Usage</span>
        </div>
        <div className="space-y-2">
          <div>
            <div className="text-sm text-gray-600">Verbrauch diesen Monat</div>
            <div className="text-2xl font-bold text-gray-900">{stats?.usageThisMonth || 0}</div>
            <div className="text-xs text-gray-500">API-Calls</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Kosten diesen Monat</div>
            <div className="text-xl font-semibold text-purple-600">
              {formatCurrency(stats?.costThisMonth || 0)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Top Feature</div>
            <div className="text-sm font-medium text-gray-900">{stats?.topFeature}</div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <span className="text-xs text-indigo-600 hover:text-indigo-800">
            → Zu KI-Usage Details
          </span>
        </div>
      </div>
    </Link>
  )
}

