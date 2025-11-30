/**
 * Finanz-Dashboard
 * Zeigt Umsatz, Ausgaben, Gewinn und Charts
 */
'use client'

import { useState, useEffect } from 'react'
import { inputBase } from '@/lib/inputStyles'

interface FinanceStats {
  totalRevenue: number
  totalExpenses: number
  profit: number
  revenueByCustomer: Array<{ id: string; name: string; revenue: number }>
  revenueByEmployee: Array<{ id: string; name: string; revenue: number }>
  expensesByCategory: Array<{ category: string; amount: number }>
  profitByEmployee: Array<{ id: string; name: string; revenue: number; expenses: number; profit: number }>
  profitByCustomer: Array<{ id: string; name: string; profit: number }>
  monthlyData: Array<{ month: string; revenue: number; expenses: number; profit: number }>
}

export default function FinanceDashboardPage() {
  const [stats, setStats] = useState<FinanceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    fetchStats()
  }, [filters])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)

      const response = await fetch(`/api/finance/stats?${params.toString()}`)
      if (!response.ok) {
        if (response.status === 403) {
          alert('Nur Administratoren können das Finanz-Dashboard einsehen.')
          return
        }
        throw new Error('Fehler beim Laden')
      }
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Fehler:', error)
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

  const getMaxValue = (data: number[]) => {
    return Math.max(...data, 1)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Lade Finanzstatistiken...</p>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Keine Daten verfügbar</p>
      </div>
    )
  }

  const maxMonthlyValue = getMaxValue([
    ...stats.monthlyData.map((d) => d.revenue),
    ...stats.monthlyData.map((d) => d.expenses),
    ...stats.monthlyData.map((d) => d.profit),
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Finanz-Dashboard</h1>
          <p className="mt-2 text-gray-600">Übersicht über Umsatz, Ausgaben und Gewinn</p>
        </div>

        {/* Date Filter */}
        <div className="mb-6 rounded-lg bg-white p-4 shadow">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                Von
              </label>
              <input
                type="date"
                id="startDate"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className={`mt-1 ${inputBase}`}
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                Bis
              </label>
              <input
                type="date"
                id="endDate"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className={`mt-1 ${inputBase}`}
              />
            </div>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="text-sm font-medium text-gray-600">Gesamtumsatz</div>
            <div className="mt-2 text-3xl font-bold text-green-600">
              {formatCurrency(stats.totalRevenue)}
            </div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="text-sm font-medium text-gray-600">Gesamtausgaben</div>
            <div className="mt-2 text-3xl font-bold text-red-600">
              {formatCurrency(stats.totalExpenses)}
            </div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="text-sm font-medium text-gray-600">Gewinn</div>
            <div className={`mt-2 text-3xl font-bold ${stats.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(stats.profit)}
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Monthly Revenue/Expenses/Profit Chart */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Zeitverlauf</h2>
            <div className="h-64">
              <div className="flex h-full items-end justify-between gap-2">
                {stats.monthlyData.map((data, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                    <div className="flex flex-col gap-1 w-full">
                      <div
                        className="bg-green-500 rounded-t"
                        style={{
                          height: `${(data.revenue / maxMonthlyValue) * 100}%`,
                          minHeight: data.revenue > 0 ? '2px' : '0',
                        }}
                        title={`Umsatz: ${formatCurrency(data.revenue)}`}
                      />
                      <div
                        className="bg-red-500"
                        style={{
                          height: `${(data.expenses / maxMonthlyValue) * 100}%`,
                          minHeight: data.expenses > 0 ? '2px' : '0',
                        }}
                        title={`Ausgaben: ${formatCurrency(data.expenses)}`}
                      />
                      <div
                        className={`rounded-b ${data.profit >= 0 ? 'bg-blue-500' : 'bg-orange-500'}`}
                        style={{
                          height: `${(Math.abs(data.profit) / maxMonthlyValue) * 100}%`,
                          minHeight: Math.abs(data.profit) > 0 ? '2px' : '0',
                        }}
                        title={`Gewinn: ${formatCurrency(data.profit)}`}
                      />
                    </div>
                    <span className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-top-left whitespace-nowrap">
                      {data.month}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 flex gap-4 justify-center">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 bg-green-500 rounded"></div>
                <span className="text-xs text-gray-600">Umsatz</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 bg-red-500 rounded"></div>
                <span className="text-xs text-gray-600">Ausgaben</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 bg-blue-500 rounded"></div>
                <span className="text-xs text-gray-600">Gewinn</span>
              </div>
            </div>
          </div>

          {/* Expenses by Category */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Ausgaben nach Kategorie</h2>
            <div className="space-y-3">
              {stats.expensesByCategory.map((item, idx) => {
                const percentage = (item.amount / stats.totalExpenses) * 100
                return (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{item.category}</span>
                      <span className="font-medium text-gray-900">{formatCurrency(item.amount)}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Profit per Employee */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Gewinn pro Mitarbeiter</h2>
            <div className="space-y-2">
              {stats.profitByEmployee.slice(0, 10).map((emp, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">{emp.name}</span>
                  <span className={`text-sm font-medium ${emp.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(emp.profit)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Profit per Customer */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Umsatz pro Kunde (Top 10)</h2>
            <div className="space-y-2">
              {stats.profitByCustomer.map((cust, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">{cust.name}</span>
                  <span className="text-sm font-medium text-green-600">
                    {formatCurrency(cust.profit)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

