/**
 * Payment Automation UI
 * Einstellbare Regeln für Zahlungs-Automationen
 */
'use client'

import { useState, useEffect } from 'react'

interface AutomationRule {
  id: string
  name: string
  description: string
  enabled: boolean
  event: string
  action: string
}

export default function PaymentAutomationPage() {
  const [rules, setRules] = useState<AutomationRule[]>([
    {
      id: '1',
      name: 'E-Mail bei Zahlung',
      description: 'Kunde per E-Mail bedanken wenn Zahlung eingeht',
      enabled: false,
      event: 'payment.paid',
      action: 'send_email',
    },
    {
      id: '2',
      name: 'Mahnprozess starten',
      description: 'Aufgabe "Mahnprozess starten" erstellen bei Zahlungsausfall',
      enabled: true,
      event: 'payment.failed',
      action: 'create_task',
    },
    {
      id: '3',
      name: 'Verwendungszweck prüfen',
      description: 'Bei Banküberweisung Verwendungszweck automatisch prüfen',
      enabled: true,
      event: 'payment.paid',
      action: 'check_reference',
    },
    {
      id: '4',
      name: 'Tagesabschluss aktualisieren',
      description: 'Bei Barzahlung Tagesabschluss automatisch aktualisieren',
      enabled: true,
      event: 'payment.paid',
      action: 'update_daily_report',
    },
  ])

  const toggleRule = (id: string) => {
    setRules(
      rules.map((rule) => (rule.id === id ? { ...rule, enabled: !rule.enabled } : rule))
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Zahlungs-Automationen</h1>
          <p className="mt-2 text-sm text-gray-600">
            Konfiguriere automatische Aktionen bei Zahlungsereignissen
          </p>
        </div>

        <div className="space-y-4">
          {rules.map((rule) => (
            <div key={rule.id} className="rounded-lg bg-white p-6 shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">{rule.name}</h3>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        rule.enabled
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {rule.enabled ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{rule.description}</p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                    <span>Event: {rule.event}</span>
                    <span>•</span>
                    <span>Aktion: {rule.action}</span>
                  </div>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={rule.enabled}
                    onChange={() => toggleRule(rule.id)}
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300" />
                </label>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-lg bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            💡 <strong>Tipp:</strong> Diese Automationen werden automatisch ausgeführt, wenn die
            entsprechenden Events auftreten. Die Regeln werden in der Automation Engine verarbeitet.
          </p>
        </div>
      </div>
    </div>
  )
}

