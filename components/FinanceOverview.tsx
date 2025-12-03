/**
 * Finanzen-Kurzübersicht Komponente
 * Zeigt: Monatsumsatz, Monatliche Fixkosten, Gewinn/Verlust
 */
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { getEffectiveRole } from '@/lib/view-mode'

interface FinanceOverview {
  monthlyRevenue: number
  monthlyFixedCosts: number
  profit: number
}

export default function FinanceOverview() {
  const { data: session } = useSession()
  const [viewMode, setViewMode] = useState<'admin' | 'employee'>('admin')
  const [finance, setFinance] = useState<FinanceOverview>({
    monthlyRevenue: 0,
    monthlyFixedCosts: 0,
    profit: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Lade View-Mode aus localStorage
    const savedMode = localStorage.getItem('viewMode') as 'admin' | 'employee' | null
    if (savedMode) {
      setViewMode(savedMode)
    }
  }, [])

  useEffect(() => {
    async function fetchFinance() {
      try {
        const now = new Date()
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

        // Parallele Requests
        const [appointmentsRes, expensesRes, recurringRes] = await Promise.all([
          fetch(`/api/appointments?startDate=${monthStart.toISOString()}&endDate=${monthEnd.toISOString()}`),
          fetch(`/api/expenses?startDate=${monthStart.toISOString()}&endDate=${monthEnd.toISOString()}`),
          fetch('/api/recurring-expenses').catch(() => null), // Kann fehlschlagen wenn API nicht existiert
        ])

        const appointmentsData = await appointmentsRes.json()
        const expensesData = await expensesRes.json()

        // Berechne Monatsumsatz (nur COMPLETED/DONE)
        const monthlyRevenue = appointmentsData.appointments
          ?.filter(
            (apt: { status: string; price: number | null; startTime: string }) => {
              const aptDate = new Date(apt.startTime)
              return (
                (apt.status === 'COMPLETED' || apt.status === 'DONE') &&
                apt.price !== null &&
                apt.price !== undefined &&
                aptDate >= monthStart &&
                aptDate <= monthEnd
              )
            }
          )
          .reduce((sum: number, apt: { price: number | null }) => {
            const price = apt.price || 0
            return sum + (typeof price === 'number' ? price : parseFloat(String(price)))
          }, 0) || 0

        // Berechne Monatliche Fixkosten (Gehälter + Recurring Expenses)
        let monthlyFixedCosts = 0

        // Ausgaben diesen Monat
        const monthlyExpenses =
          expensesData.expenses?.reduce(
            (sum: number, exp: { amount: number }) => sum + parseFloat(exp.amount.toString()),
            0
          ) || 0

        // Recurring Expenses (monatlich)
        if (recurringRes && recurringRes.ok) {
          const recurringData = await recurringRes.json()
          const recurringMonthly =
            recurringData.recurringExpenses
              ?.filter(
                (rec: { isActive: boolean; interval: string }) =>
                  rec.isActive && rec.interval === 'MONTHLY'
              )
              .reduce(
                (sum: number, rec: { amount: number }) => sum + parseFloat(rec.amount.toString()),
                0
              ) || 0
          monthlyFixedCosts = monthlyExpenses + recurringMonthly
        } else {
          monthlyFixedCosts = monthlyExpenses
        }

        const profit = monthlyRevenue - monthlyFixedCosts

        setFinance({
          monthlyRevenue,
          monthlyFixedCosts,
          profit,
        })
      } catch (error) {
        console.error('Fehler beim Laden der Finanzübersicht:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFinance()
  }, [])

  // Prüfe ob Komponente angezeigt werden soll
  const effectiveRole = getEffectiveRole(session?.user?.role || 'MITARBEITER', viewMode)
  if (effectiveRole !== 'ADMIN') {
    return null
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const cards = [
    {
      title: 'Monatsumsatz',
      value: formatCurrency(finance.monthlyRevenue),
      icon: '💰',
      color: 'bg-yellow-50 text-yellow-700',
      iconBg: 'bg-yellow-100',
    },
    {
      title: 'Monatliche Fixkosten',
      value: formatCurrency(finance.monthlyFixedCosts),
      icon: '💸',
      color: 'bg-red-50 text-red-700',
      iconBg: 'bg-red-100',
    },
    {
      title: 'Gewinn/Verlust',
      value: formatCurrency(finance.profit),
      icon: finance.profit >= 0 ? '📈' : '📉',
      color: finance.profit >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700',
      iconBg: finance.profit >= 0 ? 'bg-green-100' : 'bg-red-100',
    },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse rounded-lg bg-gray-100 h-20" />
        ))}
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-white p-5 shadow-sm border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-700 mb-4">Finanzen-Kurzübersicht</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-lg bg-gray-50 p-4 border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 mb-1">{card.title}</p>
                <p className={`text-2xl font-bold ${card.color.split(' ')[1]}`}>{card.value}</p>
              </div>
              <div className={`${card.iconBg} rounded-lg p-2`}>
                <span className="text-lg">{card.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-gray-200">
        <Link
          href="/dashboard/finance"
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          → Zur Finanzübersicht
        </Link>
      </div>
    </div>
  )
}

