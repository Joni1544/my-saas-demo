/**
 * Payment Card Component
 * Hübsche Karte für einzelne Zahlungen
 */
'use client'

import { format } from 'date-fns'
import PaymentStatusBadge from './PaymentStatusBadge'

interface PaymentCardProps {
  payment: {
    id: string
    amount: number
    currency: string
    method: string
    status: string
    transactionId?: string | null
    reference?: string | null
    paidAt?: Date | null
    createdAt: Date
    customer?: {
      id: string
      firstName: string
      lastName: string
    } | null
    invoice?: {
      id: string
      invoiceNumber: string
    } | null
  }
  onClick?: () => void
  className?: string
}

const METHOD_ICONS: Record<string, string> = {
  STRIPE_CARD: '💳',
  STRIPE_TERMINAL: '🏧',
  APPLE_PAY: '🍏',
  GOOGLE_PAY: '🤖',
  PAYPAL: '🟦',
  BANK_TRANSFER: '🏦',
  CASH: '💵',
}

const METHOD_LABELS: Record<string, string> = {
  STRIPE_CARD: 'Kartenzahlung',
  STRIPE_TERMINAL: 'Terminal',
  APPLE_PAY: 'Apple Pay',
  GOOGLE_PAY: 'Google Pay',
  PAYPAL: 'PayPal',
  BANK_TRANSFER: 'Überweisung',
  CASH: 'Barzahlung',
}

export default function PaymentCard({ payment, onClick, className = '' }: PaymentCardProps) {
  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency || 'EUR',
    }).format(amount)
  }

  return (
    <div
      onClick={onClick}
      className={`rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{METHOD_ICONS[payment.method] || '💳'}</span>
            <div>
              <h3 className="font-semibold text-gray-900">
                {METHOD_LABELS[payment.method] || payment.method}
              </h3>
              <p className="text-sm text-gray-500">
                {format(new Date(payment.createdAt), 'dd.MM.yyyy HH:mm')}
              </p>
            </div>
          </div>

          {payment.customer && (
            <p className="mt-2 text-sm text-gray-600">
              {payment.customer.firstName} {payment.customer.lastName}
            </p>
          )}

          {payment.invoice && (
            <p className="mt-1 text-xs text-gray-500">
              Rechnung: {payment.invoice.invoiceNumber}
            </p>
          )}

          {payment.reference && (
            <p className="mt-1 text-xs text-gray-500">Ref: {payment.reference}</p>
          )}
        </div>

        <div className="text-right">
          <p className="text-lg font-bold text-gray-900">
            {formatAmount(payment.amount, payment.currency)}
          </p>
          <div className="mt-2">
            <PaymentStatusBadge status={payment.status as 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'} />
          </div>
        </div>
      </div>
    </div>
  )
}

