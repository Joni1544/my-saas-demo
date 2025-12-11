/**
 * Payment API Tests (vereinfacht - ohne Next.js Server)
 */
import { paymentService } from '@/services/payment/PaymentService'
import { createFullTestSetup, createTestInvoice, createTestPayment } from '../utils/testData'

describe('Payment Service Tests', () => {
  let testSetup: Awaited<ReturnType<typeof createFullTestSetup>>

  beforeAll(async () => {
    testSetup = await createFullTestSetup()
  })

  afterAll(async () => {
    try {
      await testSetup.cleanup()
    } catch (error) {
      console.error('Cleanup error:', error)
    }
  }, 10000) // 10 Sekunden Timeout für Cleanup

  describe('createPayment', () => {
    it('sollte eine Zahlung erstellen', async () => {
      const invoice = await createTestInvoice(testSetup.tenant.shopId, testSetup.customer.id)

      const result = await paymentService.createPayment({
        tenantId: testSetup.tenant.shopId, // Verwende shopId statt tenantId
        invoiceId: invoice.id,
        customerId: testSetup.customer.id,
        amount: 100.0,
        currency: 'EUR',
        method: 'STRIPE_CARD',
      })

      expect(result.payment).toBeDefined()
      expect(result.payment.amount).toBe(100.0)
      expect(result.payment.method).toBe('STRIPE_CARD')
      expect(result.payment.status).toBe('PENDING')
    })

    it('sollte Barzahlung erstellen', async () => {
      const invoice = await createTestInvoice(testSetup.tenant.shopId, testSetup.customer.id)

      const result = await paymentService.createPayment({
        tenantId: testSetup.tenant.shopId, // Verwende shopId statt tenantId
        invoiceId: invoice.id,
        amount: 50.0,
        method: 'CASH',
      })

      expect(result.payment.method).toBe('CASH')
    })
  })

  describe('markPaymentPaid', () => {
    it('sollte Zahlung als bezahlt markieren', async () => {
      const invoice = await createTestInvoice(testSetup.tenant.shopId, testSetup.customer.id)
      const payment = await createTestPayment(
        testSetup.tenant.shopId,
        invoice.id,
        testSetup.customer.id,
        100.0,
        'STRIPE_CARD',
        'PENDING'
      )

      const result = await paymentService.markPaymentPaid(payment.id)

      expect(result.payment.status).toBe('PAID')
      expect(result.payment.paidAt).toBeDefined()
    })
  })

  describe('listPayments', () => {
    it('sollte Zahlungen auflisten', async () => {
      await createTestPayment(testSetup.tenant.shopId, undefined, testSetup.customer.id, 100.0, 'STRIPE_CARD', 'PAID')
      await createTestPayment(testSetup.tenant.shopId, undefined, testSetup.customer.id, 50.0, 'CASH', 'PAID')

      const payments = await paymentService.listPayments(testSetup.tenant.shopId) // Verwende shopId statt tenantId

      expect(Array.isArray(payments)).toBe(true)
      expect(payments.length).toBeGreaterThanOrEqual(2)
    })
  })
})
