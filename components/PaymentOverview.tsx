/**
 * Payment Overview Widget
 * Zeigt Zahlungen heute, Umsatz heute, beliebteste Methode
 */
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface PaymentStats {
  paymentsToday: number
  revenueToday: number
  topMethod: string
  totalPayments: number
}

export default function PaymentOverview() {
  const [stats, setStats] = useState<PaymentStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const response = await fetch(`/api/payments/stats?startDate=${today}&endDate=${today}`)
      if (!response.ok) throw new Error('Fehler beim Laden')
      
      const data = await response.json()
      
      // Berechne Top-Methode
      const methodCounts: Record<string, number> = {}
      if (data.paymentsByMethod) {
        data.paymentsByMethod.forEach((item: { method: string; count: number }) => {
          methodCounts[item.method] = item.count
        })
      }
      
      const topMethod = Object.entries(methodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Keine'
      
      setStats({
        paymentsToday: data.paymentsToday || 0,
        revenueToday: data.revenueToday || 0,
        topMethod: topMethod.replace('_', ' '),
        totalPayments: data.totalPayments || 0,
      })
    } catch (error) {
      console.error('Fehler:', error)
      setStats({
        paymentsToday: 0,
        revenueToday: 0,
        topMethod: 'Keine',
        totalPayments: 0,
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
    <Link href="/dashboard/payments" className="block">
      <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200 hover:shadow-md transition">
        <div className="flex items-center justify-between mb-4">
          <div className="text-2xl">💳</div>
          <span className="text-sm text-gray-500">Zahlungen</span>
        </div>
        <div className="space-y-2">
          <div>
            <div className="text-sm text-gray-600">Zahlungen heute</div>
            <div className="text-2xl font-bold text-gray-900">{stats?.paymentsToday || 0}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Umsatz heute</div>
            <div className="text-xl font-semibold text-green-600">
              {formatCurrency(stats?.revenueToday || 0)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Beliebteste Methode</div>
            <div className="text-sm font-medium text-gray-900">{stats?.topMethod}</div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <span className="text-xs text-indigo-600 hover:text-indigo-800">
            → Zu allen Zahlungen
          </span>
        </div>
      </div>
    </Link>
  )
}

