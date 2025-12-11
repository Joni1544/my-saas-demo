/**
 * AI Usage Dashboard
 * Übersicht über KI-Nutzung und Kosten
 */
'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'

interface UsageStats {
  totalTokens: number
  totalCost: number
  count: number
  avgCostPerRequest: number
  featureBreakdown: Record<string, { count: number; tokens: number; cost: number }>
  providerBreakdown: Record<string, { count: number; tokens: number; cost: number }>
  dailyUsage: Record<string, { tokens: number; cost: number; count: number }>
}

interface MonthlyUsage {
  usages: Array<{
    id: string
    feature: string
    tokensInput: number
    tokensOutput: number
    totalTokens: number
    cost: number
    aiProvider: string
    timestamp: Date
  }>
  totalTokens: number
  totalCost: number
  count: number
}

export default function AiUsageDashboard() {
  const [stats, setStats] = useState<UsageStats | null>(null)
  const [monthlyUsage, setMonthlyUsage] = useState<MonthlyUsage | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  useEffect(() => {
    fetchStats()
    fetchMonthlyUsage()
  }, [selectedMonth, selectedYear])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/ai-usage/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Fehler:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMonthlyUsage = async () => {
    try {
      const response = await fetch(`/api/ai-usage/monthly?month=${selectedMonth}&year=${selectedYear}`)
      if (response.ok) {
        const data = await response.json()
        setMonthlyUsage(data.monthlyUsage)
      }
    } catch (error) {
      console.error('Fehler:', error)
    }
  }

  const formatCost = (cost: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(cost)
  }

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) {
      return `${(tokens / 1000000).toFixed(2)}M`
    }
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(2)}K`
    }
    return tokens.toString()
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Lade KI-Nutzungsdaten...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">KI-Nutzung & Abrechnung</h1>
          <p className="mt-2 text-sm text-gray-600">Übersicht über KI-Verbrauch und Kosten</p>
        </div>

        {/* KPIs */}
        {stats && (
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-white p-4 shadow">
              <p className="text-sm text-gray-500">Gesamtverbrauch Monat</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatTokens(stats.totalTokens)} Tokens
              </p>
            </div>
            <div className="rounded-lg bg-white p-4 shadow">
              <p className="text-sm text-gray-500">Gesamtkosten Monat</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCost(stats.totalCost)}
              </p>
            </div>
            <div className="rounded-lg bg-white p-4 shadow">
              <p className="text-sm text-gray-500">Anzahl KI-Anfragen</p>
              <p className="text-2xl font-bold text-gray-900">{stats.count}</p>
            </div>
            <div className="rounded-lg bg-white p-4 shadow">
              <p className="text-sm text-gray-500">Ø Kosten pro Anfrage</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCost(stats.avgCostPerRequest)}
              </p>
            </div>
          </div>
        )}

        {/* Feature Breakdown */}
        {stats && Object.keys(stats.featureBreakdown).length > 0 && (
          <div className="mb-6 rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Feature Breakdown</h2>
            <div className="space-y-2">
              {Object.entries(stats.featureBreakdown)
                .sort((a, b) => b[1].cost - a[1].cost)
                .slice(0, 5)
                .map(([feature, data]) => (
                  <div key={feature} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <p className="font-medium text-gray-900">{feature}</p>
                      <p className="text-sm text-gray-500">
                        {data.count} Anfragen • {formatTokens(data.tokens)} Tokens
                      </p>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCost(data.cost)}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Tägliche Nutzung Chart */}
        {stats && Object.keys(stats.dailyUsage).length > 0 && (
          <div className="mb-6 rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Verbrauch pro Tag</h2>
            <div className="space-y-2">
              {Object.entries(stats.dailyUsage)
                .sort((a, b) => b[0].localeCompare(a[0]))
                .slice(0, 7)
                .map(([date, data]) => (
                  <div key={date} className="flex items-center gap-4">
                    <div className="w-24 text-sm text-gray-600">
                      {format(new Date(date), 'dd.MM.yyyy')}
                    </div>
                    <div className="flex-1">
                      <div className="h-4 rounded-full bg-gray-200">
                        <div
                          className="h-4 rounded-full bg-indigo-600"
                          style={{
                            width: `${Math.min((data.tokens / stats.totalTokens) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="w-32 text-right text-sm">
                      <p className="font-medium text-gray-900">{formatTokens(data.tokens)}</p>
                      <p className="text-gray-500">{formatCost(data.cost)}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Monatliche Nutzung Tabelle */}
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Monatliche Nutzung</h2>
            <div className="flex gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {format(new Date(2024, i, 1), 'MMMM')}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - i
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  )
                })}
              </select>
            </div>
          </div>

          {monthlyUsage && monthlyUsage.usages.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Datum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Feature
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Tokens
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Kosten
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Provider
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {monthlyUsage.usages.map((usage) => (
                    <tr key={usage.id}>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {format(new Date(usage.timestamp), 'dd.MM.yyyy HH:mm')}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {usage.feature}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {formatTokens(usage.totalTokens)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">
                        {formatCost(usage.cost)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {usage.aiProvider}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={2} className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                      Gesamt:
                    </td>
                    <td className="px-6 py-3 text-sm font-semibold text-gray-900">
                      {formatTokens(monthlyUsage.totalTokens)}
                    </td>
                    <td className="px-6 py-3 text-sm font-semibold text-gray-900">
                      {formatCost(monthlyUsage.totalCost)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-500">Keine Nutzung für diesen Monat</p>
          )}
        </div>
      </div>
    </div>
  )
}

