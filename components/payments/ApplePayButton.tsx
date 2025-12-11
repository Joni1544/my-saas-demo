/**
 * Apple Pay Button Component
 * Verwendet Stripe Payment Request Button für Apple Pay
 */
'use client'

import { useEffect, useRef, useCallback } from 'react'

interface StripeInstance {
  paymentRequest: (options: {
    country: string
    currency: string
    total: { label: string; amount: number }
    requestPayerName: boolean
    requestPayerEmail: boolean
  }) => {
    canMakePayment: () => Promise<{ applePay?: boolean; googlePay?: boolean } | null>
    on: (event: string, handler: (ev: PaymentMethodEvent) => void) => void
  }
  elements: () => {
    create: (type: string, options: { paymentRequest: unknown; style: unknown }) => {
      mount: (element: HTMLElement) => void
    }
  }
  confirmCardPayment: (secret: string, options: { payment_method: string }) => Promise<unknown>
}

interface PaymentMethodEvent {
  paymentMethod: { id: string }
  complete: (status: 'success' | 'fail') => void
}

interface ApplePayButtonProps {
  amount: number
  currency?: string
  onSuccess?: () => void
  onError?: (error: Error) => void
  disabled?: boolean
}

export default function ApplePayButton({
  amount,
  currency = 'EUR',
  onSuccess,
  onError,
  disabled = false,
}: ApplePayButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null)
  const stripeRef = useRef<StripeInstance | null>(null)

  const initializePaymentRequest = useCallback(async () => {
    if (!stripeRef.current || !buttonRef.current) return

    try {
      // Erstelle Payment Request
      const paymentRequest = stripeRef.current.paymentRequest({
        country: 'DE',
        currency: currency.toLowerCase(),
        total: {
          label: 'Gesamtbetrag',
          amount: Math.round(amount * 100), // In Cent
        },
        requestPayerName: true,
        requestPayerEmail: true,
      })

      // Prüfe ob Apple Pay verfügbar ist
      const canMakePayment = await paymentRequest.canMakePayment()

      if (canMakePayment && canMakePayment.applePay) {
        // Erstelle Button
        const elements = stripeRef.current.elements()
        const prButton = elements.create('paymentRequestButton', {
          paymentRequest,
          style: {
            paymentRequestButton: {
              type: 'buy',
              theme: 'black',
            },
          },
        })

        prButton.mount(buttonRef.current)

        // Event Handler
        paymentRequest.on('paymentmethod', async (ev: PaymentMethodEvent) => {
          try {
            // Erstelle Payment Intent
            const response = await fetch('/api/payments/stripe/intent', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                amount,
                currency,
              }),
            })

            if (!response.ok) throw new Error('Fehler beim Erstellen des Payment Intents')

            const { paymentIntent } = await response.json()

            // Bestätige Payment
            if (stripeRef.current) {
              stripeRef.current.confirmCardPayment(paymentIntent.clientSecret, {
                payment_method: ev.paymentMethod.id,
              })
            }

            ev.complete('success')
            onSuccess?.()
          } catch (error) {
            ev.complete('fail')
            onError?.(error instanceof Error ? error : new Error('Unbekannter Fehler'))
          }
        })
      } else {
        // Apple Pay nicht verfügbar
        buttonRef.current.innerHTML = '<p class="text-sm text-gray-500">Apple Pay nicht verfügbar</p>'
      }
    } catch (error) {
      console.error('[ApplePayButton] Error:', error)
      onError?.(error instanceof Error ? error : new Error('Fehler beim Initialisieren von Apple Pay'))
    }
  }, [amount, currency, onSuccess, onError])

  useEffect(() => {
    // Lade Stripe.js
    if (typeof window !== 'undefined' && !stripeRef.current) {
      const script = document.createElement('script')
      script.src = 'https://js.stripe.com/v3/'
      script.async = true
      script.onload = () => {
        if (window.Stripe) {
          const stripe = window.Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_dummy') as StripeInstance
          stripeRef.current = stripe
          initializePaymentRequest()
        }
      }
      document.body.appendChild(script)
    }

    return () => {
      // Cleanup
    }
  }, [initializePaymentRequest])

  return (
    <div className="w-full">
      <div ref={buttonRef} className="w-full" />
      {disabled && (
        <p className="mt-2 text-xs text-gray-500">Apple Pay ist deaktiviert</p>
      )}
    </div>
  )
}

// TypeScript Declaration für Stripe
declare global {
  interface Window {
    Stripe: (key: string) => StripeInstance
  }
}

