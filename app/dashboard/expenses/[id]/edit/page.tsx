/**
 * Ausgabe bearbeiten
 */
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { inputBase, textareaBase, selectBase } from '@/lib/inputStyles'

const CATEGORIES = [
  'Gehalt',
  'Miete',
  'Marketing',
  'Material',
  'Versicherung',
  'Steuern',
  'Sonstiges',
]


export default function EditExpensePage() {
  const params = useParams()
  const router = useRouter()
  const expenseId = params.id as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [employees, setEmployees] = useState<Array<{ id: string; user: { name: string | null; email: string } }>>([])
  const [recurringExpenses, setRecurringExpenses] = useState<Array<{ id: string; name: string }>>([])
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    date: '',
    category: '',
    description: '',
    employeeId: '',
    recurringExpenseId: '',
    invoiceUrl: '',
  })

  useEffect(() => {
    if (expenseId) {
      fetchExpense()
      fetchEmployees()
      fetchRecurringExpenses()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenseId])

  const fetchRecurringExpenses = async () => {
    try {
      const response = await fetch('/api/recurring-expenses')
      if (response.ok) {
        const data = await response.json()
        setRecurringExpenses(data.recurringExpenses || [])
      }
    } catch (error) {
      console.error('Fehler beim Laden der Daueraufträge:', error)
    }
  }

  const fetchExpense = async () => {
    try {
      const response = await fetch(`/api/expenses/${expenseId}`)
      if (!response.ok) throw new Error('Ausgabe nicht gefunden')
      const data = await response.json()
      const exp = data.expense
      setFormData({
        name: exp.name || exp.title || '',
        amount: exp.amount.toString(),
        date: new Date(exp.date).toISOString().split('T')[0],
        category: exp.category,
        description: exp.description || '',
        employeeId: exp.employeeId || '',
        recurringExpenseId: exp.recurringExpenseId || '',
        invoiceUrl: exp.invoiceUrl || '',
      })
    } catch (error) {
      console.error('Fehler:', error)
      router.push('/dashboard/expenses')
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees')
      if (response.ok) {
        const data = await response.json()
        setEmployees(data.employees || [])
      }
    } catch (error) {
      console.error('Fehler beim Laden der Mitarbeiter:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          employeeId: formData.employeeId || null,
          recurringExpenseId: formData.recurringExpenseId || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Fehler beim Speichern')
      }

      router.push('/dashboard/expenses')
    } catch (error: unknown) {
      console.error('Fehler:', error)
      alert((error instanceof Error ? error.message : 'Fehler beim Speichern'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Lade Ausgabe...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/dashboard/expenses"
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            ← Zurück zur Übersicht
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">Ausgabe bearbeiten</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-white p-6 shadow">
          {/* Gleiche Felder wie New Page */}
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
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                Datum <span className="text-red-500">*</span>
              </label>
              <input
                id="date"
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className={`mt-1 ${inputBase}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700">
                Mitarbeiter (optional)
              </label>
              <select
                id="employeeId"
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className={`mt-1 ${selectBase}`}
              >
                <option value="">Kein Mitarbeiter</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.user.name || emp.user.email}
                  </option>
                ))}
              </select>
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
            />
          </div>

          <div>
            <label htmlFor="recurringExpenseId" className="block text-sm font-medium text-gray-700">
              Dauerauftrag (optional)
            </label>
            <select
              id="recurringExpenseId"
              value={formData.recurringExpenseId}
              onChange={(e) => setFormData({ ...formData, recurringExpenseId: e.target.value })}
              className={`mt-1 ${selectBase}`}
            >
              <option value="">Kein Dauerauftrag</option>
              {recurringExpenses.map((rec) => (
                <option key={rec.id} value={rec.id}>
                  {rec.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="invoiceUrl" className="block text-sm font-medium text-gray-700">
              Rechnung/Dokument URL (optional)
            </label>
            <input
              id="invoiceUrl"
              type="url"
              value={formData.invoiceUrl}
              onChange={(e) => setFormData({ ...formData, invoiceUrl: e.target.value })}
              className={`mt-1 ${inputBase}`}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Link
              href="/dashboard/expenses"
              className="flex-1 rounded-md bg-gray-200 px-4 py-2 text-center text-sm font-semibold text-gray-700 hover:bg-gray-300"
            >
              Abbrechen
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {saving ? 'Wird gespeichert...' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

