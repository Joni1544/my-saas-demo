/**
 * Payment Method Selector Component
 * Dropdown zur Auswahl der Zahlungsmethode
 */
'use client'

import { useState } from 'react'

export type PaymentMethod =
  | 'STRIPE_CARD'
  | 'STRIPE_TERMINAL'
  | 'APPLE_PAY'
  | 'GOOGLE_PAY'
  | 'PAYPAL'
  | 'BANK_TRANSFER'
  | 'CASH'

interface PaymentMethodOption {
  value: PaymentMethod
  label: string
  icon?: string
  description?: string
}

const PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    value: 'STRIPE_CARD',
    label: '💳 Kartenzahlung',
    description: 'Kredit- oder Debitkarte',
  },
  {
    value: 'STRIPE_TERMINAL',
    label: '🏧 Terminal-Zahlung',
    description: 'Stripe Terminal Zahlung',
  },
  {
    value: 'APPLE_PAY',
    label: '🍏 Apple Pay',
    description: 'Zahlung mit Apple Pay',
  },
  {
    value: 'GOOGLE_PAY',
    label: '🤖 Google Pay',
    description: 'Zahlung mit Google Pay',
  },
  {
    value: 'PAYPAL',
    label: '🟦 PayPal',
    description: 'Zahlung mit PayPal',
  },
  {
    value: 'BANK_TRANSFER',
    label: '🏦 Überweisung',
    description: 'Banküberweisung',
  },
  {
    value: 'CASH',
    label: '💵 Barzahlung',
    description: 'Barzahlung',
  },
]

interface PaymentMethodSelectorProps {
  value?: PaymentMethod
  onChange: (method: PaymentMethod) => void
  disabled?: boolean
  showDescription?: boolean
}

export default function PaymentMethodSelector({
  value,
  onChange,
  disabled = false,
  showDescription = false,
}: PaymentMethodSelectorProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | undefined>(value)

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const method = e.target.value as PaymentMethod
    setSelectedMethod(method)
    onChange(method)
  }

  return (
    <div className="w-full">
      <select
        value={selectedMethod || ''}
        onChange={handleChange}
        disabled={disabled}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-500"
      >
        <option value="">Zahlungsmethode wählen...</option>
        {PAYMENT_METHODS.map((method) => (
          <option key={method.value} value={method.value}>
            {method.label}
          </option>
        ))}
      </select>
      {showDescription && selectedMethod && (
        <p className="mt-1 text-xs text-gray-500">
          {PAYMENT_METHODS.find((m) => m.value === selectedMethod)?.description}
        </p>
      )}
    </div>
  )
}

export { PAYMENT_METHODS }

