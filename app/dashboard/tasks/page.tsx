/**
 * Aufgabenverwaltung
 * Liste aller Aufgaben mit Filter und Status
 */
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { selectBase } from '@/lib/inputStyles'

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  dueDate: string | null
  assignedTo: string | null
  _count?: {
    comments: number
  }
}

const STATUS_LABELS: Record<string, string> = {
  TODO: 'To-Do',
  IN_PROGRESS: 'In Bearbeitung',
  DONE: 'Erledigt',
  CANCELLED: 'Abgebrochen',
}

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Niedrig',
  MEDIUM: 'Mittel',
  HIGH: 'Hoch',
  URGENT: 'Dringend',
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-800',
  MEDIUM: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
}

const STATUS_COLORS: Record<string, string> = {
  TODO: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  DONE: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [priorityFilter, setPriorityFilter] = useState<string>('')

  useEffect(() => {
    fetchTasks()
  }, [statusFilter, priorityFilter])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/tasks')
      if (!response.ok) throw new Error('Fehler beim Laden der Aufgaben')
      const data = await response.json()
      
      let filtered = data.tasks || []
      if (statusFilter) {
        filtered = filtered.filter((task: Task) => task.status === statusFilter)
      }
      if (priorityFilter) {
        filtered = filtered.filter((task: Task) => task.priority === priorityFilter)
      }
      
      setTasks(filtered)
    } catch (error) {
      console.error('Fehler:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Aufgabe wirklich löschen?')) return

    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Fehler beim Löschen')
      fetchTasks()
    } catch (error) {
      console.error('Fehler:', error)
      alert('Fehler beim Löschen')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Aufgaben</h1>
            <p className="mt-2 text-gray-600">Verwalten Sie alle Ihre Aufgaben</p>
          </div>
          <Link
            href="/dashboard/tasks/new"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            + Neue Aufgabe
          </Link>
        </div>

        {/* Filter */}
        <div className="mb-6 space-y-4 rounded-lg bg-white p-4 shadow">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`mt-1 ${selectBase}`}
              >
                <option value="">Alle Status</option>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                Priorität
              </label>
              <select
                id="priority"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className={`mt-1 ${selectBase}`}
              >
                <option value="">Alle Prioritäten</option>
                {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Aufgaben Liste */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Lade Aufgaben...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center shadow">
            <p className="text-gray-500">Keine Aufgaben gefunden</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="rounded-lg bg-white p-6 shadow hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                      <span
                        className={`rounded px-2 py-1 text-xs font-medium ${STATUS_COLORS[task.status] || STATUS_COLORS.TODO}`}
                      >
                        {STATUS_LABELS[task.status] || task.status}
                      </span>
                      <span
                        className={`rounded px-2 py-1 text-xs font-medium ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.MEDIUM}`}
                      >
                        {PRIORITY_LABELS[task.priority] || task.priority}
                      </span>
                    </div>

                    {task.description && (
                      <p className="mb-2 text-sm text-gray-600 line-clamp-2">{task.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {task.dueDate && (
                        <div>
                          <span className="font-medium">Fällig:</span>{' '}
                          {format(new Date(task.dueDate), 'dd.MM.yyyy')}
                          {new Date(task.dueDate) < new Date() && task.status !== 'DONE' && (
                            <span className="ml-2 text-red-600 font-medium">Überfällig!</span>
                          )}
                        </div>
                      )}
                      {task._count && task._count.comments > 0 && (
                        <div>
                          <span className="font-medium">Kommentare:</span> {task._count.comments}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/tasks/${task.id}`}
                      className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                    >
                      Öffnen
                    </Link>
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
                    >
                      Löschen
                    </button>
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

