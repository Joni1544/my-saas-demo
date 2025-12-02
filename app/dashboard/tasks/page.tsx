/**
 * Aufgabenverwaltung
 * Liste aller Aufgaben mit Filter und Status
 * NEU: Deadline-Feature + Filter
 */
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { format, isPast, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { selectBase } from '@/lib/inputStyles'
import TaskSlideIn from '@/components/TaskSlideIn'

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  dueDate: string | null
  deadline: string | null
  assignedTo: string | null
  assignedToUser: {
    id: string
    name: string | null
    email: string
  } | null
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

type DeadlineFilter = 'all' | 'today' | 'thisWeek' | 'thisMonth' | 'overdue'

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [priorityFilter, setPriorityFilter] = useState<string>('')
  const [deadlineFilter, setDeadlineFilter] = useState<DeadlineFilter>('all')
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [isSlideInOpen, setIsSlideInOpen] = useState(false)

  useEffect(() => {
    fetchTasks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, priorityFilter, deadlineFilter])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/tasks')
      if (!response.ok) throw new Error('Fehler beim Laden der Aufgaben')
      const data = await response.json()
      
      let filtered = data.tasks || []
      
      // Status-Filter
      if (statusFilter) {
        filtered = filtered.filter((task: Task) => task.status === statusFilter)
      }
      
      // Prioritäts-Filter
      if (priorityFilter) {
        filtered = filtered.filter((task: Task) => task.priority === priorityFilter)
      }
      
      // Deadline-Filter
      if (deadlineFilter !== 'all') {
        const now = new Date()
        filtered = filtered.filter((task: Task) => {
          const deadline = task.deadline || task.dueDate
          if (!deadline) return false
          
          const deadlineDate = new Date(deadline as string)
          
          switch (deadlineFilter) {
            case 'today':
              return (
                deadlineDate >= startOfDay(now) &&
                deadlineDate <= endOfDay(now)
              )
            case 'thisWeek':
              return (
                deadlineDate >= startOfWeek(now, { weekStartsOn: 1 }) &&
                deadlineDate <= endOfWeek(now, { weekStartsOn: 1 })
              )
            case 'thisMonth':
              return (
                deadlineDate >= startOfMonth(now) &&
                deadlineDate <= endOfMonth(now)
              )
            case 'overdue':
              return isPast(deadlineDate) && task.status !== 'DONE'
            default:
              return true
          }
        })
      }
      
      setTasks(filtered)
    } catch (error) {
      console.error('Fehler:', error)
    } finally {
      setLoading(false)
    }
  }

  const isOverdue = (task: Task) => {
    const deadline = task.deadline || task.dueDate
    if (!deadline) return false
    return isPast(new Date(deadline)) && task.status !== 'DONE'
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Status Filter */}
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

            {/* Prioritäts-Filter */}
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

            {/* Deadline-Filter */}
            <div>
              <label htmlFor="deadline" className="block text-sm font-medium text-gray-700">
                Deadline
              </label>
              <select
                id="deadline"
                value={deadlineFilter}
                onChange={(e) => setDeadlineFilter(e.target.value as DeadlineFilter)}
                className={`mt-1 ${selectBase}`}
              >
                <option value="all">Alle</option>
                <option value="today">Heute</option>
                <option value="thisWeek">Diese Woche</option>
                <option value="thisMonth">Diesen Monat</option>
                <option value="overdue">Überfällig</option>
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tasks.map((task) => {
              const deadline = task.deadline || task.dueDate
              const overdue = isOverdue(task)
              
              return (
                <div
                  key={task.id}
                  onClick={() => {
                    setSelectedTaskId(task.id)
                    setIsSlideInOpen(true)
                  }}
                  className="rounded-xl bg-white p-5 shadow-md hover:shadow-lg transition-all cursor-pointer border border-gray-100 hover:border-indigo-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900 flex-1 pr-2">{task.title}</h3>
                    <div className="flex flex-col gap-1">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${PRIORITY_COLORS[task.priority] || 'bg-gray-100 text-gray-800'}`}>
                        {PRIORITY_LABELS[task.priority] || task.priority}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLORS[task.status] || 'bg-gray-100 text-gray-800'}`}>
                      {STATUS_LABELS[task.status] || task.status}
                    </span>
                    {task.assignedToUser && (
                      <div className="flex items-center gap-1.5">
                        <div className="h-6 w-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-semibold">
                          {(task.assignedToUser.name || task.assignedToUser.email).charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs text-gray-600">
                          {task.assignedToUser.name || task.assignedToUser.email.split('@')[0]}
                        </span>
                      </div>
                    )}
                  </div>

                  {deadline && (
                    <div className={`mb-3 flex items-center gap-2 ${overdue ? 'text-red-600' : 'text-gray-600'}`}>
                      <span className="text-sm">📅</span>
                      <span className={`text-sm font-medium ${overdue ? 'text-red-600' : ''}`}>
                        {format(new Date(deadline as string), 'dd.MM.yyyy')}
                      </span>
                      {overdue && (
                        <span className="text-xs font-semibold text-red-600">⚠️ Überfällig</span>
                      )}
                    </div>
                  )}

                  {task.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">{task.description}</p>
                  )}

                  {task._count && task._count.comments > 0 && (
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <span>💬</span>
                      <span>{task._count.comments} Kommentar{task._count.comments !== 1 ? 'e' : ''}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Slide-In Panel */}
        <TaskSlideIn
          taskId={selectedTaskId}
          isOpen={isSlideInOpen}
          onClose={() => {
            setIsSlideInOpen(false)
            setSelectedTaskId(null)
          }}
          onUpdate={() => {
            fetchTasks()
          }}
        />
      </div>
    </div>
  )
}
