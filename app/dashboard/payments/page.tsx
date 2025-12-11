/**
 * Payments Dashboard Seite
 * Liste aller Zahlungen mit Filtern
 */
'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import Link from 'next/link'
import PaymentStatusBadge from '@/components/payments/PaymentStatusBadge'

interface Payment {
  id: string
  amount: number
  currency: string
  method: string
  status: string
  transactionId?: string | null
  reference?: string | null
  paidAt?: Date | null
  createdAt: Date
  customer?: {
    id: string
    firstName: string
    lastName: string
  } | null
  invoice?: {
    id: string
    invoiceNumber: string
  } | null
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<{
    todayCount: number
    todayRevenue: number
    failedCount: number
    mostPopularMethod: string
  } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    status: '',
    method: '',
    customerId: '',
  })

  useEffect(() => {
    fetchPayments()
    fetchStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  useEffect(() => {
    if (searchQuery.length >= 2) {
      handleSearch()
    } else if (searchQuery.length === 0) {
      fetchPayments()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.status) params.append('status', filters.status)
      if (filters.method) params.append('method', filters.method)
      if (filters.customerId) params.append('customerId', filters.customerId)

      const response = await fetch(`/api/payments/list?${params.toString()}`)
      if (!response.ok) throw new Error('Fehler beim Laden der Zahlungen')

      const data = await response.json()
      setPayments(data.payments || [])
    } catch (error) {
      console.error('Fehler:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/payments/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Fehler beim Laden der Statistiken:', error)
    }
  }

  const handleSearch = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/payments/search?query=${encodeURIComponent(searchQuery)}`)
      if (!response.ok) throw new Error('Fehler bei der Suche')

      const data = await response.json()
      setPayments(data.payments || [])
    } catch (error) {
      console.error('Fehler:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency || 'EUR',
    }).format(amount)
  }

  const getMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      STRIPE_CARD: '💳 Kartenzahlung',
      STRIPE_TERMINAL: '💳 Terminal',
      APPLE_PAY: '🍎 Apple Pay',
      GOOGLE_PAY: '📱 Google Pay',
      PAYPAL: '🅿️ PayPal',
      BANK_TRANSFER: '🏦 Überweisung',
      CASH: '💵 Barzahlung',
    }
    return labels[method] || method
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Zahlungen</h1>
              <p className="mt-2 text-sm text-gray-600">Übersicht aller Zahlungen</p>
            </div>
            <Link
              href="/dashboard/payments/pos"
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              🏧 Kasse öffnen
            </Link>
          </div>
        </div>

        {/* KPIs */}
        {stats && (
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-white p-4 shadow">
              <p className="text-sm text-gray-500">Zahlungen heute</p>
              <p className="text-2xl font-bold text-gray-900">{stats.todayCount}</p>
            </div>
            <div className="rounded-lg bg-white p-4 shadow">
              <p className="text-sm text-gray-500">Umsatz heute</p>
              <p className="text-2xl font-bold text-green-600">
                {new Intl.NumberFormat('de-DE', {
                  style: 'currency',
                  currency: 'EUR',
                }).format(stats.todayRevenue)}
              </p>
            </div>
            <div className="rounded-lg bg-white p-4 shadow">
              <p className="text-sm text-gray-500">Zahlungsausfälle</p>
              <p className="text-2xl font-bold text-red-600">{stats.failedCount}</p>
            </div>
            <div className="rounded-lg bg-white p-4 shadow">
              <p className="text-sm text-gray-500">Beliebteste Methode</p>
              <p className="text-2xl font-bold text-gray-900">
                {getMethodLabel(stats.mostPopularMethod || '')}
              </p>
            </div>
          </div>
        )}

        {/* Suche */}
        <div className="mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Suche nach Referenz, Kunde, Betrag..."
            className="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Filter */}
        <div className="mb-6 rounded-lg bg-white p-4 shadow">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Alle Status</option>
                <option value="PENDING">Ausstehend</option>
                <option value="PAID">Bezahlt</option>
                <option value="FAILED">Fehlgeschlagen</option>
                <option value="REFUNDED">Zurückerstattet</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Zahlungsmethode</label>
              <select
                value={filters.method}
                onChange={(e) => setFilters({ ...filters, method: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Alle Methoden</option>
                <option value="STRIPE_CARD">Kartenzahlung</option>
                <option value="STRIPE_TERMINAL">Terminal</option>
                <option value="APPLE_PAY">Apple Pay</option>
                <option value="GOOGLE_PAY">Google Pay</option>
                <option value="PAYPAL">PayPal</option>
                <option value="BANK_TRANSFER">Überweisung</option>
                <option value="CASH">Barzahlung</option>
              </select>
            </div>
            <div>
              <button
                onClick={() => setFilters({ status: '', method: '', customerId: '' })}
                className="mt-6 rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300"
              >
                Filter zurücksetzen
              </button>
            </div>
          </div>
        </div>

        {/* Zahlungen-Liste */}
        {loading ? (
          <div className="rounded-lg bg-white p-8 text-center">
            <p className="text-gray-500">Lade Zahlungen...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-center">
            <p className="text-gray-500">Keine Zahlungen gefunden</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Datum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Betrag
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Methode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Kunde
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Rechnung
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Referenz
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {format(new Date(payment.createdAt), 'dd.MM.yyyy HH:mm')}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">
                      {formatAmount(payment.amount, payment.currency)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {getMethodLabel(payment.method)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <PaymentStatusBadge status={payment.status as 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'} />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {payment.customer
                        ? `${payment.customer.firstName} ${payment.customer.lastName}`
                        : '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {payment.invoice ? payment.invoice.invoiceNumber : '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {payment.reference || payment.transactionId || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

