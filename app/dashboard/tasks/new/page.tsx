/**
 * Neue Aufgabe - Formular
 */
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { inputBase, textareaBase, selectBase } from '@/lib/inputStyles'

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Niedrig' },
  { value: 'MEDIUM', label: 'Mittel' },
  { value: 'HIGH', label: 'Hoch' },
  { value: 'URGENT', label: 'Dringend' },
]

const STATUS_OPTIONS = [
  { value: 'TODO', label: 'To-Do' },
  { value: 'IN_PROGRESS', label: 'In Bearbeitung' },
  { value: 'DONE', label: 'Erledigt' },
]

interface Employee {
  id: string
  user: {
    id: string
    name: string | null
    email: string
  }
}

export default function NewTaskPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    deadline: '',
    assignedTo: '',
  })

  useEffect(() => {
    fetchEmployees()
  }, [])

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
    setLoading(true)

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          deadline: formData.deadline || null,
          assignedTo: formData.assignedTo || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Fehler beim Erstellen')
      }

      const data = await response.json()
      router.push(`/dashboard/tasks/${data.task.id}`)
    } catch (error: unknown) {
      console.error('Fehler:', error)
      alert((error instanceof Error ? error.message : 'Fehler beim Erstellen der Aufgabe'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/dashboard/tasks"
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            ← Zurück zur Übersicht
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">Neue Aufgabe</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-white p-6 shadow">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Titel <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`mt-1 ${inputBase}`}
              placeholder="Aufgaben-Titel..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className={`mt-1 ${selectBase}`}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Priorität</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className={`mt-1 ${selectBase}`}
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Mitarbeiter auswählen <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                className={`mt-1 ${selectBase}`}
              >
                <option value="">Bitte wählen...</option>
                {employees.map((emp) => (
                  <option key={emp.user.id} value={emp.user.id}>
                    {emp.user.name || emp.user.email}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Deadline</label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className={`mt-1 ${inputBase}`}
              />
              <p className="mt-1 text-xs text-gray-500">Optional: Fälligkeitsdatum für die Aufgabe</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Beschreibung</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={6}
              className={`mt-1 ${textareaBase}`}
              placeholder="Beschreibung der Aufgabe..."
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Link
              href="/dashboard/tasks"
              className="flex-1 rounded-md bg-gray-200 px-4 py-2 text-center text-sm font-semibold text-gray-700 hover:bg-gray-300"
            >
              Abbrechen
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Wird erstellt...' : 'Aufgabe erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

