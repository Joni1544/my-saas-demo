/**
 * Record Payment Dialog Component
 * Dialog zum Erfassen einer Zahlung
 */
'use client'

import { useState, useEffect } from 'react'
import PaymentMethodSelector, { PaymentMethod } from './PaymentMethodSelector'

interface RecordPaymentDialogProps {
  open: boolean
  onClose: () => void
  invoiceId?: string
  customerId?: string
  amount?: number
  currency?: string
  onSuccess?: () => void
}

export default function RecordPaymentDialog({
  open,
  onClose,
  invoiceId,
  customerId,
  amount = 0,
  currency = 'EUR',
  onSuccess,
}: RecordPaymentDialogProps) {
  const [method, setMethod] = useState<PaymentMethod | undefined>()
  const [paymentAmount, setPaymentAmount] = useState<string>(amount.toString())
  const [reference, setReference] = useState('')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setPaymentAmount(amount.toString())
      setReference('')
      setPaymentDate(new Date().toISOString().split('T')[0])
      setMethod(undefined)
      setError(null)
    }
  }, [open, amount])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!method) {
      setError('Bitte wählen Sie eine Zahlungsmethode')
      return
    }

    const numAmount = parseFloat(paymentAmount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Bitte geben Sie einen gültigen Betrag ein')
      return
    }

    setLoading(true)

    try {
      // Erstelle Payment
      const createResponse = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId,
          customerId,
          amount: numAmount,
          currency,
          method,
          reference: reference || undefined,
        }),
      })

      if (!createResponse.ok) {
        const errorData = await createResponse.json()
        throw new Error(errorData.error || 'Fehler beim Erstellen der Zahlung')
      }

      const { payment } = await createResponse.json()

      // Wenn CASH oder BANK_TRANSFER, direkt als bezahlt markieren
      if (method === 'CASH' || method === 'BANK_TRANSFER') {
        const markPaidResponse = await fetch('/api/payments/mark-paid', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentId: payment.id,
            method,
            reference: reference || undefined,
            paidAt: paymentDate,
          }),
        })

        if (!markPaidResponse.ok) {
          throw new Error('Fehler beim Markieren der Zahlung als bezahlt')
        }
      }

      onSuccess?.()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateReceipt = () => {
    // Dummy-Funktion für Kassenzettel
    alert('Kassenzettel wird generiert... (Dummy-Funktion)')
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Zahlung erfassen</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Zahlungsart</label>
            <PaymentMethodSelector
              value={method}
              onChange={setMethod}
              disabled={loading}
              showDescription
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Betrag</label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="number"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                disabled={loading}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <span className="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-500">
                {currency}
              </span>
            </div>
          </div>

          {(method === 'BANK_TRANSFER' || method === 'CASH') && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Referenz {method === 'BANK_TRANSFER' && '(Verwendungszweck)'}
                {method === 'CASH' && '(Kassenbeleg-Nummer)'}
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                disabled={loading}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder={method === 'BANK_TRANSFER' ? 'Verwendungszweck eintragen' : 'Optional'}
              />
              {method === 'BANK_TRANSFER' && (
                <p className="mt-1 text-xs text-gray-500">
                  Bitte Verwendungszweck eintragen für Zuordnung
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Datum</label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              disabled={loading}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {method === 'CASH' && (
            <div className="rounded-md bg-yellow-50 p-3">
              <button
                type="button"
                onClick={handleGenerateReceipt}
                className="text-sm font-medium text-yellow-800 hover:text-yellow-900"
              >
                🧾 Kassenzettel generieren
              </button>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-red-50 p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading || !method}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Wird gespeichert...' : 'Zahlung speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

