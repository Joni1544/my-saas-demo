/**
 * Invoice Service Tests (vereinfacht)
 */
import { invoiceService } from '@/services/invoice/InvoiceService'
import { createFullTestSetup, createTestInvoice, createTestTemplate } from '../utils/testData'

describe('Invoice Service Tests', () => {
  let testSetup: Awaited<ReturnType<typeof createFullTestSetup>>

  beforeAll(async () => {
    testSetup = await createFullTestSetup()
  })

  afterAll(async () => {
    await testSetup.cleanup()
  })

  describe('generateInvoiceNumber', () => {
    it('sollte automatische Rechnungsnummer generieren', async () => {
      const invoiceNumber = await invoiceService.generateInvoiceNumber(testSetup.tenant.tenantId)

      expect(invoiceNumber).toBeDefined()
      expect(typeof invoiceNumber).toBe('string')
      expect(invoiceNumber).toMatch(/^RE-\d{4}-\d+$/)
    })
  })

  describe('getInvoice', () => {
    it('sollte Rechnung abrufen', async () => {
      const invoice = await createTestInvoice(testSetup.tenant.tenantId, testSetup.customer.id)

      const result = await invoiceService.getInvoice(invoice.id, testSetup.tenant.tenantId)

      expect(result).toBeDefined()
      expect(result?.id).toBe(invoice.id)
    })
  })

  describe('listInvoices', () => {
    it('sollte Rechnungen auflisten', async () => {
      await createTestInvoice(testSetup.tenant.tenantId, testSetup.customer.id)
      await createTestInvoice(testSetup.tenant.tenantId, testSetup.customer.id)

      const invoices = await invoiceService.listInvoices(testSetup.tenant.tenantId)

      expect(Array.isArray(invoices)).toBe(true)
      expect(invoices.length).toBeGreaterThanOrEqual(2)
    })
  })
})
