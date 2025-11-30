/**
 * Finanz-Dashboard
 * Zeigt Umsatz, Ausgaben, Gewinn und Charts mit Recharts
 */
'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { inputBase } from '@/lib/inputStyles'
import DateSelector from '@/components/DateSelector'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface FinanceStats {
  totalRevenue: number
  totalExpenses: number
  totalRecurringExpenses: number
  profit: number
  revenueByCustomer: Array<{ id: string; name: string; revenue: number }>
  revenueByEmployee: Array<{ id: string; name: string; revenue: number }>
  expensesByCategory: Array<{ category: string; amount: number }>
  profitByEmployee: Array<{ id: string; name: string; revenue: number; expenses: number; profit: number }>
  profitByCustomer: Array<{ id: string; name: string; profit: number }>
}

interface TimeSeriesData {
  labels: string[]
  revenue: number[]
  expenses: number[]
  profit: number[]
}


type TimeMode = 'day' | 'week' | 'month' | 'year'

export default function FinanceDashboardPage() {
  const [stats, setStats] = useState<FinanceStats | null>(null)
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeMode, setTimeMode] = useState<TimeMode>('month')
  const [selectedMonth, setSelectedMonth] = useState({ month: new Date().getMonth(), year: new Date().getFullYear() })
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    // Auto-Generate Gehälter beim Laden
    generateSalaryExpenses()
  }, [])

  const generateSalaryExpenses = async () => {
    try {
      await fetch('/api/expenses/generate-salary', {
        method: 'POST',
      })
    } catch (error) {
      console.error('Fehler beim Generieren der Gehälter:', error)
    }
  }

  // Chart-Daten formatieren
  const chartData = useMemo(() => {
    if (!timeSeriesData) return []
    
    return timeSeriesData.labels.map((label, index) => ({
      label,
      Umsatz: timeSeriesData.revenue[index] || 0,
      Ausgaben: timeSeriesData.expenses[index] || 0,
      Gewinn: timeSeriesData.profit[index] || 0,
    }))
  }, [timeSeriesData])

  useEffect(() => {
    fetchStats()
    fetchTimeSeries()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, timeMode, selectedMonth, selectedDate, selectedYear])

  const fetchStats = async () => {
    try {
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

  const fetchTimeSeries = async () => {
    try {
      let from: string
      let to: string

      if (timeMode === 'day') {
        from = selectedDate
        to = selectedDate
      } else if (timeMode === 'month') {
        const monthStart = new Date(selectedMonth.year, selectedMonth.month, 1)
        const monthEnd = new Date(selectedMonth.year, selectedMonth.month + 1, 0, 23, 59, 59)
        from = monthStart.toISOString().split('T')[0]
        to = monthEnd.toISOString().split('T')[0]
      } else if (timeMode === 'year') {
        const yearStart = new Date(selectedYear, 0, 1)
        const yearEnd = new Date(selectedYear, 11, 31, 23, 59, 59)
        from = yearStart.toISOString().split('T')[0]
        to = yearEnd.toISOString().split('T')[0]
      } else {
        from = filters.startDate
        to = filters.endDate
      }

      const params = new URLSearchParams()
      params.append('mode', timeMode)
      params.append('from', from)
      params.append('to', to)

      const response = await fetch(`/api/finances/timeseries?${params.toString()}`)
      if (!response.ok) throw new Error('Fehler beim Laden der Zeitreihen')
      const data = await response.json()
      setTimeSeriesData(data)
    } catch (error) {
      console.error('Fehler:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  interface TooltipProps {
    active?: boolean
    payload?: Array<{
      name: string
      value: number
      color: string
    }>
    label?: string
  }

  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg bg-white p-4 shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Finanz-Dashboard</h1>
            <p className="mt-2 text-gray-600">Übersicht über Umsatz, Ausgaben und Gewinn</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/dashboard/revenue"
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
            >
              Umsätze →
            </Link>
            <Link
              href="/dashboard/expenses"
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 transition-colors"
            >
              Ausgaben →
            </Link>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="text-sm font-medium text-gray-600">Gesamtumsatz</div>
            <div className="mt-2 text-3xl font-bold" style={{ color: '#facc15' }}>
              {formatCurrency(stats.totalRevenue)}
            </div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="text-sm font-medium text-gray-600">Gesamtausgaben</div>
            <div className="mt-2 text-3xl font-bold" style={{ color: '#ef4444' }}>
              {formatCurrency(stats.totalExpenses)}
            </div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="text-sm font-medium text-gray-600">Gewinn</div>
            <div className={`mt-2 text-3xl font-bold ${stats.profit >= 0 ? 'text-green-600' : 'text-red-600'}`} style={{ color: stats.profit >= 0 ? '#22c55e' : '#ef4444' }}>
              {formatCurrency(stats.profit)}
            </div>
            <div className="mt-1 text-xs text-gray-500">
              Umsatz - Ausgaben
            </div>
          </div>
        </div>

        {/* Date Filter & Time Mode Toggle */}
        <div className="mb-6 rounded-lg bg-white p-4 shadow">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Zeitraum-Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zeitraum
              </label>
              <div className="flex gap-2">
                {(['day', 'week', 'month', 'year'] as TimeMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setTimeMode(mode)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      timeMode === mode
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {mode === 'day' ? 'Tag' : mode === 'week' ? 'Woche' : mode === 'month' ? 'Monat' : 'Jahr'}
                  </button>
                ))}
              </div>
            </div>

            {/* Datumsauswahl basierend auf Modus */}
            {timeMode === 'day' && (
              <div>
                <label htmlFor="day" className="block text-sm font-medium text-gray-700">
                  Datum
                </label>
                <input
                  type="date"
                  id="day"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className={`mt-1 ${inputBase}`}
                />
              </div>
            )}

            {timeMode === 'week' && (
              <div className="grid grid-cols-2 gap-2">
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
            )}

            {timeMode === 'month' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monat & Jahr
                </label>
                <DateSelector
                  value={selectedMonth}
                  onChange={(value) => {
                    setSelectedMonth(value)
                    const monthStart = new Date(value.year, value.month, 1)
                    const monthEnd = new Date(value.year, value.month + 1, 0, 23, 59, 59)
                    setFilters({
                      startDate: monthStart.toISOString().split('T')[0],
                      endDate: monthEnd.toISOString().split('T')[0],
                    })
                  }}
                />
              </div>
            )}

            {timeMode === 'year' && (
              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700">
                  Jahr
                </label>
                <select
                  id="year"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className={`mt-1 ${inputBase}`}
                >
                  {Array.from({ length: 80 }, (_, i) => 2000 + i).map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Zeitverlauf-Chart (Full Width) */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Zeitverlauf</h2>
          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="label" 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="circle"
                />
                <Line 
                  type="monotone" 
                  dataKey="Umsatz" 
                  stroke="#facc15" 
                  strokeWidth={3}
                  dot={{ fill: '#facc15', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Ausgaben" 
                  stroke="#ef4444" 
                  strokeWidth={3}
                  dot={{ fill: '#ef4444', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Gewinn" 
                  stroke="#22c55e" 
                  strokeWidth={3}
                  dot={{ fill: '#22c55e', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Zwei Spalten: Ausgaben nach Kategorie + Umsatz pro Kunde */}
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Ausgaben nach Kategorie */}
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

          {/* Umsatz pro Kunde (Top 10) */}
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

        {/* Gewinn pro Mitarbeiter (Full Width) */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Gewinn pro Mitarbeiter</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stats.profitByEmployee.slice(0, 10).map((emp, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-gray-50">
                <span className="text-sm text-gray-700">{emp.name}</span>
                <span className={`text-sm font-medium ${emp.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(emp.profit)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
