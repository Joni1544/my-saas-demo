/**
 * WeekSelector Component
 * Einheitliche Woche-Auswahl mit Woche/Jahr Dropdowns
 */
'use client'

import { useState, useEffect } from 'react'
import { getWeek } from 'date-fns'

interface WeekSelectorProps {
  value?: { week: number; year: number }
  onChange?: (value: { week: number; year: number }) => void
  minYear?: number
  maxYear?: number
  className?: string
}

const getWeeksInYear = (year: number): number => {
  const dec31 = new Date(year, 11, 31)
  const week = getWeek(dec31, { weekStartsOn: 1 })
  return week === 1 ? 52 : week
}

export default function WeekSelector({
  value,
  onChange,
  minYear = 2000,
  maxYear = 2080,
  className = '',
}: WeekSelectorProps) {
  const now = new Date()
  const currentWeek = getWeek(now, { weekStartsOn: 1 })
  const [week, setWeek] = useState(value?.week ?? currentWeek)
  const [year, setYear] = useState(value?.year ?? now.getFullYear())

  // Sync with external value changes
  useEffect(() => {
    if (value && (value.week !== week || value.year !== year)) {
      setWeek(value.week)
      setYear(value.year)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  // Adjust week if it's invalid for the selected year
  useEffect(() => {
    const maxWeeks = getWeeksInYear(year)
    if (week > maxWeeks) {
      setWeek(maxWeeks)
      if (onChange) {
        onChange({ week: maxWeeks, year })
      }
    }
  }, [year, week, onChange])

  const handleWeekChange = (newWeek: number) => {
    setWeek(newWeek)
    if (onChange) {
      onChange({ week: newWeek, year })
    }
  }

  const handleYearChange = (newYear: number) => {
    setYear(newYear)
    const maxWeeks = getWeeksInYear(newYear)
    const adjustedWeek = week > maxWeeks ? maxWeeks : week
    setWeek(adjustedWeek)
    if (onChange) {
      onChange({ week: adjustedWeek, year: newYear })
    }
  }

  const weeks = Array.from({ length: getWeeksInYear(year) }, (_, i) => i + 1)
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i)

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <select
        value={week}
        onChange={(e) => handleWeekChange(parseInt(e.target.value))}
        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        aria-label="Woche auswählen"
      >
        {weeks.map((w) => (
          <option key={w} value={w}>
            KW {w}
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

