/**
 * DateSelector Component
 * Einheitliche Datumsauswahl mit Monat und Jahr Dropdowns
 * Rückgabe: { month: number, year: number }
 */
'use client'

import { useState, useEffect } from 'react'

interface DateSelectorProps {
  value?: { month: number; year: number }
  onChange?: (value: { month: number; year: number }) => void
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

export default function DateSelector({
  value,
  onChange,
  minYear = 2000,
  maxYear = 2080,
  className = '',
}: DateSelectorProps) {
  const now = new Date()
  const [month, setMonth] = useState(value?.month ?? now.getMonth())
  const [year, setYear] = useState(value?.year ?? now.getFullYear())

  // Sync with external value changes
  useEffect(() => {
    if (value && (value.month !== month || value.year !== year)) {
      setMonth(value.month)
      setYear(value.year)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const handleMonthChange = (newMonth: number) => {
    setMonth(newMonth)
    if (onChange) {
      onChange({ month: newMonth, year })
    }
  }

  const handleYearChange = (newYear: number) => {
    setYear(newYear)
    if (onChange) {
      onChange({ month, year: newYear })
    }
  }

  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i)

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label htmlFor="month-select" className="sr-only">
        Monat auswählen
      </label>
      <select
        id="month-select"
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
      <label htmlFor="year-select" className="sr-only">
        Jahr auswählen
      </label>
      <select
        id="year-select"
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

