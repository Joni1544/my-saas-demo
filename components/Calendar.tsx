/**
 * Kalender-Komponente
 * Monatsansicht mit Tagesliste
 */
'use client'

import { useState, useEffect } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from 'date-fns'
// Locale wird nicht verwendet, da Next.js standardmäßig englisch ist
// Für deutsche Lokalisierung würde man: import { de } from 'date-fns/locale'

interface Appointment {
  id: string
  title: string
  startTime: string
  endTime: string
  customer?: {
    firstName: string
    lastName: string
  }
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)

  // Lade Termine für den aktuellen Monat
  useEffect(() => {
    async function fetchAppointments() {
      try {
        const monthStart = startOfMonth(currentDate)
        const monthEnd = endOfMonth(currentDate)

        const response = await fetch(
          `/api/appointments?startDate=${monthStart.toISOString()}&endDate=${monthEnd.toISOString()}`
        )
        const data = await response.json()
        setAppointments(data.appointments || [])
      } catch (error) {
        console.error('Fehler beim Laden der Termine:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAppointments()
  }, [currentDate])

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter((apt) =>
      isSameDay(new Date(apt.startTime), date)
    )
  }

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))

  const dayAppointments = selectedDate
    ? getAppointmentsForDate(selectedDate)
    : []

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 rounded"
          >
            ←
          </button>
          <h2 className="text-xl font-semibold">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded"
          >
            →
          </button>
        </div>

        {/* Kalender-Grid */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-gray-700 py-2"
            >
              {day}
            </div>
          ))}
          {days.map((day) => {
            const dayAppointments = getAppointmentsForDate(day)
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isSelected = selectedDate && isSameDay(day, selectedDate)
            const isToday = isSameDay(day, new Date())

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`
                  relative p-2 text-sm rounded
                  ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-900'}
                  ${isSelected ? 'bg-indigo-100 ring-2 ring-indigo-500' : ''}
                  ${isToday && !isSelected ? 'bg-blue-50' : ''}
                  hover:bg-gray-100
                `}
              >
                <div className="flex flex-col items-center">
                  <span
                    className={`
                      ${isToday ? 'font-bold' : ''}
                      ${isSelected ? 'text-indigo-700' : ''}
                    `}
                  >
                    {format(day, 'd')}
                  </span>
                  {dayAppointments.length > 0 && (
                    <span className="text-xs text-indigo-600 mt-1">
                      {dayAppointments.length}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tagesliste */}
      {selectedDate && (
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-3">
            Termine am {format(selectedDate, 'dd.MM.yyyy')}
          </h3>
          {loading ? (
            <p className="text-gray-500">Lade Termine...</p>
          ) : dayAppointments.length === 0 ? (
            <p className="text-gray-500">Keine Termine an diesem Tag</p>
          ) : (
            <div className="space-y-2">
              {dayAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="border rounded-lg p-3 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{apt.title}</p>
                      {apt.customer && (
                        <p className="text-sm text-gray-600">
                          {apt.customer.firstName} {apt.customer.lastName}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <p>{format(new Date(apt.startTime), 'HH:mm')}</p>
                      <p>{format(new Date(apt.endTime), 'HH:mm')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

