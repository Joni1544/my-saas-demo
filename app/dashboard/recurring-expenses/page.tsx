/**
 * Daueraufträge-Seite
 * Liste aller Daueraufträge mit Bearbeiten/Löschen/Pausieren
 */
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { inputBase, selectBase, textareaBase } from '@/lib/inputStyles'

interface RecurringExpense {
  id: string
  name: string
  amount: number
  category: string
  interval: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  startDate: string
  nextRun: string
  description: string | null
  isActive: boolean
  createdAt: string
}

const INTERVALS = [
  { value: 'DAILY', label: 'Täglich' },
  { value: 'WEEKLY', label: 'Wöchentlich' },
  { value: 'MONTHLY', label: 'Monatlich' },
  { value: 'YEARLY', label: 'Jährlich' },
]

const CATEGORIES = [
  'Gehalt',
  'Miete',
  'Marketing',
  'Material',
  'Versicherung',
  'Steuern',
  'Sonstiges',
]

export default function RecurringExpensesPage() {
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category: '',
    interval: 'MONTHLY' as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY',
    startDate: new Date().toISOString().split('T')[0],
    description: '',
    isActive: true,
  })

  useEffect(() => {
    generateAutoExpenses()
    fetchRecurringExpenses()
  }, [])

  const generateAutoExpenses = async () => {
    try {
      await fetch('/api/expenses/generate-auto', {
        method: 'POST',
      })
    } catch (error) {
      console.error('Fehler beim Auto-Generieren:', error)
    }
  }

  const fetchRecurringExpenses = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/recurring-expenses')
      if (!response.ok) {
        if (response.status === 403) {
          alert('Nur Administratoren können Daueraufträge einsehen.')
          return
        }
        throw new Error('Fehler beim Laden')
      }
      const data = await response.json()
      setRecurringExpenses(data.recurringExpenses || [])
    } catch (error) {
      console.error('Fehler:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingId(null)
    setFormData({
      name: '',
      amount: '',
      category: '',
      interval: 'MONTHLY',
      startDate: new Date().toISOString().split('T')[0],
      description: '',
      isActive: true,
    })
    setShowModal(true)
  }

  const handleEdit = (expense: RecurringExpense) => {
    setEditingId(expense.id)
    setFormData({
      name: expense.name,
      amount: expense.amount.toString(),
      category: expense.category,
      interval: expense.interval,
      startDate: new Date(expense.startDate).toISOString().split('T')[0],
      description: expense.description || '',
      isActive: expense.isActive,
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingId
        ? `/api/recurring-expenses/${editingId}`
        : '/api/recurring-expenses'
      const method = editingId ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Fehler beim Speichern')
      }

      setShowModal(false)
      fetchRecurringExpenses()
    } catch (error: unknown) {
      console.error('Fehler:', error)
      alert((error instanceof Error ? error.message : 'Fehler beim Speichern'))
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Dauerauftrag wirklich löschen?')) return

    try {
      const response = await fetch(`/api/recurring-expenses/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Fehler beim Löschen')
      fetchRecurringExpenses()
    } catch (error) {
      console.error('Fehler:', error)
      alert('Fehler beim Löschen')
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/recurring-expenses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      })
      if (!response.ok) throw new Error('Fehler beim Aktualisieren')
      fetchRecurringExpenses()
    } catch (error) {
      console.error('Fehler:', error)
      alert('Fehler beim Aktualisieren')
    }
  }

  const totalMonthly = recurringExpenses
    .filter((exp) => exp.isActive && exp.interval === 'MONTHLY')
    .reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Lade Daueraufträge...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Daueraufträge</h1>
            <p className="mt-2 text-gray-600">Verwalten Sie wiederkehrende Ausgaben</p>
          </div>
          <button
            onClick={handleCreate}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            + Neuer Dauerauftrag
          </button>
        </div>

        {/* Summary Card */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Monatliche Fixkosten</h2>
            <p className="text-2xl font-bold text-red-600">
              {new Intl.NumberFormat('de-DE', {
                style: 'currency',
                currency: 'EUR',
              }).format(totalMonthly)}
            </p>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Summe aller aktiven monatlichen Daueraufträge
          </p>
        </div>

        {/* Recurring Expenses List */}
        {recurringExpenses.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center shadow">
            <p className="text-gray-500">Keine Daueraufträge gefunden</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recurringExpenses.map((expense) => (
              <div
                key={expense.id}
                className={`rounded-lg bg-white p-6 shadow ${
                  !expense.isActive ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{expense.name}</h3>
                      <span className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                        {expense.category}
                      </span>
                      <span className="rounded bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800">
                        {INTERVALS.find((i) => i.value === expense.interval)?.label || expense.interval}
                      </span>
                      {!expense.isActive && (
                        <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
                          Pausiert
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Betrag: {new Intl.NumberFormat('de-DE', {
                        style: 'currency',
                        currency: 'EUR',
                      }).format(parseFloat(expense.amount.toString()))}
                    </p>
                    <p className="text-xs text-gray-500">
                      Startdatum: {format(new Date(expense.startDate), 'dd.MM.yyyy')}
                    </p>
                    <p className="text-xs text-gray-500">
                      Nächste Ausführung: {format(new Date(expense.nextRun), 'dd.MM.yyyy')}
                    </p>
                    {expense.description && (
                      <p className="text-sm text-gray-500 mt-2">{expense.description}</p>
                    )}
                  </div>
                  <div className="ml-4 flex gap-2">
                    <button
                      onClick={() => handleToggleActive(expense.id, expense.isActive)}
                      className={`rounded-md px-3 py-1 text-xs font-medium ${
                        expense.isActive
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      {expense.isActive ? 'Pausieren' : 'Aktivieren'}
                    </button>
                    <button
                      onClick={() => handleEdit(expense)}
                      className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-500"
                    >
                      Bearbeiten
                    </button>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-500"
                    >
                      Löschen
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingId ? 'Dauerauftrag bearbeiten' : 'Neuer Dauerauftrag'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Schließen"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`mt-1 ${inputBase}`}
                    placeholder="z.B. Büromiete"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                      Betrag (€) <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className={`mt-1 ${inputBase}`}
                    />
                  </div>
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                      Kategorie <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="category"
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className={`mt-1 ${selectBase}`}
                    >
                      <option value="">Bitte wählen...</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="interval" className="block text-sm font-medium text-gray-700">
                      Intervall <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="interval"
                      required
                      value={formData.interval}
                      onChange={(e) => setFormData({ ...formData, interval: e.target.value as any })}
                      className={`mt-1 ${selectBase}`}
                    >
                      {INTERVALS.map((int) => (
                        <option key={int.value} value={int.value}>
                          {int.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                      Startdatum <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="startDate"
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className={`mt-1 ${inputBase}`}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Beschreibung
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className={`mt-1 ${textareaBase}`}
                    placeholder="Zusätzliche Informationen..."
                  />
                </div>

                <div className="flex items-center">
                  <input
                    id="isActive"
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-700">
                    Aktiv
                  </label>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                  >
                    {editingId ? 'Speichern' : 'Erstellen'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

