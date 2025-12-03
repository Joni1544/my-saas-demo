/**
 * Tägliche Chef-Berichte Seite
 * Zeigt automatisch generierte tägliche Berichte mit allen Kennzahlen, Auffälligkeiten und Empfehlungen
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { inputBase } from '@/lib/inputStyles'
import type { DailyReportData } from '@/lib/daily-report-generator'

export default function ReportsPage() {
  const [report, setReport] = useState<DailyReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  const fetchReport = useCallback(async (date: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/reports/daily?date=${date}`)
      if (!response.ok) throw new Error('Fehler beim Laden des Berichts')
      const data = await response.json()
      setReport(data.report)
    } catch (error) {
      console.error('Fehler:', error)
      alert('Fehler beim Laden des Berichts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReport(selectedDate)
  }, [selectedDate, fetchReport])


  const generateReport = async () => {
    setGenerating(true)
    try {
      const response = await fetch('/api/reports/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate }),
      })
      if (!response.ok) throw new Error('Fehler beim Generieren')
      const data = await response.json()
      setReport(data.report)
      alert('Bericht erfolgreich generiert!')
    } catch (error) {
      console.error('Fehler:', error)
      alert('Fehler beim Generieren des Berichts')
    } finally {
      setGenerating(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Lade Bericht...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Täglicher Chef-Bericht</h1>
            <p className="mt-2 text-gray-600">
              Automatisch generierte Übersicht über den Tag und Vorbereitung für morgen
            </p>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className={inputBase}
            />
            <button
              onClick={generateReport}
              disabled={generating}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {generating ? 'Wird generiert...' : 'Bericht generieren'}
            </button>
          </div>
        </div>

        {!report ? (
          <div className="rounded-lg bg-white p-12 text-center shadow">
            <p className="text-gray-500">Kein Bericht für dieses Datum verfügbar</p>
            <button
              onClick={generateReport}
              disabled={generating}
              className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {generating ? 'Wird generiert...' : 'Bericht jetzt generieren'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Bericht-Header */}
            <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Bericht für {format(new Date(report.reportDate), 'EEEE, dd.MM.yyyy', { locale: de })}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Generiert am {format(new Date(report.generatedAt), 'dd.MM.yyyy HH:mm', { locale: de })}
                  </p>
                </div>
              </div>
            </div>

            {/* 1. Kennzahlen des heutigen Tages */}
            <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Kennzahlen des heutigen Tages</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
                  <p className="text-sm font-medium text-blue-600">Termine heute</p>
                  <p className="text-2xl font-bold text-blue-900">{report.metrics.appointmentsToday}</p>
                </div>
                <div className="rounded-lg bg-green-50 p-4 border border-green-200">
                  <p className="text-sm font-medium text-green-600">Abgeschlossene Aufgaben</p>
                  <p className="text-2xl font-bold text-green-900">{report.metrics.completedTasks}</p>
                </div>
                <div className="rounded-lg bg-red-50 p-4 border border-red-200">
                  <p className="text-sm font-medium text-red-600">Ausgefallene Termine</p>
                  <p className="text-2xl font-bold text-red-900">{report.metrics.cancelledAppointments}</p>
                </div>
                <div className="rounded-lg bg-yellow-50 p-4 border border-yellow-200">
                  <p className="text-sm font-medium text-yellow-600">Neu zugewiesene Termine</p>
                  <p className="text-2xl font-bold text-yellow-900">{report.metrics.reassignedAppointments}</p>
                </div>
                <div className="rounded-lg bg-purple-50 p-4 border border-purple-200">
                  <p className="text-sm font-medium text-purple-600">Tagesumsatz</p>
                  <p className="text-2xl font-bold text-purple-900">{formatCurrency(report.metrics.dailyRevenue)}</p>
                </div>
                <div className="rounded-lg bg-orange-50 p-4 border border-orange-200">
                  <p className="text-sm font-medium text-orange-600">Offene Aufgaben</p>
                  <p className="text-2xl font-bold text-orange-900">{report.metrics.openTasks}</p>
                </div>
              </div>

              {/* Ausfallgründe */}
              {report.metrics.cancelledReasons.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">Ausfallgründe:</p>
                  <div className="flex flex-wrap gap-2">
                    {report.metrics.cancelledReasons.map((reason, idx) => (
                      <span key={idx} className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800">
                        {reason.reason}: {reason.count}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Mitarbeiter-Auslastung */}
              {report.metrics.employeeUtilization.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">Mitarbeiter-Auslastung:</p>
                  <div className="space-y-2">
                    {report.metrics.employeeUtilization.map((emp) => (
                      <div key={emp.employeeId} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{emp.employeeName}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                emp.utilization > 90 ? 'bg-red-500' :
                                emp.utilization > 70 ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(100, emp.utilization)}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900 w-12 text-right">
                            {emp.utilization.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Überstunden */}
              {report.metrics.overtimeEmployees.length > 0 && (
                <div className="mt-4 pt-4 border-t border-red-200 bg-red-50 rounded-lg p-4">
                  <p className="text-sm font-semibold text-red-800 mb-2">⚠️ Mitarbeiter mit Überstunden:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {report.metrics.overtimeEmployees.map((emp) => (
                      <li key={emp.employeeId} className="text-sm text-red-700">
                        {emp.employeeName}: {emp.overtimeHours.toFixed(1)} Stunden
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* 2. Auffälligkeiten & Probleme */}
            {(report.issues.employeesWithManyCancellations.length > 0 ||
              report.issues.doubleBookings.length > 0 ||
              report.issues.timeConflicts.length > 0 ||
              report.issues.lowInventory.length > 0) && (
              <div className="rounded-lg bg-white p-6 shadow-sm border border-red-200">
                <h3 className="text-lg font-semibold text-red-900 mb-4">⚠️ Auffälligkeiten & Probleme</h3>
                
                {report.issues.employeesWithManyCancellations.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Mitarbeiter mit vielen Ausfällen:
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      {report.issues.employeesWithManyCancellations.map((emp) => (
                        <li key={emp.employeeId} className="text-sm text-gray-600">
                          {emp.employeeName}: {emp.cancellations} Ausfälle
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {report.issues.doubleBookings.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Doppelbuchungen:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {report.issues.doubleBookings.map((booking) => (
                        <li key={booking.appointmentId} className="text-sm text-red-600">
                          {booking.conflict}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {report.issues.timeConflicts.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Zeitkonflikte:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {report.issues.timeConflicts.map((conflict) => (
                        <li key={conflict.appointmentId} className="text-sm text-orange-600">
                          {conflict.conflict}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {report.issues.lowInventory.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Niedriger Inventarbestand:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {report.issues.lowInventory.map((item) => (
                        <li key={item.itemId} className="text-sm text-red-600">
                          {item.itemName}: {item.currentStock} / {item.minThreshold} (Mindestbestand)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* 3. Übersicht für morgen */}
            <div className="rounded-lg bg-white p-6 shadow-sm border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">📅 Übersicht für morgen</h3>
              
              {/* Mitarbeiterverfügbarkeit */}
              <div className="mb-6">
                <h4 className="text-base font-semibold text-gray-900 mb-3">Mitarbeiterverfügbarkeit</h4>
                
                {report.tomorrow.employeeAvailability.sickEmployees.length > 0 && (
                  <div className="mb-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm font-medium text-red-800 mb-1">🚑 Krank gemeldet:</p>
                    <ul className="list-disc list-inside">
                      {report.tomorrow.employeeAvailability.sickEmployees.map((emp) => (
                        <li key={emp.employeeId} className="text-sm text-red-700">{emp.employeeName}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {report.tomorrow.employeeAvailability.onVacation.length > 0 && (
                  <div className="mb-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm font-medium text-yellow-800 mb-1">🏖️ Im Urlaub:</p>
                    <ul className="list-disc list-inside">
                      {report.tomorrow.employeeAvailability.onVacation.map((emp) => (
                        <li key={emp.employeeId} className="text-sm text-yellow-700">
                          {emp.employeeName} ({emp.vacationDays} Tage)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {report.tomorrow.employeeAvailability.limitedHours.length > 0 && (
                  <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-800 mb-1">⏰ Eingeschränkte Arbeitszeiten:</p>
                    <ul className="list-disc list-inside">
                      {report.tomorrow.employeeAvailability.limitedHours.map((emp) => (
                        <li key={emp.employeeId} className="text-sm text-blue-700">
                          {emp.employeeName}: {emp.availableHours}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {report.tomorrow.employeeAvailability.shouldAvoidOvertime.length > 0 && (
                  <div className="mb-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <p className="text-sm font-medium text-orange-800 mb-1">⚠️ Sollten Überstunden vermeiden:</p>
                    <ul className="list-disc list-inside">
                      {report.tomorrow.employeeAvailability.shouldAvoidOvertime.map((emp) => (
                        <li key={emp.employeeId} className="text-sm text-orange-700">
                          {emp.employeeName}: {emp.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {report.tomorrow.employeeAvailability.availableForSubstitution.length > 0 && (
                  <div className="mb-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-green-800 mb-1">✅ Verfügbar für Einspringen:</p>
                    <ul className="list-disc list-inside">
                      {report.tomorrow.employeeAvailability.availableForSubstitution.map((emp) => (
                        <li key={emp.employeeId} className="text-sm text-green-700">
                          {emp.employeeName}: {emp.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Termine morgen */}
              <div className="mb-6">
                <h4 className="text-base font-semibold text-gray-900 mb-3">
                  Termine morgen ({report.tomorrow.appointments.totalAppointments})
                </h4>
                
                {report.tomorrow.appointments.criticalAppointments.length > 0 && (
                  <div className="mb-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-sm font-medium text-purple-800 mb-1">⭐ Kritische Termine:</p>
                    <ul className="list-disc list-inside">
                      {report.tomorrow.appointments.criticalAppointments.map((apt) => (
                        <li key={apt.appointmentId} className="text-sm text-purple-700">
                          {apt.title} ({apt.reason})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {report.tomorrow.appointments.appointmentsWithUnavailableEmployee.length > 0 && (
                  <div className="mb-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm font-medium text-red-800 mb-1">⚠️ Termine mit nicht verfügbarem Mitarbeiter:</p>
                    <ul className="list-disc list-inside">
                      {report.tomorrow.appointments.appointmentsWithUnavailableEmployee.map((apt) => (
                        <li key={apt.appointmentId} className="text-sm text-red-700">
                          {apt.employeeName}: {apt.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Aufgaben morgen */}
              {report.tomorrow.tasks.dueTomorrow.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-base font-semibold text-gray-900 mb-3">
                    Aufgaben morgen fällig ({report.tomorrow.tasks.dueTomorrow.length})
                  </h4>
                  <ul className="list-disc list-inside space-y-1">
                    {report.tomorrow.tasks.dueTomorrow.map((task) => (
                      <li key={task.taskId} className="text-sm text-gray-600">
                        {task.title} ({task.priority})
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Konflikte morgen */}
              {report.tomorrow.conflicts.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-base font-semibold text-gray-900 mb-3">Konflikte für morgen:</h4>
                  <div className="space-y-2">
                    {report.tomorrow.conflicts.map((conflict, idx) => (
                      <div key={idx} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <p className="text-sm font-medium text-yellow-800">{conflict.type}</p>
                        <p className="text-sm text-yellow-700">{conflict.description}</p>
                        <p className="text-xs text-yellow-600 mt-1">💡 {conflict.suggestion}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 4. Handlungsempfehlungen */}
            {report.recommendations.length > 0 && (
              <div className="rounded-lg bg-white p-6 shadow-sm border border-indigo-200">
                <h3 className="text-lg font-semibold text-indigo-900 mb-4">💡 Automatische Handlungsempfehlungen</h3>
                <div className="space-y-3">
                  {report.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border ${
                        rec.priority === 'high'
                          ? 'bg-red-50 border-red-200'
                          : rec.priority === 'medium'
                            ? 'bg-yellow-50 border-yellow-200'
                            : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`rounded px-2 py-0.5 text-xs font-semibold ${
                                rec.priority === 'high'
                                  ? 'bg-red-100 text-red-800'
                                  : rec.priority === 'medium'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {rec.priority === 'high' ? '🔴 Hoch' :
                               rec.priority === 'medium' ? '🟡 Mittel' : '🔵 Niedrig'}
                            </span>
                            <span className="text-xs font-medium text-gray-500">{rec.category}</span>
                          </div>
                          <p className="text-sm font-medium text-gray-900">{rec.message}</p>
                          {rec.action && (
                            <p className="text-xs text-gray-600 mt-1">→ {rec.action}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

