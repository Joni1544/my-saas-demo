/**
 * Customer Payments Section Component
 * Zeigt Zahlungsverhalten eines Kunden
 */
'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import PaymentCard from '@/components/payments/PaymentCard'
import PaymentStatusBadge from '@/components/payments/PaymentStatusBadge'

interface CustomerPaymentsSectionProps {
  customerId: string
}

interface Payment {
  id: string
  amount: number
  currency: string
  method: string
  status: string
  createdAt: string
}

interface PaymentStats {
  totalPaid: number
  averageAmount: number
  preferredMethod: string
  paymentCount: number
  openInvoices: number
  openInvoiceAmount: number
}

export default function CustomerPaymentsSection({ customerId }: CustomerPaymentsSectionProps) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState<PaymentStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPayments()
  }, [customerId])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/customers/${customerId}/payments`)
      if (!response.ok) throw new Error('Fehler beim Laden der Zahlungen')

      const data = await response.json()
      setPayments(data.payments || [])
      setStats(data.stats)
    } catch (error) {
      console.error('Fehler:', error)
    } finally {
      setLoading(false)
    }
  }, [customerId])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const getMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      STRIPE_CARD: '💳 Kartenzahlung',
      STRIPE_TERMINAL: '🏧 Terminal',
      APPLE_PAY: '🍏 Apple Pay',
      GOOGLE_PAY: '🤖 Google Pay',
      PAYPAL: '🟦 PayPal',
      BANK_TRANSFER: '🏦 Überweisung',
      CASH: '💵 Barzahlung',
    }
    return labels[method] || method
  }

  if (loading) {
    return <p className="text-gray-500">Lade Zahlungsdaten...</p>
  }

  return (
    <div className="space-y-6">
      {/* Statistiken */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-md bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Gesamt bezahlt</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatAmount(stats.totalPaid)}
            </p>
          </div>
          <div className="rounded-md bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Ø Betrag</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatAmount(stats.averageAmount)}
            </p>
          </div>
          <div className="rounded-md bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Bevorzugte Methode</p>
            <p className="text-sm font-semibold text-gray-900">
              {getMethodLabel(stats.preferredMethod || '')}
            </p>
          </div>
          <div className="rounded-md bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Offene Rechnungen</p>
            <p className="text-lg font-semibold text-red-600">
              {stats.openInvoices} ({formatAmount(stats.openInvoiceAmount)})
            </p>
          </div>
        </div>
      )}

      {/* Letzte Zahlungen */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-700">Letzte Zahlungen</h3>
        {payments.length === 0 ? (
          <p className="text-sm text-gray-500">Noch keine Zahlungen</p>
        ) : (
          <div className="space-y-2">
            {payments.slice(0, 5).map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between rounded-md border border-gray-200 p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">
                    {getMethodLabel(payment.method).split(' ')[0]}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {formatAmount(Number(payment.amount))}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(payment.createdAt), 'dd.MM.yyyy')}
                    </p>
                  </div>
                </div>
                <PaymentStatusBadge status={payment.status as 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

