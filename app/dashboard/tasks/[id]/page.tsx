/**
 * Aufgabe-Detail Seite
 * Bearbeiten, Kommentare hinzufügen
 */
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { inputBase, selectBase } from '@/lib/inputStyles'

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  dueDate: string | null
  assignedTo: string | null
  comments: Array<{
    id: string
    content: string
    createdAt: string
    user: {
      id: string
      name: string | null
      email: string
    }
  }>
}

const STATUS_OPTIONS = [
  { value: 'TODO', label: 'To-Do' },
  { value: 'IN_PROGRESS', label: 'In Bearbeitung' },
  { value: 'DONE', label: 'Erledigt' },
  { value: 'CANCELLED', label: 'Abgebrochen' },
]

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Niedrig' },
  { value: 'MEDIUM', label: 'Mittel' },
  { value: 'HIGH', label: 'Hoch' },
  { value: 'URGENT', label: 'Dringend' },
]

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

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const taskId = params.id as string
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    dueDate: '',
  })

  useEffect(() => {
    if (taskId) {
      fetchTask()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId])

  const fetchTask = async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`)
      if (!response.ok) throw new Error('Aufgabe nicht gefunden')
      const data = await response.json()
      setTask(data.task)
      setFormData({
        title: data.task.title,
        description: data.task.description || '',
        status: data.task.status,
        priority: data.task.priority,
        dueDate: data.task.dueDate
          ? format(new Date(data.task.dueDate), 'yyyy-MM-dd')
          : '',
      })
    } catch (error) {
      console.error('Fehler:', error)
      router.push('/dashboard/tasks')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          dueDate: formData.dueDate || null,
        }),
      })
      if (!response.ok) throw new Error('Fehler beim Speichern')
      setEditing(false)
      fetchTask()
    } catch (error) {
      console.error('Fehler:', error)
      alert('Fehler beim Speichern')
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return

    setSubmittingComment(true)
    try {
      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentText.trim() }),
      })
      if (!response.ok) throw new Error('Fehler beim Hinzufügen des Kommentars')
      setCommentText('')
      fetchTask()
    } catch (error) {
      console.error('Fehler:', error)
      alert('Fehler beim Hinzufügen des Kommentars')
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Aufgabe wirklich löschen?')) return

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Fehler beim Löschen')
      router.push('/dashboard/tasks')
    } catch (error) {
      console.error('Fehler:', error)
      alert('Fehler beim Löschen')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Lade Aufgabe...</p>
      </div>
    )
  }

  if (!task) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/tasks"
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            ← Zurück zur Übersicht
          </Link>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{task.title}</h1>
              <div className="mt-2 flex items-center gap-3">
                <span
                  className={`rounded px-3 py-1 text-sm font-medium ${STATUS_COLORS[task.status] || STATUS_COLORS.TODO}`}
                >
                  {STATUS_OPTIONS.find((s) => s.value === task.status)?.label || task.status}
                </span>
                <span
                  className={`rounded px-3 py-1 text-sm font-medium ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.MEDIUM}`}
                >
                  {PRIORITY_OPTIONS.find((p) => p.value === task.priority)?.label || task.priority}
                </span>
                {task.dueDate && (
                  <span className="text-sm text-gray-600">
                    Fällig: {format(new Date(task.dueDate), 'dd.MM.yyyy')}
                    {new Date(task.dueDate) < new Date() && task.status !== 'DONE' && (
                      <span className="ml-2 text-red-600 font-medium">Überfällig!</span>
                    )}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {editing ? (
                <>
                  <button
                    onClick={() => {
                      setEditing(false)
                      fetchTask()
                    }}
                    className="rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleSave}
                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                  >
                    Speichern
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setEditing(true)}
                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                  >
                    Bearbeiten
                  </button>
                  <button
                    onClick={handleDelete}
                    className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
                  >
                    Löschen
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Hauptinhalt */}
          <div className="lg:col-span-2 space-y-6">
            {/* Beschreibung */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Beschreibung</h2>
              {editing ? (
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={6}
                  className={inputBase}
                />
              ) : (
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {task.description || 'Keine Beschreibung'}
                </p>
              )}
            </div>

            {/* Bearbeitungsfelder */}
            {editing && (
              <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="mb-4 text-xl font-semibold text-gray-900">Details</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Titel</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className={`mt-1 ${selectBase}`}
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fälligkeitsdatum</label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className={`mt-1 ${selectBase}`}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Kommentare */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">
                Kommentare ({task.comments.length})
              </h2>

              {/* Kommentar-Formular */}
              <form onSubmit={handleAddComment} className="mb-6">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={3}
                  placeholder="Kommentar hinzufügen..."
                  className={inputBase}
                />
                <button
                  type="submit"
                  disabled={submittingComment || !commentText.trim()}
                  className="mt-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {submittingComment ? 'Wird hinzugefügt...' : 'Kommentar hinzufügen'}
                </button>
              </form>

              {/* Kommentare Liste */}
              {task.comments.length > 0 ? (
                <div className="space-y-4">
                  {task.comments.map((comment) => (
                    <div key={comment.id} className="border-l-4 border-indigo-500 pl-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">
                              {comment.user.name || comment.user.email}
                            </span>
                            <span className="text-xs text-gray-500">
                              {format(new Date(comment.createdAt), 'dd.MM.yyyy HH:mm')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Keine Kommentare</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Informationen</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <span className="font-medium">Status:</span>{' '}
                  {STATUS_OPTIONS.find((s) => s.value === task.status)?.label || task.status}
                </p>
                <p>
                  <span className="font-medium">Priorität:</span>{' '}
                  {PRIORITY_OPTIONS.find((p) => p.value === task.priority)?.label || task.priority}
                </p>
                {task.dueDate && (
                  <p>
                    <span className="font-medium">Fällig:</span>{' '}
                    {format(new Date(task.dueDate), 'dd.MM.yyyy')}
                  </p>
                )}
                <p>
                  <span className="font-medium">Kommentare:</span> {task.comments.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

