/**
 * Reminders Dashboard
 * Übersicht über Mahnungen
 */
'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import Link from 'next/link'

interface Reminder {
  id: string
  invoiceId: string
  level: number
  status: string
  reminderDate: Date
  method: string | null
  aiText: string | null
  createdAt: Date
  invoice: {
    id: string
    invoiceNumber: string
    amount: number
    currency: string
    dueDate: Date | null
    reminderLevel: number
    customer: {
      id: string
      firstName: string
      lastName: string
    } | null
  }
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    level: '',
    status: '',
  })

  useEffect(() => {
    fetchReminders()
    fetchStats()
  }, [filters])

  const fetchReminders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.level) params.append('level', filters.level)
      if (filters.status) params.append('status', filters.status)

      const response = await fetch(`/api/invoices/reminders?${params.toString()}`)
      if (!response.ok) throw new Error('Fehler beim Laden der Mahnungen')

      const data = await response.json()
      setReminders(data.reminders || [])
    } catch (error) {
      console.error('Fehler:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/invoices/reminders/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Fehler:', error)
    }
  }

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency || 'EUR',
    }).format(amount)
  }

  const calculateDaysOverdue = (dueDate: Date | null) => {
    if (!dueDate) return 0
    const now = new Date()
    const days = Math.floor((now.getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(0, days)
  }

  const getLevelColor = (level: number) => {
    switch (level) {
      case 1:
        return 'bg-yellow-100 text-yellow-800'
      case 2:
        return 'bg-orange-100 text-orange-800'
      case 3:
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SENT':
        return 'bg-green-100 text-green-800'
      case 'FAILED':
        return 'bg-red-100 text-red-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">📬 Mahnwesen</h1>
          <p className="mt-2 text-sm text-gray-600">Übersicht über alle Mahnungen</p>
        </div>

        {/* KPIs */}
        {stats && (
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-5">
            <div className="rounded-lg bg-white p-4 shadow">
              <p className="text-sm text-gray-500">Überfällige Rechnungen</p>
              <p className="text-2xl font-bold text-gray-900">{stats.overdueCount}</p>
            </div>
            <div className="rounded-lg bg-white p-4 shadow">
              <p className="text-sm text-gray-500">Erinnerungen heute</p>
              <p className="text-2xl font-bold text-gray-900">{stats.todaySent}</p>
            </div>
            <div className="rounded-lg bg-white p-4 shadow">
              <p className="text-sm text-gray-500">Level 1</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.level1Count}</p>
            </div>
            <div className="rounded-lg bg-white p-4 shadow">
              <p className="text-sm text-gray-500">Level 2</p>
              <p className="text-2xl font-bold text-orange-600">{stats.level2Count}</p>
            </div>
            <div className="rounded-lg bg-white p-4 shadow">
              <p className="text-sm text-gray-500">Level 3</p>
              <p className="text-2xl font-bold text-red-600">{stats.level3Count}</p>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="mb-6 rounded-lg bg-white p-4 shadow">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Mahnstufe</label>
              <select
                value={filters.level}
                onChange={(e) => setFilters({ ...filters, level: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Alle Stufen</option>
                <option value="1">Level 1</option>
                <option value="2">Level 2</option>
                <option value="3">Level 3</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Alle Status</option>
                <option value="PENDING">Ausstehend</option>
                <option value="SENT">Gesendet</option>
                <option value="FAILED">Fehlgeschlagen</option>
              </select>
            </div>
            <div>
              <button
                onClick={() => setFilters({ level: '', status: '' })}
                className="mt-6 rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300"
              >
                Filter zurücksetzen
              </button>
            </div>
          </div>
        </div>

        {/* Mahnungen-Liste */}
        {loading ? (
          <div className="rounded-lg bg-white p-8 text-center">
            <p className="text-gray-500">Lade Mahnungen...</p>
          </div>
        ) : reminders.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-center">
            <p className="text-gray-500">Keine Mahnungen gefunden</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Rechnung
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Kunde
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Betrag
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Tage überfällig
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Letzte Mahnung
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {reminders.map((reminder) => {
                  const daysOverdue = calculateDaysOverdue(reminder.invoice.dueDate)
                  return (
                    <tr key={reminder.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <Link
                          href={`/dashboard/invoices/${reminder.invoiceId}`}
                          className="font-medium text-indigo-600 hover:text-indigo-500"
                        >
                          {reminder.invoice.invoiceNumber}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {reminder.invoice.customer
                          ? `${reminder.invoice.customer.firstName} ${reminder.invoice.customer.lastName}`
                          : '-'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">
                        {formatAmount(Number(reminder.invoice.amount), reminder.invoice.currency)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${getLevelColor(reminder.level)}`}
                        >
                          Level {reminder.level}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(reminder.status)}`}
                        >
                          {reminder.status === 'SENT' ? 'Gesendet' : reminder.status === 'FAILED' ? 'Fehlgeschlagen' : 'Ausstehend'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        <span className={daysOverdue > 20 ? 'font-semibold text-red-600' : ''}>
                          {daysOverdue} Tage
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {format(new Date(reminder.reminderDate), 'dd.MM.yyyy')}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <Link
                            href={`/dashboard/invoices/${reminder.invoiceId}`}
                            className="text-indigo-600 hover:text-indigo-500"
                          >
                            Details
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

