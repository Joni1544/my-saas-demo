/**
 * Umsatz-Dashboard
 * NEU: Vier Zeitmodi (Tag/Woche/Monat/Jahr) + Graph mit gelber Farbe
 */
'use client'

import { useState, useEffect, useMemo } from 'react'
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, getWeek } from 'date-fns'
import DateSelector from '@/components/DateSelector'
import { inputBase } from '@/lib/inputStyles'
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

interface RevenueData {
  labels: string[]
  revenue: number[]
  total: number
}

interface RevenueStats {
  period: string
  dateStart: string
  dateEnd: string
  totalRevenue: number
  appointmentCount: number
  revenueByCustomer: Array<{
    id: string
    name: string
    revenue: number
    count: number
  }>
  revenueByEmployee: Array<{
    id: string
    name: string
    revenue: number
    count: number
  }>
  topCustomers: Array<{
    id: string
    name: string
    revenue: number
    count: number
  }>
  noShows: number
  recurringCustomers: number
}

type TimeMode = 'day' | 'week' | 'month' | 'year'

export default function RevenuePage() {
  const [timeMode, setTimeMode] = useState<TimeMode>('month')
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [selectedWeek, setSelectedWeek] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [selectedMonth, setSelectedMonth] = useState({ month: new Date().getMonth(), year: new Date().getFullYear() })
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null)
  const [stats, setStats] = useState<RevenueStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRevenueData()
    fetchStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeMode, selectedDate, selectedWeek, selectedMonth, selectedYear])

  const fetchRevenueData = async () => {
    try {
      let dateParam: string
      
      if (timeMode === 'day') {
        dateParam = selectedDate
      } else if (timeMode === 'week') {
        dateParam = selectedWeek
      } else if (timeMode === 'month') {
        dateParam = format(new Date(selectedMonth.year, selectedMonth.month, 1), 'yyyy-MM-dd')
      } else {
        dateParam = format(new Date(selectedYear, 0, 1), 'yyyy-MM-dd')
      }

      const response = await fetch(`/api/revenue?mode=${timeMode}&date=${dateParam}`)
      if (!response.ok) throw new Error('Fehler beim Laden der Umsatz-Daten')
      const data = await response.json()
      setRevenueData(data)
    } catch (error) {
      console.error('Fehler:', error)
    }
  }

  const fetchStats = async () => {
    try {
      let startDate: Date
      let endDate: Date

      if (timeMode === 'day') {
        const date = new Date(selectedDate)
        startDate = startOfDay(date)
        endDate = endOfDay(date)
      } else if (timeMode === 'week') {
        const date = new Date(selectedWeek)
        startDate = startOfWeek(date, { weekStartsOn: 1 })
        endDate = endOfWeek(date, { weekStartsOn: 1 })
      } else if (timeMode === 'month') {
        startDate = new Date(selectedMonth.year, selectedMonth.month, 1)
        endDate = new Date(selectedMonth.year, selectedMonth.month + 1, 0, 23, 59, 59)
      } else {
        startDate = new Date(selectedYear, 0, 1)
        endDate = new Date(selectedYear, 11, 31, 23, 59, 59)
      }

      const response = await fetch(
        `/api/stats/revenue?period=${timeMode}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      )
      if (!response.ok) throw new Error('Fehler beim Laden der Statistiken')
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

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg bg-white p-4 shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const chartData = useMemo(() => {
    if (!revenueData) return []
    return revenueData.labels.map((label, index) => ({
      name: label,
      Umsatz: revenueData.revenue[index],
    }))
  }, [revenueData])

  const getWeekLabel = () => {
    if (timeMode !== 'week') return ''
    const date = new Date(selectedWeek)
    const week = getWeek(date, { weekStartsOn: 1 })
    return `KW ${week}/${date.getFullYear()}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Lade Statistiken...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Umsatz-Dashboard</h1>
          <p className="mt-2 text-gray-600">Detaillierte Umsatz-Statistiken und Analysen</p>
        </div>

        {/* Zeitmodus-Auswahl */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Zeitraum</label>
            <div className="flex gap-2">
              <button
                onClick={() => setTimeMode('day')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  timeMode === 'day'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Tag
              </button>
              <button
                onClick={() => setTimeMode('week')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  timeMode === 'week'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Woche
              </button>
              <button
                onClick={() => setTimeMode('month')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  timeMode === 'month'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Monat
              </button>
              <button
                onClick={() => setTimeMode('year')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  timeMode === 'year'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Jahr
              </button>
            </div>
          </div>

          {/* Datumsauswahl basierend auf Modus */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              <div>
                <label htmlFor="week" className="block text-sm font-medium text-gray-700">
                  Woche (Datum auswählen)
                </label>
                <input
                  type="date"
                  id="week"
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                  className={`mt-1 ${inputBase}`}
                />
                {getWeekLabel() && (
                  <p className="mt-1 text-sm text-gray-600">{getWeekLabel()}</p>
                )}
              </div>
            )}

            {timeMode === 'month' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monat & Jahr
                </label>
                <DateSelector
                  value={selectedMonth}
                  onChange={(value) => setSelectedMonth(value)}
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
                  {Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - 10 + i).map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Key Metrics */}
        {stats && (
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="text-sm font-medium text-gray-600">Gesamtumsatz</div>
              <div className="mt-2 text-3xl font-bold text-yellow-600">
                {formatCurrency(stats.totalRevenue)}
              </div>
            </div>
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="text-sm font-medium text-gray-600">Anzahl Termine</div>
              <div className="mt-2 text-3xl font-bold text-gray-900">{stats.appointmentCount}</div>
              <div className="mt-1 text-xs text-gray-500">Abgeschlossen</div>
            </div>
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="text-sm font-medium text-gray-600">Durchschnitt</div>
              <div className="mt-2 text-3xl font-bold text-gray-900">
                {stats.appointmentCount > 0
                  ? formatCurrency(stats.totalRevenue / stats.appointmentCount)
                  : formatCurrency(0)}
              </div>
              <div className="mt-1 text-xs text-gray-500">Pro Termin</div>
            </div>
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="text-sm font-medium text-gray-600">No-Shows</div>
              <div className="mt-2 text-3xl font-bold text-red-600">{stats.noShows}</div>
              <div className="mt-1 text-xs text-gray-500">Stornierte Termine</div>
            </div>
          </div>
        )}

        {/* Umsatz-Graph */}
        {revenueData && (
          <div className="mb-6 rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Umsatz-Verlauf</h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Umsatz"
                  stroke="#facc15"
                  strokeWidth={3}
                  dot={{ fill: '#facc15', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Statistiken */}
        {stats && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Top Kunden */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Top Kunden</h2>
              {stats.topCustomers.length > 0 ? (
                <div className="space-y-3">
                  {stats.topCustomers.map((customer, index) => (
                    <div key={customer.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{customer.name}</div>
                          <div className="text-sm text-gray-500">{customer.count} Termine</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          {formatCurrency(customer.revenue)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Keine Daten verfügbar</p>
              )}
            </div>

            {/* Umsatz pro Mitarbeiter */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Umsatz pro Mitarbeiter</h2>
              {stats.revenueByEmployee.length > 0 ? (
                <div className="space-y-3">
                  {stats.revenueByEmployee.map((employee) => (
                    <div key={employee.id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{employee.name}</div>
                        <div className="text-sm text-gray-500">{employee.count} Termine</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          {formatCurrency(employee.revenue)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Keine Daten verfügbar</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
