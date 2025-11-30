/**
 * Expense Statistics Component
 * Zeigt monatliche Fixkosten und Ausgabenübersicht
 */
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface ExpenseStats {
  monthlyRecurring: number
  monthlyExpenses: number
  totalExpenses: number
}

export default function ExpenseStats() {
  const [stats, setStats] = useState<ExpenseStats>({
    monthlyRecurring: 0,
    monthlyExpenses: 0,
    totalExpenses: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        // Auto-Generate bei Load
        await fetch('/api/expenses/generate-auto', {
          method: 'POST',
        })

        // Hole Daueraufträge
        const recurringRes = await fetch('/api/recurring-expenses')
        const recurringData = await recurringRes.json()

        // Berechne monatliche Fixkosten (nur aktive monatliche Daueraufträge)
        const monthlyRecurring = recurringData.recurringExpenses
          ?.filter((rec: { isActive: boolean; interval: string }) => 
            rec.isActive && rec.interval === 'MONTHLY'
          )
          .reduce((sum: number, rec: { amount: number }) => 
            sum + parseFloat(rec.amount.toString()), 0
          ) || 0

        // Hole Ausgaben für diesen Monat
        const now = new Date()
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

        const expensesRes = await fetch(
          `/api/expenses?startDate=${monthStart.toISOString()}&endDate=${monthEnd.toISOString()}`
        )
        const expensesData = await expensesRes.json()

        const monthlyExpenses = expensesData.expenses?.reduce(
          (sum: number, exp: { amount: number }) => 
            sum + parseFloat(exp.amount.toString()), 0
        ) || 0

        // Hole alle Ausgaben (für Total)
        const allExpensesRes = await fetch('/api/expenses')
        const allExpensesData = await allExpensesRes.json()

        const totalExpenses = allExpensesData.expenses?.reduce(
          (sum: number, exp: { amount: number }) => 
            sum + parseFloat(exp.amount.toString()), 0
        ) || 0

        setStats({
          monthlyRecurring,
          monthlyExpenses,
          totalExpenses,
        })
      } catch (error) {
        console.error('Fehler beim Laden der Ausgabenstatistiken:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-lg bg-gray-200 p-6 h-24"
          />
        ))}
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const cards = [
    {
      title: 'Monatliche Fixkosten',
      value: formatCurrency(stats.monthlyRecurring),
      icon: '💰',
      color: 'bg-red-500',
      link: '/dashboard/recurring-expenses',
    },
    {
      title: 'Ausgaben diesen Monat',
      value: formatCurrency(stats.monthlyExpenses),
      icon: '📊',
      color: 'bg-orange-500',
      link: '/dashboard/expenses',
    },
    {
      title: 'Gesamtausgaben',
      value: formatCurrency(stats.totalExpenses),
      icon: '💸',
      color: 'bg-purple-500',
      link: '/dashboard/expenses',
    },
  ]

  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Finanzen & Ausgaben</h2>
        <div className="flex gap-2">
          <Link
            href="/dashboard/recurring-expenses"
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            Daueraufträge →
          </Link>
          <Link
            href="/dashboard/expenses"
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            Ausgaben →
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {cards.map((card, index) => (
          <Link
            key={index}
            href={card.link}
            className="group relative overflow-hidden rounded-lg bg-white p-6 shadow hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
              <div className={`${card.color} rounded-full p-3 text-2xl`}>
                {card.icon}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

