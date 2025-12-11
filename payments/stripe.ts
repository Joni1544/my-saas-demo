/**
 * Stripe Integration für FuerstFlow (Basis-Implementierung)
 * Dummy-Modus bis API-Key eingebunden wird
 */
import Stripe from 'stripe'

// Stripe-Instanz (Dummy-Modus wenn kein API-Key)
const stripeApiKey = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key'
const isDummyMode = !process.env.STRIPE_SECRET_KEY || stripeApiKey === 'sk_test_dummy_key'

let stripe: Stripe | null = null

if (!isDummyMode) {
  try {
    stripe = new Stripe(stripeApiKey, {
      apiVersion: '2024-11-20.acacia' as any,
    })
    console.log('[Stripe] Initialized with API key')
  } catch (error) {
    console.error('[Stripe] Failed to initialize:', error)
  }
} else {
  console.log('[Stripe] Running in DUMMY mode (no API key provided)')
}

export interface PaymentIntentData {
  amount: number // in Cent
  currency?: string
  customerId?: string
  metadata?: Record<string, string>
}

export interface PaymentIntentResult {
  id: string
  clientSecret: string
  status: string
  amount: number
  currency: string
}

/**
 * Payment Intent erstellen
 */
export async function createPaymentIntent(data: PaymentIntentData): Promise<PaymentIntentResult> {
  if (isDummyMode || !stripe) {
    // Dummy-Implementierung
    return {
      id: `pi_dummy_${Date.now()}`,
      clientSecret: `pi_dummy_${Date.now()}_secret_dummy`,
      status: 'requires_payment_method',
      amount: data.amount,
      currency: data.currency || 'eur',
    }
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: data.amount,
      currency: data.currency || 'eur',
      customer: data.customerId,
      metadata: data.metadata || {},
      automatic_payment_methods: {
        enabled: true,
      },
    })

    return {
      id: paymentIntent.id,
      clientSecret: paymentIntent.client_secret || '',
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    }
  } catch (error) {
    console.error('[Stripe] Error creating payment intent:', error)
    throw error
  }
}

/**
 * Payment Intent abrufen
 */
export async function getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent | null> {
  if (isDummyMode || !stripe) {
    // Dummy-Implementierung
    return {
      id: paymentIntentId,
      object: 'payment_intent',
      amount: 1000,
      currency: 'eur',
      status: 'succeeded',
    } as Stripe.PaymentIntent
  }

  try {
    return await stripe.paymentIntents.retrieve(paymentIntentId)
  } catch (error) {
    console.error('[Stripe] Error retrieving payment intent:', error)
    return null
  }
}

/**
 * Webhook-Event verarbeiten
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event | null {
  if (isDummyMode || !stripe) {
    // Dummy-Implementierung
    try {
      return JSON.parse(payload.toString()) as Stripe.Event
    } catch {
      return null
    }
  }

  try {
    return stripe.webhooks.constructEvent(payload, signature, secret)
  } catch (error) {
    console.error('[Stripe] Webhook signature verification failed:', error)
    return null
  }
}

/**
 * Terminal Payment erstellen (für Stripe Terminal)
 */
export async function createTerminalPayment(data: {
  amount: number
  currency?: string
  description?: string
}): Promise<{ paymentIntentId: string; clientSecret: string }> {
  if (isDummyMode || !stripe) {
    // Dummy-Implementierung
    const paymentIntentId = `pi_terminal_dummy_${Date.now()}`
    return {
      paymentIntentId,
      clientSecret: `${paymentIntentId}_secret_dummy`,
    }
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: data.amount,
      currency: data.currency || 'eur',
      description: data.description,
      payment_method_types: ['card_present'],
      capture_method: 'automatic',
    })

    return {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret || '',
    }
  } catch (error) {
    console.error('[Stripe] Error creating terminal payment:', error)
    throw error
  }
}

/**
 * Stripe Webhook Event verarbeiten
 */
export async function handleStripeWebhook(event: Stripe.Event): Promise<void> {
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        // Wird in der Webhook-Route behandelt
        break
      case 'payment_intent.payment_failed':
        // Wird in der Webhook-Route behandelt
        break
      default:
        console.log(`[Stripe] Unhandled webhook event: ${event.type}`)
    }
  } catch (error) {
    console.error('[Stripe] Error handling webhook:', error)
    throw error
  }
}

export { stripe, isDummyMode }

