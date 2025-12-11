/**
 * Payment Status Badge Component
 * Zeigt den Status einer Zahlung an
 */
'use client'

type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'

interface PaymentStatusBadgeProps {
  status: PaymentStatus
  className?: string
}

const STATUS_CONFIG: Record<PaymentStatus, { label: string; color: string; bgColor: string }> = {
  PENDING: {
    label: 'Ausstehend',
    color: 'text-yellow-800',
    bgColor: 'bg-yellow-100',
  },
  PAID: {
    label: 'Bezahlt',
    color: 'text-green-800',
    bgColor: 'bg-green-100',
  },
  FAILED: {
    label: 'Fehlgeschlagen',
    color: 'text-red-800',
    bgColor: 'bg-red-100',
  },
  REFUNDED: {
    label: 'Zurückerstattet',
    color: 'text-gray-800',
    bgColor: 'bg-gray-100',
  },
}

export default function PaymentStatusBadge({ status, className = '' }: PaymentStatusBadgeProps) {
  const config = STATUS_CONFIG[status]

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color} ${config.bgColor} ${className}`}
    >
      {config.label}
    </span>
  )
}

