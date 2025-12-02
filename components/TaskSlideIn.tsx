/**
 * Task Slide-In Panel Component
 * Zeigt Aufgabe-Details in einem Slide-In Panel rechts
 */
'use client'

import { useState, useEffect } from 'react'
import { format, isPast } from 'date-fns'
import { inputBase, selectBase } from '@/lib/inputStyles'

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  deadline: string | null
  dueDate: string | null
  assignedTo: string | null
  assignedToUser: {
    id: string
    name: string | null
    email: string
  } | null
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

interface TaskSlideInProps {
  taskId: string | null
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
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

export default function TaskSlideIn({ taskId, isOpen, onClose, onUpdate }: TaskSlideInProps) {
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [employees, setEmployees] = useState<Array<{ id: string; user: { id: string; name: string | null; email: string } }>>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    deadline: '',
    assignedTo: '',
  })

  useEffect(() => {
    if (isOpen && taskId) {
      fetchTask()
      fetchEmployees()
    } else {
      setTask(null)
      setEditing(false)
      setCommentText('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, taskId])

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

  const fetchTask = async () => {
    if (!taskId) return
    try {
      setLoading(true)
      const response = await fetch(`/api/tasks/${taskId}`)
      if (!response.ok) throw new Error('Aufgabe nicht gefunden')
      const data = await response.json()
      setTask(data.task)
      const deadline = data.task.deadline || data.task.dueDate
      setFormData({
        title: data.task.title,
        description: data.task.description || '',
        status: data.task.status,
        priority: data.task.priority,
        deadline: deadline ? format(new Date(deadline), 'yyyy-MM-dd') : '',
        assignedTo: data.task.assignedTo || '',
      })
    } catch (error) {
      console.error('Fehler:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!taskId) return
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          deadline: formData.deadline || null,
          assignedTo: formData.assignedTo || null,
        }),
      })
      if (!response.ok) throw new Error('Fehler beim Speichern')
      setEditing(false)
      fetchTask()
      onUpdate()
    } catch (error) {
      console.error('Fehler:', error)
      alert('Fehler beim Speichern')
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!taskId || !commentText.trim()) return

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
    if (!taskId || !confirm('Aufgabe wirklich löschen?')) return

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Fehler beim Löschen')
      onClose()
      onUpdate()
    } catch (error) {
      console.error('Fehler:', error)
      alert('Fehler beim Löschen')
    }
  }

  if (!isOpen) return null

  const deadline = task?.deadline || task?.dueDate
  const overdue = deadline && isPast(new Date(deadline)) && task?.status !== 'DONE'

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Slide-In Panel */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-gray-900">Aufgabe Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-500">Lade Aufgabe...</p>
            </div>
          ) : task ? (
            <div className="space-y-6">
              {/* Header mit Badges */}
              <div>
                {editing ? (
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className={`w-full text-xl font-bold mb-3 ${inputBase}`}
                  />
                ) : (
                  <h1 className="text-2xl font-bold text-gray-900 mb-3">{task.title}</h1>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[task.status] || STATUS_COLORS.TODO}`}>
                    {STATUS_OPTIONS.find((s) => s.value === task.status)?.label || task.status}
                  </span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.MEDIUM}`}>
                    {PRIORITY_OPTIONS.find((p) => p.value === task.priority)?.label || task.priority}
                  </span>
                  {deadline && (
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      overdue ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {overdue ? '⚠️ ' : '📅 '}
                      {format(new Date(deadline), 'dd.MM.yyyy')}
                      {overdue && ' (Überfällig)'}
                    </span>
                  )}
                  {task.assignedToUser && (
                    <div className="flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1">
                      <div className="h-6 w-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-semibold">
                        {(task.assignedToUser.name || task.assignedToUser.email).charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-medium text-indigo-800">
                        {task.assignedToUser.name || task.assignedToUser.email}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Beschreibung */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Beschreibung</h3>
                {editing ? (
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
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
                <div className="space-y-4 border-t border-gray-200 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className={selectBase}
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Priorität</label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        className={selectBase}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                    <input
                      type="date"
                      value={formData.deadline}
                      onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                      className={selectBase}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mitarbeiter zuweisen</label>
                    <select
                      value={formData.assignedTo}
                      onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                      className={selectBase}
                    >
                      <option value="">Nicht zugewiesen</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.user.id}>
                          {emp.user.name || emp.user.email}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Kommentare */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Kommentare ({task.comments.length})
                </h3>

                <form onSubmit={handleAddComment} className="mb-4">
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

                {task.comments.length > 0 ? (
                  <div className="space-y-3">
                    {task.comments.map((comment) => (
                      <div key={comment.id} className="border-l-2 border-indigo-500 pl-4 py-2">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="h-6 w-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-semibold">
                            {(comment.user.name || comment.user.email).charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {comment.user.name || comment.user.email}
                          </span>
                          <span className="text-xs text-gray-500">
                            {format(new Date(comment.createdAt), 'dd.MM.yyyy HH:mm')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap ml-8">
                          {comment.content}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Keine Kommentare</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 border-t border-gray-200 pt-4">
                {editing ? (
                  <>
                    <button
                      onClick={() => {
                        setEditing(false)
                        fetchTask()
                      }}
                      className="flex-1 rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300"
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={handleSave}
                      className="flex-1 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                    >
                      Speichern
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setEditing(true)}
                      className="flex-1 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                    >
                      Bearbeiten
                    </button>
                    <button
                      onClick={handleDelete}
                      className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
                    >
                      Löschen
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Aufgabe nicht gefunden</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

