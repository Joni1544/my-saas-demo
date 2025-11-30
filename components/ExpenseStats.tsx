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

        // Berechne monatliche Fixkosten (Gehälter aus RecurringExpenses)
        // Nur für interne Verwendung - keine UI mehr für Daueraufträge
        let monthlyRecurring = 0
        try {
          const recurringRes = await fetch('/api/recurring-expenses')
          if (recurringRes.ok) {
            const recurringData = await recurringRes.json()
            monthlyRecurring = recurringData.recurringExpenses
              ?.filter((rec: { isActive: boolean; interval: string }) => 
                rec.isActive && rec.interval === 'MONTHLY'
              )
              .reduce((sum: number, rec: { amount: number }) => 
                sum + parseFloat(rec.amount.toString()), 0
              ) || 0
          }
        } catch {
          // Ignoriere Fehler - API könnte nicht mehr existieren
        }

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
      link: '/dashboard/expenses',
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
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Finanzen & Ausgaben</h2>
        <p className="text-gray-600 mt-1">Übersicht über Ihre Finanzen</p>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {cards.map((card, index) => (
          <Link
            key={index}
            href={card.link}
            className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">{card.title}</p>
                <p className="text-3xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors duration-300">{card.value}</p>
              </div>
              <div className={`${card.color} rounded-2xl p-4 shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                <span className="text-3xl block">{card.icon}</span>
              </div>
            </div>
            <div className={`absolute bottom-0 left-0 right-0 h-1 ${card.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`} />
          </Link>
        ))}
      </div>
    </div>
  )
}

