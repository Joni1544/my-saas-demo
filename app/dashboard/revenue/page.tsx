/**
 * Umsatz-Dashboard
 * Statistiken: Tag, Woche, Monat, Jahr
 * Top Kunden, No-Shows, Wiederkehrende Kunden
 */
'use client'

import { useState, useEffect } from 'react'
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'
import DateSelector from '@/components/DateSelector'

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

type Period = 'day' | 'week' | 'month' | 'year' | 'custom'

export default function RevenuePage() {
  const [period, setPeriod] = useState<Period>('month')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [selectedMonth, setSelectedMonth] = useState({ month: new Date().getMonth(), year: new Date().getFullYear() })
  const [stats, setStats] = useState<RevenueStats | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    try {
      setLoading(true)
      let url = `/api/stats/revenue?period=${period}`
      if (customStartDate && customEndDate) {
        url += `&startDate=${customStartDate}&endDate=${customEndDate}`
      } else if (period === 'month' && selectedMonth) {
        // Verwende selectedMonth für Monatsansicht
        const monthStart = new Date(selectedMonth.year, selectedMonth.month, 1)
        const monthEnd = new Date(selectedMonth.year, selectedMonth.month + 1, 0, 23, 59, 59)
        url += `&startDate=${monthStart.toISOString()}&endDate=${monthEnd.toISOString()}`
      }
      const response = await fetch(url)
      if (!response.ok) throw new Error('Fehler beim Laden der Statistiken')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Fehler:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [period, customStartDate, customEndDate, selectedMonth])

  useEffect(() => {
    if (period === 'month') {
      fetchStats()
    }
  }, [selectedMonth])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const getPeriodLabel = () => {
    switch (period) {
      case 'day':
        return 'Heute'
      case 'week':
        return 'Diese Woche'
      case 'month':
        return 'Dieser Monat'
      case 'year':
        return 'Dieses Jahr'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Lade Statistiken...</p>
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Umsatz-Dashboard</h1>
          <p className="mt-2 text-gray-600">Detaillierte Umsatz-Statistiken und Analysen</p>
        </div>

        {/* Period Selector & Custom Date Range */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Period Buttons */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Zeitraum</label>
              <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                {(['day', 'week', 'month', 'year'] as Period[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setPeriod(p)
                      setCustomStartDate('')
                      setCustomEndDate('')
                    }}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                      period === p && !customStartDate
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    } ${p === 'day' ? '' : 'border-l border-gray-300'}`}
                  >
                    {p === 'day' ? 'Tag' : p === 'week' ? 'Woche' : p === 'month' ? 'Monat' : 'Jahr'}
                  </button>
                ))}
              </div>
            </div>

            {/* DateSelector für Monatsansicht */}
            {period === 'month' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Monat & Jahr</label>
                <DateSelector
                  value={selectedMonth}
                  onChange={(value) => {
                    setSelectedMonth(value)
                    setPeriod('month')
                  }}
                />
              </div>
            )}

            {/* Custom Date Range */}
            {period === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Eigener Zeitraum</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => {
                        setCustomStartDate(e.target.value)
                        if (e.target.value && customEndDate) {
                          setPeriod('custom' as Period)
                        }
                      }}
                      className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-black shadow-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="Von"
                    />
                  </div>
                  <div>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => {
                        setCustomEndDate(e.target.value)
                        if (customStartDate && e.target.value) {
                          setPeriod('custom' as Period)
                        }
                      }}
                      className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-black shadow-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="Bis"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="text-sm font-medium text-gray-600">Gesamtumsatz</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">
              {formatCurrency(stats.totalRevenue)}
            </div>
            <div className="mt-1 text-xs text-gray-500">{getPeriodLabel()}</div>
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

        {/* Umsatz pro Kunde (vollständige Liste) */}
        <div className="mt-6 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Umsatz pro Kunde</h2>
          {stats.revenueByCustomer.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Kunde
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Termine
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Umsatz
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Durchschnitt
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {stats.revenueByCustomer.map((customer) => (
                    <tr key={customer.id}>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                        {customer.name}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {customer.count}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold text-gray-900">
                        {formatCurrency(customer.revenue)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-500">
                        {formatCurrency(customer.revenue / customer.count)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Keine Daten verfügbar</p>
          )}
        </div>

        {/* Zusätzliche Metriken */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Wiederkehrende Kunden</h3>
            <div className="text-3xl font-bold text-indigo-600">{stats.recurringCustomers}</div>
            <div className="mt-1 text-sm text-gray-500">Kunden mit mehr als 1 Termin</div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Zeitraum</h3>
            <div className="text-sm text-gray-600">
              {format(new Date(stats.dateStart), 'dd.MM.yyyy')} -{' '}
              {format(new Date(stats.dateEnd), 'dd.MM.yyyy')}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

