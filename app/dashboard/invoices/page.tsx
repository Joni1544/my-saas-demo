/**
 * Invoices List Page
 * Liste aller Rechnungen mit Filtern
 */
'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import Link from 'next/link'
import InvoiceStatusBadge from '@/components/invoices/InvoiceStatusBadge'

type InvoiceStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'

interface Invoice {
  id: string
  invoiceNumber: string
  totalAmount: number
  currency: string
  status: InvoiceStatus
  dueDate: string
  createdAt: string
  customer?: {
    id: string
    firstName: string
    lastName: string
  } | null
  employee?: {
    id: string
    firstName: string
    lastName: string
  } | null
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<{
    totalOpen: number
    totalOverdue: number
    totalAmount: number
    overdueAmount: number
  } | null>(null)
  const [filters, setFilters] = useState({
    status: '',
    customerId: '',
    startDate: '',
    endDate: '',
  })

  useEffect(() => {
    fetchInvoices()
    fetchStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.status) params.append('status', filters.status)
      if (filters.customerId) params.append('customerId', filters.customerId)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)

      const response = await fetch(`/api/invoices?${params.toString()}`)
      if (!response.ok) throw new Error('Fehler beim Laden der Rechnungen')

      const data = await response.json()
      setInvoices(data.invoices || [])
    } catch (error) {
      console.error('Fehler:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/invoices?status=PENDING')
      if (response.ok) {
        const data = await response.json()
        const invoices = data.invoices || []
        const now = new Date()
        const overdue = invoices.filter((inv: Invoice) => {
          if (inv.status !== 'PENDING') return false
          if (!inv.dueDate) return false
          const dueDate = new Date(inv.dueDate)
          return dueDate < now
        })
        
        const totalAmount = invoices.reduce((sum: number, inv: Invoice) => 
          sum + (inv.totalAmount || 0), 0
        )
        
        const overdueAmount = overdue.reduce((sum: number, inv: Invoice) => 
          sum + (inv.totalAmount || 0), 0
        )
        
        setStats({
          totalOpen: invoices.length,
          totalOverdue: overdue.length,
          totalAmount,
          overdueAmount,
        })
      }
    } catch (error) {
      console.error('Fehler beim Laden der Statistiken:', error)
    }
  }

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency,
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Rechnungen</h1>
            <p className="mt-2 text-gray-600">Verwalten Sie alle Ihre Rechnungen</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/dashboard/invoices/templates"
              className="rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 transition-colors"
            >
              Templates →
            </Link>
            <Link
              href="/dashboard/invoices/new"
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
            >
              Neue Rechnung
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="rounded-lg bg-white p-4 shadow">
              <div className="text-sm font-medium text-gray-600">Offene Rechnungen</div>
              <div className="mt-2 text-2xl font-bold text-gray-900">{stats.totalOpen}</div>
            </div>
            <div className="rounded-lg bg-white p-4 shadow">
              <div className="text-sm font-medium text-gray-600">Überfällige</div>
              <div className={`mt-2 text-2xl font-bold ${stats.totalOverdue > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                {stats.totalOverdue}
              </div>
            </div>
            <div className="rounded-lg bg-white p-4 shadow">
              <div className="text-sm font-medium text-gray-600">Gesamtbetrag offen</div>
              <div className="mt-2 text-xl font-semibold text-gray-900">
                {formatCurrency(stats.totalAmount)}
              </div>
            </div>
            <div className="rounded-lg bg-white p-4 shadow">
              <div className="text-sm font-medium text-gray-600">Überfälliger Betrag</div>
              <div className={`mt-2 text-xl font-semibold ${stats.overdueAmount > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                {formatCurrency(stats.overdueAmount)}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 rounded-lg bg-white p-4 shadow">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Alle</option>
                <option value="PENDING">Ausstehend</option>
                <option value="PAID">Bezahlt</option>
                <option value="OVERDUE">Überfällig</option>
                <option value="CANCELLED">Storniert</option>
              </select>
            </div>
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                Von
              </label>
              <input
                type="date"
                id="startDate"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <button
                onClick={() => setFilters({ status: '', customerId: '', startDate: '', endDate: '' })}
                className="mt-6 rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 transition-colors"
              >
                Filter zurücksetzen
              </button>
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        {loading ? (
          <div className="rounded-lg bg-white p-12 shadow text-center">
            <p className="text-gray-500">Lade Rechnungen...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="rounded-lg bg-white p-12 shadow text-center">
            <p className="text-gray-500">Keine Rechnungen gefunden</p>
            <Link
              href="/dashboard/invoices/new"
              className="mt-4 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
            >
              Erste Rechnung erstellen
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Rechnungsnummer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Kunde
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Betrag
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Fälligkeitsdatum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Erstellt
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {invoice.customer
                        ? `${invoice.customer.firstName} ${invoice.customer.lastName}`
                        : '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {formatCurrency(invoice.totalAmount, invoice.currency)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <InvoiceStatusBadge status={invoice.status} />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {format(new Date(invoice.dueDate), 'dd.MM.yyyy')}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {format(new Date(invoice.createdAt), 'dd.MM.yyyy')}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <Link
                        href={`/dashboard/invoices/${invoice.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Details →
                      </Link>
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

