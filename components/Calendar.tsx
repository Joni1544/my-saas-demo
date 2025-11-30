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
    <div className="bg-white shadow-xl rounded-2xl p-6 border border-gray-100">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={prevMonth}
            className="p-2.5 hover:bg-indigo-50 rounded-xl text-black hover:text-indigo-600 transition-all duration-200 transform hover:scale-110 font-bold text-lg"
          >
            ←
          </button>
          <h2 className="text-2xl font-bold text-black">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2.5 hover:bg-indigo-50 rounded-xl text-black hover:text-indigo-600 transition-all duration-200 transform hover:scale-110 font-bold text-lg"
          >
            →
          </button>
        </div>

        {/* Kalender-Grid */}
        <div className="grid grid-cols-7 gap-2 mb-6">
          {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
            <div
              key={day}
              className="text-center text-sm font-bold text-gray-600 py-3"
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
                  relative p-3 text-sm rounded-xl transition-all duration-200 transform hover:scale-105
                  ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-900'}
                  ${isSelected ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg ring-2 ring-indigo-300' : ''}
                  ${isToday && !isSelected ? 'bg-gradient-to-br from-blue-50 to-indigo-50 ring-2 ring-blue-200 font-bold' : ''}
                  hover:bg-indigo-50 hover:shadow-md
                `}
              >
                <div className="flex flex-col items-center">
                  <span className={isSelected ? 'text-white font-bold' : isToday ? 'text-indigo-600' : ''}>
                    {format(day, 'd')}
                  </span>
                  {dayAppointments.length > 0 && (
                    <span className={`text-xs mt-1.5 px-1.5 py-0.5 rounded-full font-semibold ${
                      isSelected 
                        ? 'bg-white/30 text-white' 
                        : 'bg-indigo-100 text-indigo-700'
                    }`}>
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
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Termine am {format(selectedDate, 'dd.MM.yyyy')}
          </h3>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
              <p className="ml-3 text-gray-500">Lade Termine...</p>
            </div>
          ) : dayAppointments.length === 0 ? (
            <div className="text-center py-8 rounded-xl bg-gray-50">
              <p className="text-gray-500 font-medium">Keine Termine an diesem Tag</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dayAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="border border-gray-200 rounded-xl p-4 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:border-indigo-300 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 mb-1">{apt.title}</p>
                      {apt.customer && (
                        <p className="text-sm text-gray-600">
                          👤 {apt.customer.firstName} {apt.customer.lastName}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg">
                      <p>{format(new Date(apt.startTime), 'HH:mm')}</p>
                      <p className="text-gray-400">-</p>
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

