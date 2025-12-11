/**
 * EventBus Tests
 */
import { eventBus } from '@/events/EventBus'
import { createFullTestSetup, createTestInvoice, createTestPayment, createOverdueInvoice } from '../utils/testData'

describe('EventBus Tests', () => {
  let testSetup: Awaited<ReturnType<typeof createFullTestSetup>>

  beforeAll(async () => {
    testSetup = await createFullTestSetup()
  })

  afterAll(async () => {
    await testSetup.cleanup()
  })

  beforeEach(() => {
    // Event-Handler zurücksetzen
    jest.clearAllMocks()
  })

  describe('invoice.created Event', () => {
    it('sollte invoice.created Event emittieren', async () => {
      const handler = jest.fn()
      eventBus.subscribe('invoice.created', handler)

      const invoice = await createTestInvoice(testSetup.tenant.tenantId, testSetup.customer.id)

      // Event manuell emittieren (normalerweise würde InvoiceService das tun)
      eventBus.emit('invoice.created', {
        tenantId: testSetup.tenant.tenantId,
        invoiceId: invoice.id,
        amount: 100.0,
        customerId: testSetup.customer.id,
        timestamp: new Date(),
      })

      // Warte kurz auf Event-Verarbeitung
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(handler).toHaveBeenCalled()
    })
  })

  describe('invoice.overdue Event', () => {
    it('sollte invoice.overdue Event emittieren', async () => {
      const handler = jest.fn()
      eventBus.subscribe('invoice.overdue', handler)

      const invoice = await createOverdueInvoice(testSetup.tenant.tenantId, testSetup.customer.id, 5)

      eventBus.emit('invoice.overdue', {
        tenantId: testSetup.tenant.tenantId,
        invoiceId: invoice.id,
        dueDate: invoice.dueDate,
        timestamp: new Date(),
      })

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(handler).toHaveBeenCalled()
    })
  })

  describe('invoice.reminder_created Event', () => {
    it('sollte invoice.reminder_created Event emittieren', async () => {
      const handler = jest.fn()
      eventBus.subscribe('invoice.reminder_created', handler)

      const invoice = await createOverdueInvoice(testSetup.tenant.tenantId, testSetup.customer.id, 5)

      eventBus.emit('invoice.reminder_created', {
        tenantId: testSetup.tenant.tenantId,
        invoiceId: invoice.id,
        reminderId: 'test-reminder-id',
        level: 1,
        timestamp: new Date(),
      })

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(handler).toHaveBeenCalled()
    })
  })

  describe('invoice.reminder_sent Event', () => {
    it('sollte invoice.reminder_sent Event emittieren', async () => {
      const handler = jest.fn()
      eventBus.subscribe('invoice.reminder_sent', handler)

      eventBus.emit('invoice.reminder_sent', {
        tenantId: testSetup.tenant.tenantId,
        invoiceId: 'test-invoice-id',
        reminderId: 'test-reminder-id',
        level: 1,
        timestamp: new Date(),
      })

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(handler).toHaveBeenCalled()
    })
  })

  describe('payment.created Event', () => {
    it('sollte payment.created Event emittieren', async () => {
      const handler = jest.fn()
      eventBus.subscribe('payment.created', handler)

      const invoice = await createTestInvoice(testSetup.tenant.tenantId, testSetup.customer.id)
      const payment = await createTestPayment(testSetup.tenant.tenantId, invoice.id, testSetup.customer.id)

      eventBus.emit('payment.created', {
        tenantId: testSetup.tenant.tenantId,
        paymentId: payment.id,
        amount: 100.0,
        method: 'STRIPE_CARD',
        invoiceId: invoice.id,
        customerId: testSetup.customer.id,
        timestamp: new Date(),
      })

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(handler).toHaveBeenCalled()
    })
  })

  describe('ai.usage_recorded Event', () => {
    it('sollte ai.usage_recorded Event emittieren', async () => {
      const handler = jest.fn()
      eventBus.subscribe('ai.usage_recorded', handler)

      eventBus.emit('ai.usage_recorded', {
        tenantId: testSetup.tenant.tenantId,
        usageId: 'test-usage-id',
        feature: 'invoice_draft',
        totalTokens: 150,
        cost: 0.00045,
        aiProvider: 'openai',
        timestamp: new Date(),
      })

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(handler).toHaveBeenCalled()
    })
  })

  describe('Event-Verarbeitung', () => {
    it('sollte mehrere Handler für ein Event unterstützen', async () => {
      const handler1 = jest.fn()
      const handler2 = jest.fn()
      
      eventBus.subscribe('invoice.created', handler1)
      eventBus.subscribe('invoice.created', handler2)

      eventBus.emit('invoice.created', {
        tenantId: testSetup.tenant.tenantId,
        invoiceId: 'test-id',
        amount: 100.0,
        timestamp: new Date(),
      })

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(handler1).toHaveBeenCalled()
      expect(handler2).toHaveBeenCalled()
    })

    it('sollte Fehler in Handlern abfangen', async () => {
      const errorHandler = jest.fn(() => {
        throw new Error('Test Error')
      })
      const normalHandler = jest.fn()

      eventBus.subscribe('invoice.created', errorHandler)
      eventBus.subscribe('invoice.created', normalHandler)

      eventBus.emit('invoice.created', {
        tenantId: testSetup.tenant.tenantId,
        invoiceId: 'test-id',
        amount: 100.0,
        timestamp: new Date(),
      })

      await new Promise(resolve => setTimeout(resolve, 100))

      // Normaler Handler sollte trotzdem aufgerufen werden
      expect(normalHandler).toHaveBeenCalled()
    })
  })
})

