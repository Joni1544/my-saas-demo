/**
 * DaySelector Component
 * Einheitliche Tag-Auswahl mit Tag/Monat/Jahr Dropdowns
 */
'use client'

import { useState, useEffect } from 'react'

interface DaySelectorProps {
  value?: { day: number; month: number; year: number }
  onChange?: (value: { day: number; month: number; year: number }) => void
  minYear?: number
  maxYear?: number
  className?: string
}

const MONTHS = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
]

const getDaysInMonth = (month: number, year: number): number => {
  return new Date(year, month + 1, 0).getDate()
}

export default function DaySelector({
  value,
  onChange,
  minYear = 2000,
  maxYear = 2080,
  className = '',
}: DaySelectorProps) {
  const now = new Date()
  const [day, setDay] = useState(value?.day ?? now.getDate())
  const [month, setMonth] = useState(value?.month ?? now.getMonth())
  const [year, setYear] = useState(value?.year ?? now.getFullYear())

  // Sync with external value changes
  useEffect(() => {
    if (value && (value.day !== day || value.month !== month || value.year !== year)) {
      setDay(value.day)
      setMonth(value.month)
      setYear(value.year)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  // Adjust day if it's invalid for the selected month/year
  useEffect(() => {
    const maxDays = getDaysInMonth(month, year)
    if (day > maxDays) {
      setDay(maxDays)
      if (onChange) {
        onChange({ day: maxDays, month, year })
      }
    }
  }, [month, year, day, onChange])

  const handleDayChange = (newDay: number) => {
    setDay(newDay)
    if (onChange) {
      onChange({ day: newDay, month, year })
    }
  }

  const handleMonthChange = (newMonth: number) => {
    setMonth(newMonth)
    const maxDays = getDaysInMonth(newMonth, year)
    const adjustedDay = day > maxDays ? maxDays : day
    setDay(adjustedDay)
    if (onChange) {
      onChange({ day: adjustedDay, month: newMonth, year })
    }
  }

  const handleYearChange = (newYear: number) => {
    setYear(newYear)
    const maxDays = getDaysInMonth(month, newYear)
    const adjustedDay = day > maxDays ? maxDays : day
    setDay(adjustedDay)
    if (onChange) {
      onChange({ day: adjustedDay, month, year: newYear })
    }
  }

  const days = Array.from({ length: getDaysInMonth(month, year) }, (_, i) => i + 1)
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i)

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <select
        value={day}
        onChange={(e) => handleDayChange(parseInt(e.target.value))}
        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        aria-label="Tag auswählen"
      >
        {days.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
      <select
        value={month}
        onChange={(e) => handleMonthChange(parseInt(e.target.value))}
        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        aria-label="Monat auswählen"
      >
        {MONTHS.map((monthName, index) => (
          <option key={index} value={index}>
            {monthName}
          </option>
        ))}
      </select>
      <select
        value={year}
        onChange={(e) => handleYearChange(parseInt(e.target.value))}
        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        aria-label="Jahr auswählen"
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  )
}

