/**
 * Kalender-Komponente
 * Monatsansicht mit Tagesliste
 */
'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  startOfWeek,
  endOfWeek,
} from 'date-fns'
import { useRouter } from 'next/navigation'
import DateSelector from '@/components/DateSelector'
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
  const router = useRouter()
  const now = new Date()
  const [monthSelection, setMonthSelection] = useState({
    month: now.getMonth(),
    year: now.getFullYear(),
  })
  const [appointments, setAppointments] = useState<Appointment[]>([])
  
  const currentDate = useMemo(
    () => new Date(monthSelection.year, monthSelection.month, 1),
    [monthSelection.year, monthSelection.month]
  )

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

  return (
    <div className="bg-white shadow-xl rounded-2xl p-6 border border-gray-100">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-black">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <DateSelector
            value={monthSelection}
            onChange={(value) => setMonthSelection(value)}
            minYear={2020}
            maxYear={2080}
          />
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
            const isToday = isSameDay(day, new Date())

            return (
              <button
                key={day.toISOString()}
                onClick={() => {
                  // Wechsle zur Kalender-Seite mit Tagesansicht
                  const dateStr = format(day, 'yyyy-MM-dd')
                  router.push(`/dashboard/calendar?date=${dateStr}`)
                }}
                className={`
                  relative p-3 text-sm rounded-xl transition-all duration-200 transform hover:scale-105
                  ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-900'}
                  ${isToday ? 'bg-gradient-to-br from-blue-50 to-indigo-50 ring-2 ring-blue-200 font-bold' : ''}
                  hover:bg-indigo-50 hover:shadow-md cursor-pointer
                `}
              >
                <div className="flex flex-col items-center">
                  <span className={isToday ? 'text-indigo-600' : ''}>
                    {format(day, 'd')}
                  </span>
                  {dayAppointments.length > 0 && (
                    <span className="text-xs mt-1.5 px-1.5 py-0.5 rounded-full font-semibold bg-indigo-100 text-indigo-700">
                      {dayAppointments.length}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

