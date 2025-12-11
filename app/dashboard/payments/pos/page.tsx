/**
 * POS (Point of Sale) Kassenansicht
 * Mini-Kassensystem für Zahlungen
 */
'use client'

import { useState } from 'react'
import PaymentMethodSelector, { PaymentMethod } from '@/components/payments/PaymentMethodSelector'
import ApplePayButton from '@/components/payments/ApplePayButton'
import GooglePayButton from '@/components/payments/GooglePayButton'
import RecordPaymentDialog from '@/components/payments/RecordPaymentDialog'

export default function POSPage() {
  const [amount, setAmount] = useState('')
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | undefined>()
  const [showRecordDialog, setShowRecordDialog] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleQuickPayment = async (method: PaymentMethod) => {
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Bitte geben Sie einen gültigen Betrag ein')
      return
    }

    setSelectedMethod(method)
    setShowRecordDialog(true)
  }

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Bitte geben Sie einen gültigen Betrag ein')
      return
    }

    if (!selectedMethod) {
      alert('Bitte wählen Sie eine Zahlungsmethode')
      return
    }

    setLoading(true)

    try {
      if (selectedMethod === 'STRIPE_CARD' || selectedMethod === 'APPLE_PAY' || selectedMethod === 'GOOGLE_PAY') {
        // Für Stripe-basierte Zahlungen
        const response = await fetch('/api/payments/stripe/intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: numAmount,
            currency: 'EUR',
          }),
        })

        if (!response.ok) throw new Error('Fehler beim Erstellen des Payment Intents')

        const data = await response.json()
        alert(`Payment Intent erstellt: ${data.paymentIntent.id}`)
      } else {
        // Für andere Zahlungsmethoden öffne Dialog
        setShowRecordDialog(true)
      }
    } catch (error) {
      console.error('Fehler:', error)
      alert('Fehler bei der Zahlung')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🏧 Kasse</h1>
          <p className="mt-2 text-sm text-gray-600">Zahlung erfassen</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Eingabebereich */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Betrag eingeben</h2>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700">Betrag (€)</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-3 text-2xl font-semibold text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="0.00"
                autoFocus
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700">Zahlungsmethode</label>
              <PaymentMethodSelector
                value={selectedMethod}
                onChange={setSelectedMethod}
                showDescription
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !amount || !selectedMethod}
              className="w-full rounded-md bg-indigo-600 px-4 py-3 text-lg font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Wird verarbeitet...' : 'Zahlung abschließen'}
            </button>
          </div>

          {/* Schnell-Buttons */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Schnellzahlung</h2>
            <div className="space-y-3">
              {/* Apple Pay / Google Pay */}
              {amount && parseFloat(amount) > 0 && (
                <div className="space-y-3">
                  <ApplePayButton
                    amount={parseFloat(amount)}
                    currency="EUR"
                    onSuccess={() => {
                      alert('Zahlung erfolgreich!')
                      setAmount('')
                    }}
                  />
                  <GooglePayButton
                    amount={parseFloat(amount)}
                    currency="EUR"
                    onSuccess={() => {
                      alert('Zahlung erfolgreich!')
                      setAmount('')
                    }}
                  />
                </div>
              )}

              {/* Schnell-Buttons für verschiedene Methoden */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleQuickPayment('STRIPE_CARD')}
                  className="rounded-md bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700"
                >
                  💳 Kartenzahlung
                </button>
                <button
                  onClick={() => handleQuickPayment('CASH')}
                  className="rounded-md bg-green-600 px-4 py-3 text-sm font-medium text-white hover:bg-green-700"
                >
                  💵 Barzahlung
                </button>
                <button
                  onClick={() => handleQuickPayment('PAYPAL')}
                  className="rounded-md bg-yellow-500 px-4 py-3 text-sm font-medium text-white hover:bg-yellow-600"
                >
                  🟦 PayPal
                </button>
                <button
                  onClick={() => handleQuickPayment('BANK_TRANSFER')}
                  className="rounded-md bg-gray-600 px-4 py-3 text-sm font-medium text-white hover:bg-gray-700"
                >
                  🏦 Überweisung
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Record Payment Dialog */}
      <RecordPaymentDialog
        open={showRecordDialog}
        onClose={() => {
          setShowRecordDialog(false)
          setSelectedMethod(undefined)
        }}
        amount={parseFloat(amount) || 0}
        currency="EUR"
        onSuccess={() => {
          setAmount('')
          setSelectedMethod(undefined)
          setShowRecordDialog(false)
          alert('Zahlung erfolgreich erfasst!')
        }}
      />
    </div>
  )
}

