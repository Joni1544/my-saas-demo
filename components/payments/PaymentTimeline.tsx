/**
 * Payment Timeline Component
 * Chronologische Darstellung der Zahlungen
 */
'use client'

import { format } from 'date-fns'
import PaymentCard from './PaymentCard'

interface Payment {
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

interface PaymentTimelineProps {
  payments: Payment[]
  className?: string
}

export default function PaymentTimeline({ payments, className = '' }: PaymentTimelineProps) {
  // Gruppiere nach Datum
  const groupedPayments = payments.reduce((acc, payment) => {
    const date = format(new Date(payment.createdAt), 'yyyy-MM-dd')
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(payment)
    return acc
  }, {} as Record<string, Payment[]>)

  const sortedDates = Object.keys(groupedPayments).sort((a, b) => b.localeCompare(a))

  return (
    <div className={className}>
      {sortedDates.length === 0 ? (
        <p className="text-center text-gray-500">Keine Zahlungen vorhanden</p>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((date) => (
            <div key={date}>
              <div className="mb-3 flex items-center gap-2">
                <div className="h-px flex-1 bg-gray-200" />
                <h3 className="text-sm font-semibold text-gray-700">
                  {format(new Date(date), 'dd.MM.yyyy')}
                </h3>
                <div className="h-px flex-1 bg-gray-200" />
              </div>
              <div className="space-y-3">
                {groupedPayments[date].map((payment) => (
                  <PaymentCard key={payment.id} payment={payment} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

