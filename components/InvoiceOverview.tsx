/**
 * Invoice Overview Widget
 * Zeigt offene Rechnungen, überfällige, Gesamtbetrag
 */
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface InvoiceStats {
  openInvoices: number
  overdueInvoices: number
  totalOpenAmount: number
  totalOverdueAmount: number
}

export default function InvoiceOverview() {
  const [stats, setStats] = useState<InvoiceStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/invoices?status=PENDING')
      if (!response.ok) throw new Error('Fehler beim Laden')
      
      const data = await response.json()
      const invoices = data.invoices || []
      
      const now = new Date()
      const overdue = invoices.filter((inv: { dueDate: string; status: string }) => {
        if (inv.status !== 'PENDING') return false
        if (!inv.dueDate) return false
        const dueDate = new Date(inv.dueDate)
        return dueDate < now
      })
      
      const totalOpenAmount = invoices.reduce((sum: number, inv: { totalAmount: number }) => 
        sum + (inv.totalAmount || 0), 0
      )
      
      const totalOverdueAmount = overdue.reduce((sum: number, inv: { totalAmount: number }) => 
        sum + (inv.totalAmount || 0), 0
      )
      
      setStats({
        openInvoices: invoices.length,
        overdueInvoices: overdue.length,
        totalOpenAmount,
        totalOverdueAmount,
      })
    } catch (error) {
      console.error('Fehler:', error)
      setStats({
        openInvoices: 0,
        overdueInvoices: 0,
        totalOpenAmount: 0,
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

  return (
    <Link href="/dashboard/invoices" className="block">
      <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200 hover:shadow-md transition">
        <div className="flex items-center justify-between mb-4">
          <div className="text-2xl">📄</div>
          <span className="text-sm text-gray-500">Rechnungen</span>
        </div>
        <div className="space-y-2">
          <div>
            <div className="text-sm text-gray-600">Offene Rechnungen</div>
            <div className="text-2xl font-bold text-gray-900">{stats?.openInvoices || 0}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Überfällige</div>
            <div className={`text-xl font-semibold ${(stats?.overdueInvoices || 0) > 0 ? 'text-red-600' : 'text-gray-600'}`}>
              {stats?.overdueInvoices || 0}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Gesamtbetrag offen</div>
            <div className="text-lg font-medium text-gray-900">
              {formatCurrency(stats?.totalOpenAmount || 0)}
            </div>
          </div>
          {(stats?.overdueInvoices || 0) > 0 && (
            <div>
              <div className="text-sm text-gray-600">Überfälliger Betrag</div>
              <div className="text-lg font-medium text-red-600">
                {formatCurrency(stats?.totalOverdueAmount || 0)}
              </div>
            </div>
          )}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <span className="text-xs text-indigo-600 hover:text-indigo-800">
            → Zu allen Rechnungen
          </span>
        </div>
      </div>
    </Link>
  )
}

