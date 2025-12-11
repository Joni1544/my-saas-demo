/**
 * Invoice Status Badge Component
 * Zeigt den Status einer Rechnung an
 */
'use client'

type InvoiceStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus
  className?: string
}

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; color: string; bgColor: string }> = {
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
  OVERDUE: {
    label: 'Überfällig',
    color: 'text-red-800',
    bgColor: 'bg-red-100',
  },
  CANCELLED: {
    label: 'Storniert',
    color: 'text-gray-800',
    bgColor: 'bg-gray-100',
  },
}

export default function InvoiceStatusBadge({ status, className = '' }: InvoiceStatusBadgeProps) {
  const config = STATUS_CONFIG[status]

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color} ${config.bgColor} ${className}`}
    >
      {config.label}
    </span>
  )
}

