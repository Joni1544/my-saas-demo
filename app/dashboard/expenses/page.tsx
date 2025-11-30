/**
 * Expenses Liste
 * Zeigt alle Ausgaben an (nur Admin)
 */
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { inputBase, selectBase } from '@/lib/inputStyles'

interface Expense {
  id: string
  name: string
  amount: number
  date: string
  category: string
  description: string | null
  recurringExpenseId: string | null
  invoiceUrl: string | null
  employee: {
    id: string
    user: {
      name: string | null
      email: string
    }
  } | null
  recurringExpense: {
    id: string
    name: string
  } | null
}

const CATEGORIES = [
  'Gehalt',
  'Miete',
  'Marketing',
  'Material',
  'Versicherung',
  'Steuern',
  'Sonstiges',
]

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    category: '',
  })

  useEffect(() => {
    // Auto-Generate bei Page-Load
    generateAutoExpenses()
    fetchExpenses()
  }, [filters])

  const generateAutoExpenses = async () => {
    try {
      await fetch('/api/expenses/generate-auto', {
        method: 'POST',
      })
    } catch (error) {
      console.error('Fehler beim Auto-Generieren:', error)
    }
  }

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      if (filters.category) params.append('category', filters.category)

      const response = await fetch(`/api/expenses?${params.toString()}`)
      if (!response.ok) {
        if (response.status === 403) {
          alert('Nur Administratoren können Ausgaben einsehen.')
          return
        }
        throw new Error('Fehler beim Laden')
      }
      const data = await response.json()
      setExpenses(data.expenses || [])
    } catch (error) {
      console.error('Fehler:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Ausgabe wirklich löschen?')) return

    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Fehler beim Löschen')
      fetchExpenses()
    } catch (error) {
      console.error('Fehler:', error)
      alert('Fehler beim Löschen')
    }
  }

  const totalAmount = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Lade Ausgaben...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ausgaben</h1>
            <p className="mt-2 text-gray-600">Verwalten Sie alle Ausgaben und Kosten</p>
          </div>
          <Link
            href="/dashboard/expenses/new"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            + Neue Ausgabe
          </Link>
        </div>

        {/* Filter */}
        <div className="mb-6 space-y-4 rounded-lg bg-white p-4 shadow">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                Von
              </label>
              <input
                type="date"
                id="startDate"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className={`mt-1 ${inputBase}`}
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
                className={`mt-1 ${inputBase}`}
              />
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Kategorie
              </label>
              <select
                id="category"
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className={`mt-1 ${selectBase}`}
              >
                <option value="">Alle Kategorien</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Gesamtausgaben</h2>
            <p className="text-2xl font-bold text-red-600">
              {new Intl.NumberFormat('de-DE', {
                style: 'currency',
                currency: 'EUR',
              }).format(totalAmount)}
            </p>
          </div>
        </div>

        {/* Expenses List */}
        {expenses.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center shadow">
            <p className="text-gray-500">Keine Ausgaben gefunden</p>
          </div>
        ) : (
          <div className="space-y-4">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="rounded-lg bg-white p-6 shadow hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{expense.name}</h3>
                      <span className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                        {expense.category}
                      </span>
                      {expense.recurringExpenseId && (
                        <span className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                          Dauerauftrag: {expense.recurringExpense?.name || 'Unbekannt'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {format(new Date(expense.date), 'dd.MM.yyyy')}
                    </p>
                    {expense.description && (
                      <p className="text-sm text-gray-500 mb-2">{expense.description}</p>
                    )}
                    {expense.employee && (
                      <p className="text-xs text-gray-500">
                        Mitarbeiter: {expense.employee.user.name || expense.employee.user.email}
                      </p>
                    )}
                  </div>
                  <div className="ml-4 flex items-center gap-4">
                    <p className="text-xl font-bold text-red-600">
                      {new Intl.NumberFormat('de-DE', {
                        style: 'currency',
                        currency: 'EUR',
                      }).format(parseFloat(expense.amount.toString()))}
                    </p>
                    <div className="flex gap-2">
                      <Link
                        href={`/dashboard/expenses/${expense.id}/edit`}
                        className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-500"
                      >
                        Bearbeiten
                      </Link>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-500"
                      >
                        Löschen
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

