/**
 * AI Billing Page
 * Monatliche Abrechnungen
 */
'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import Link from 'next/link'
import { aiBillingService } from '@/services/ai/AiBillingService'

interface Billing {
  id: string
  month: number
  year: number
  totalTokens: number
  baseCost: number
  multiplier: number
  finalCost: number
  createdAt: Date
}

export default function AiBillingPage() {
  const [currentBill, setCurrentBill] = useState<Billing | null>(null)
  const [allBillings, setAllBillings] = useState<Billing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBillings()
  }, [])

  const fetchBillings = async () => {
    try {
      setLoading(true)
      
      // Aktuelle Monatsrechnung
      const currentResponse = await fetch('/api/ai-usage/billing/current')
      if (currentResponse.ok) {
        const currentData = await currentResponse.json()
        setCurrentBill(currentData.billing)
      }

      // Alle Abrechnungen
      const allResponse = await fetch('/api/ai-usage/billing')
      if (allResponse.ok) {
        const allData = await allResponse.json()
        setAllBillings(allData.billings || [])
      }
    } catch (error) {
      console.error('Fehler:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCost = (cost: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(cost)
  }

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) {
      return `${(tokens / 1000000).toFixed(2)}M`
    }
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(2)}K`
    }
    return tokens.toString()
  }

  const getMonthName = (month: number) => {
    return format(new Date(2024, month - 1, 1), 'MMMM')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Lade Abrechnungen...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/dashboard/ai-usage"
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            ← Zurück zur Übersicht
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">KI-Abrechnungen</h1>
          <p className="mt-2 text-sm text-gray-600">Monatliche Kostenübersicht</p>
        </div>

        {/* Aktuelle Monatsrechnung */}
        {currentBill && (
          <div className="mb-6 rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Aktuelle Monatsrechnung ({getMonthName(currentBill.month)} {currentBill.year})
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Gesamt Tokens</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {formatTokens(currentBill.totalTokens)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Basispreis</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {formatCost(currentBill.baseCost)}
                  </p>
                </div>
              </div>
              <div className="rounded-md bg-gray-50 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-gray-600">Multiplikator</span>
                  <span className="text-sm font-medium text-gray-900">
                    {currentBill.multiplier}x
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-200 pt-2">
                  <span className="text-lg font-semibold text-gray-900">Endpreis</span>
                  <span className="text-2xl font-bold text-indigo-600">
                    {formatCost(currentBill.finalCost)}
                  </span>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Formel: {formatCost(currentBill.baseCost)} × {currentBill.multiplier} ={' '}
                  {formatCost(currentBill.finalCost)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Alle Abrechnungen */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Vergangene Abrechnungen</h2>
          {allBillings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Monat
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Tokens
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Basispreis
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Multiplikator
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Endpreis
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {allBillings.map((billing) => (
                    <tr key={billing.id}>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {getMonthName(billing.month)} {billing.year}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {formatTokens(billing.totalTokens)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {formatCost(billing.baseCost)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {billing.multiplier}x
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">
                        {formatCost(billing.finalCost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-500">Noch keine Abrechnungen vorhanden</p>
          )}
        </div>
      </div>
    </div>
  )
}

